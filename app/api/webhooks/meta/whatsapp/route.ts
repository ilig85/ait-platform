import { NextResponse } from "next/server"
import { createMetaWebhookAdapter } from "@/lib/messaging/meta/adapter"
import { requiredServerEnv, verifyWebhookChallenge } from "@/lib/messaging/security"
import { SupabaseWebhookMessageStore } from "@/lib/messaging/supabase-stores"
import { processProviderWebhook } from "@/lib/messaging/webhook-service"
import { createAdminClient } from "@/lib/supabase/admin"

export const runtime = "nodejs"
export const dynamic = "force-dynamic"

const MAX_WEBHOOK_BYTES = 1_000_000

export async function GET(request: Request) {
  let verification
  try {
    verification = verifyWebhookChallenge(
      new URL(request.url).searchParams,
      requiredServerEnv("META_WHATSAPP_VERIFY_TOKEN"),
    )
  } catch {
    return NextResponse.json({ error: "Webhook verification is not configured." }, { status: 500 })
  }

  if (!verification.valid) {
    return NextResponse.json({ error: "Webhook verification failed." }, { status: 403 })
  }

  return new Response(verification.challenge, {
    status: 200,
    headers: { "Content-Type": "text/plain; charset=utf-8" },
  })
}

export async function POST(request: Request) {
  const contentLength = Number(request.headers.get("content-length") ?? "0")
  if (Number.isFinite(contentLength) && contentLength > MAX_WEBHOOK_BYTES) {
    return NextResponse.json({ error: "Webhook body is too large." }, { status: 413 })
  }

  const rawBody = new Uint8Array(await request.arrayBuffer())
  if (rawBody.byteLength > MAX_WEBHOOK_BYTES) {
    return NextResponse.json({ error: "Webhook body is too large." }, { status: 413 })
  }

  let adapter
  try {
    adapter = createMetaWebhookAdapter()
  } catch {
    return NextResponse.json({ error: "Webhook processing is not configured." }, { status: 500 })
  }

  if (!adapter.verifyWebhookSignature(rawBody, request.headers.get("x-hub-signature-256"))) {
    return NextResponse.json({ error: "Invalid webhook signature." }, { status: 401 })
  }

  let payload: unknown
  try {
    payload = JSON.parse(Buffer.from(rawBody).toString("utf8"))
  } catch {
    return NextResponse.json({ error: "Invalid webhook JSON." }, { status: 400 })
  }

  try {
    const result = await processProviderWebhook(
      adapter,
      payload,
      new SupabaseWebhookMessageStore(createAdminClient()),
    )
    return NextResponse.json({ acknowledged: true, ...result })
  } catch {
    return NextResponse.json({ error: "Webhook processing failed." }, { status: 500 })
  }
}
