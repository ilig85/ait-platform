import { NextResponse } from "next/server"
import { z } from "zod"
import { getCurrentWorkspace } from "@/lib/data/workspace"
import { baileysWorkerConfig, callBaileysWorker } from "@/lib/messaging/baileys/client"
import { createAdminClient } from "@/lib/supabase/admin"

export const runtime = "nodejs"
export const dynamic = "force-dynamic"

const pairingSchema = z.object({
  phoneNumber: z.string().min(8).max(30),
})

function normalizedPhone(value: string): string | null {
  const digits = value.replace(/\D/g, "")
  return /^\d{8,15}$/.test(digits) ? digits : null
}

async function ownerWorkspace() {
  const workspace = await getCurrentWorkspace()
  if (workspace.status === "unauthenticated") {
    return { response: NextResponse.json({ status: "unauthenticated" }, { status: 401 }) } as const
  }
  if (workspace.status !== "ready") {
    return { response: NextResponse.json({ status: "workspace_unavailable" }, { status: 409 }) } as const
  }
  if (workspace.role !== "owner") {
    return {
      response: NextResponse.json(
        { status: "forbidden", message: "Only an organization owner can connect WhatsApp." },
        { status: 403 },
      ),
    } as const
  }
  return { workspace } as const
}

export async function GET() {
  const resolved = await ownerWorkspace()
  if ("response" in resolved) return resolved.response

  const admin = createAdminClient()
  const { data, error } = await admin
    .from("channel_connections")
    .select("id, status, connected_phone_number, display_name, last_error")
    .eq("organization_id", resolved.workspace.organization.id)
    .eq("provider", "baileys")
    .eq("channel_type", "whatsapp")
    .order("created_at", { ascending: true })
    .limit(1)
    .maybeSingle()

  if (error) return NextResponse.json({ status: "server_error" }, { status: 500 })
  return NextResponse.json({
    status: data?.status ?? "disconnected",
    connectionId: data?.id ?? null,
    phoneNumber: data?.connected_phone_number ?? null,
    displayName: data?.display_name ?? null,
    message: data?.last_error ?? null,
  })
}

export async function POST(request: Request) {
  const resolved = await ownerWorkspace()
  if ("response" in resolved) return resolved.response
  if (!baileysWorkerConfig()) {
    return NextResponse.json(
      { status: "configuration_required", message: "The Baileys worker is not configured yet." },
      { status: 503 },
    )
  }

  let input: z.infer<typeof pairingSchema>
  try {
    input = pairingSchema.parse(await request.json())
  } catch {
    return NextResponse.json(
      { status: "invalid_phone", message: "Enter a WhatsApp number with its country code." },
      { status: 400 },
    )
  }
  const phoneNumber = normalizedPhone(input.phoneNumber)
  if (!phoneNumber) {
    return NextResponse.json(
      { status: "invalid_phone", message: "Enter 8 to 15 digits including the country code." },
      { status: 400 },
    )
  }

  const admin = createAdminClient()
  const organizationId = resolved.workspace.organization.id
  const existing = await admin
    .from("channel_connections")
    .select("id, status, external_account_id")
    .eq("organization_id", organizationId)
    .eq("provider", "baileys")
    .eq("channel_type", "whatsapp")
    .order("created_at", { ascending: true })
    .limit(1)
    .maybeSingle()
  if (existing.error) return NextResponse.json({ status: "server_error" }, { status: 500 })

  if (existing.data?.status === "connected" && existing.data.external_account_id?.includes(phoneNumber)) {
    return NextResponse.json({ status: "connected", connectionId: existing.data.id })
  }

  const connectionValues = {
    organization_id: organizationId,
    channel_type: "whatsapp",
    provider: "baileys",
    status: "connecting" as const,
    external_account_id: phoneNumber,
    connected_phone_number: `+${phoneNumber}`,
    display_name: "WhatsApp",
    capabilities: {
      inbound: true,
      outbound: true,
      linked_device: true,
      text_only: true,
    },
    disconnected_at: null,
    last_error: null,
  }
  const saved = existing.data
    ? await admin
        .from("channel_connections")
        .update(connectionValues)
        .eq("id", existing.data.id)
        .eq("organization_id", organizationId)
        .select("id")
        .single()
    : await admin
        .from("channel_connections")
        .insert(connectionValues)
        .select("id")
        .single()

  if (saved.error || !saved.data) {
    return NextResponse.json({ status: "server_error" }, { status: 500 })
  }

  try {
    const result = await callBaileysWorker<{ status: string; code: string }>(
      `/connections/${encodeURIComponent(saved.data.id)}/pairing-code`,
      { phoneNumber },
    )
    if (!result.code) throw new Error("WhatsApp did not return a pairing code")
    return NextResponse.json({
      status: "pairing_code_ready",
      connectionId: saved.data.id,
      code: result.code,
    }, { status: 201 })
  } catch (error) {
    const message = error instanceof Error ? error.message.slice(0, 300) : "WhatsApp pairing failed"
    await admin
      .from("channel_connections")
      .update({ status: "error", last_error: message })
      .eq("id", saved.data.id)
      .eq("organization_id", organizationId)
    return NextResponse.json(
      { status: "connection_failed", message: "AIT could not create a WhatsApp pairing code. Please try again." },
      { status: 502 },
    )
  }
}
