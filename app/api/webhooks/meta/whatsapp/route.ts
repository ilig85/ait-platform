import { randomUUID } from "node:crypto"
import { after, NextResponse } from "next/server"
import { processAutomaticReply } from "@/lib/ai/automatic-reply"
import {
  createMetaOutboundAdapter,
  createMetaWebhookAdapter,
} from "@/lib/messaging/meta/adapter"
import { diagnoseMetaWhatsAppWebhook } from "@/lib/messaging/meta/webhook-parser"
import { requiredServerEnv, verifyWebhookChallenge } from "@/lib/messaging/security"
import { SupabaseWebhookMessageStore } from "@/lib/messaging/supabase-stores"
import {
  processProviderWebhook,
  type WebhookProcessingResult,
} from "@/lib/messaging/webhook-service"
import { createAdminClient } from "@/lib/supabase/admin"

export const runtime = "nodejs"
export const dynamic = "force-dynamic"

const MAX_WEBHOOK_BYTES = 1_000_000
const WEBHOOK_LOG_EVENT = "ait.meta_whatsapp_webhook"

type WebhookLogLevel = "info" | "warn" | "error"

function logWebhook(
  level: WebhookLogLevel,
  diagnosticId: string,
  outcome: string,
  startedAt: number,
  details: Record<string, unknown> = {},
) {
  console[level](WEBHOOK_LOG_EVENT, {
    diagnosticId,
    outcome,
    elapsedMs: Date.now() - startedAt,
    ...details,
  })
}

function safeErrorMetadata(error: unknown): Record<string, string> {
  const metadata: Record<string, string> = {}
  if (error instanceof Error && error.name) metadata.errorName = error.name

  if (error !== null && typeof error === "object") {
    const code = (error as Record<string, unknown>).code
    if (typeof code === "string" && /^[a-zA-Z0-9_.-]{1,64}$/.test(code)) {
      metadata.errorCode = code
    }
  }

  return metadata
}

function successfulOutcome(result: WebhookProcessingResult): string {
  if (result.created > 0) return "inbound_created"
  if (result.duplicates > 0) return "inbound_duplicate"
  if (result.received === 0) return "no_supported_events"
  if (result.ignoredUnmapped === result.received) return "unmapped_recipient"
  if (result.inboundTextsReceived === 0 && result.deliveryStatusesReceived > 0) {
    return result.statusesAdvanced > 0 ? "delivery_status_advanced" : "delivery_status_no_match"
  }
  return "processed"
}

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
  const diagnosticId = randomUUID()
  const startedAt = Date.now()
  const contentLength = Number(request.headers.get("content-length") ?? "0")

  if (Number.isFinite(contentLength) && contentLength > MAX_WEBHOOK_BYTES) {
    logWebhook("warn", diagnosticId, "body_too_large", startedAt, { declaredBytes: contentLength })
    return NextResponse.json(
      { error: "Webhook body is too large.", diagnosticId },
      { status: 413 },
    )
  }

  const rawBody = new Uint8Array(await request.arrayBuffer())
  if (rawBody.byteLength > MAX_WEBHOOK_BYTES) {
    logWebhook("warn", diagnosticId, "body_too_large", startedAt, { bodyBytes: rawBody.byteLength })
    return NextResponse.json(
      { error: "Webhook body is too large.", diagnosticId },
      { status: 413 },
    )
  }

  let adapter
  try {
    adapter = createMetaWebhookAdapter()
  } catch (error) {
    logWebhook("error", diagnosticId, "configuration_failed", startedAt, safeErrorMetadata(error))
    return NextResponse.json(
      { error: "Webhook processing is not configured.", diagnosticId },
      { status: 500 },
    )
  }

  if (!adapter.verifyWebhookSignature(rawBody, request.headers.get("x-hub-signature-256"))) {
    logWebhook("warn", diagnosticId, "invalid_signature", startedAt, { bodyBytes: rawBody.byteLength })
    return NextResponse.json(
      { error: "Invalid webhook signature.", diagnosticId },
      { status: 401 },
    )
  }

  let payload: unknown
  try {
    payload = JSON.parse(Buffer.from(rawBody).toString("utf8"))
  } catch {
    logWebhook("warn", diagnosticId, "invalid_json", startedAt, { bodyBytes: rawBody.byteLength })
    return NextResponse.json(
      { error: "Invalid webhook JSON.", diagnosticId },
      { status: 400 },
    )
  }

  const payloadDiagnostics = diagnoseMetaWhatsAppWebhook(payload)

  try {
    const result = await processProviderWebhook(
      adapter,
      payload,
      new SupabaseWebhookMessageStore(createAdminClient()),
      {
        onInboundTextRecorded: (candidate) => {
          after(async () => {
            try {
              const automaticReply = await processAutomaticReply({
                admin: createAdminClient(),
                adapter: createMetaOutboundAdapter(),
                connection: candidate.connection,
                inboundMessageId: candidate.messageId,
                conversationId: candidate.conversationId,
              })
              console.info("ait.automatic_reply", {
                diagnosticId,
                outcome: automaticReply.status,
                confidence: automaticReply.confidence,
                category: automaticReply.category,
              })
            } catch (error) {
              console.error("ait.automatic_reply", {
                diagnosticId,
                outcome: "processing_failed",
                ...safeErrorMetadata(error),
              })
            }
          })
        },
      },
    )
    const outcome = successfulOutcome(result)
    logWebhook("info", diagnosticId, outcome, startedAt, {
      payload: payloadDiagnostics,
      processing: result,
    })
    return NextResponse.json({
      acknowledged: true,
      diagnosticId,
      outcome,
      ...result,
    })
  } catch (error) {
    logWebhook("error", diagnosticId, "processing_failed", startedAt, {
      payload: payloadDiagnostics,
      ...safeErrorMetadata(error),
    })
    return NextResponse.json(
      { error: "Webhook processing failed.", diagnosticId },
      { status: 500 },
    )
  }
}
