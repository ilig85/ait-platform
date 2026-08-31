import { NextResponse } from "next/server"
import { BaileysWhatsAppAdapter } from "@/lib/messaging/baileys/adapter"
import { createMetaOutboundAdapter } from "@/lib/messaging/meta/adapter"
import { SupabaseMetaWhatsAppCredentialResolver } from "@/lib/messaging/meta/credential-resolver"
import { sendServiceWindowReply } from "@/lib/messaging/outbound-service"
import type { MessagingProviderAdapter } from "@/lib/messaging/provider"
import { SupabaseOutboundMessageStore } from "@/lib/messaging/supabase-stores"
import { createAdminClient } from "@/lib/supabase/admin"
import { createClient } from "@/lib/supabase/server"

export const runtime = "nodejs"
export const dynamic = "force-dynamic"

export async function POST(
  request: Request,
  context: { params: Promise<{ conversationId: string }> },
) {
  let body: unknown
  try {
    body = await request.json()
  } catch {
    return NextResponse.json(
      { status: "invalid_message", message: "A JSON body with message text is required." },
      { status: 400 },
    )
  }

  const text = body !== null && typeof body === "object" && "text" in body
    ? (body as { text?: unknown }).text
    : undefined
  const { conversationId } = await context.params

  try {
    const userClient = await createClient()
    const admin = createAdminClient()
    const metaAdapter = createMetaOutboundAdapter(
      new SupabaseMetaWhatsAppCredentialResolver(admin),
    )
    const baileysAdapter = new BaileysWhatsAppAdapter()
    const adapters = new Map<string, MessagingProviderAdapter>([
      [metaAdapter.provider, metaAdapter],
      [baileysAdapter.provider, baileysAdapter],
    ])
    const result = await sendServiceWindowReply(
      { conversationId, text },
      {
        store: new SupabaseOutboundMessageStore(userClient, admin),
        adapters,
      },
    )

    switch (result.status) {
      case "sent":
        return NextResponse.json(result, { status: 201 })
      case "invalid_message":
        return NextResponse.json(result, { status: 400 })
      case "unauthenticated":
        return NextResponse.json(result, { status: 401 })
      case "not_found":
        return NextResponse.json(result, { status: 404 })
      case "forbidden":
        return NextResponse.json(result, { status: 403 })
      case "approved_template_required":
        return NextResponse.json({
          ...result,
          message: "The 24-hour customer-service window is closed.",
        }, { status: 409 })
      case "channel_unavailable":
        return NextResponse.json(result, { status: 409 })
      case "provider_error":
        return NextResponse.json(result, { status: 502 })
    }
  } catch {
    return NextResponse.json({ status: "server_error" }, { status: 500 })
  }
}
