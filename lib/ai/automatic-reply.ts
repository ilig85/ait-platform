import "server-only"

import type { SupabaseClient } from "@supabase/supabase-js"
import {
  parseAutomaticReplyDecision,
  shouldSendAutomaticReply,
} from "@/lib/ai/automatic-reply-policy"
import { isServiceWindowOpen } from "@/lib/messaging/outbound-service"
import type {
  MessagingConnectionContext,
  MessagingProviderAdapter,
} from "@/lib/messaging/provider"
import type { Database } from "@/lib/supabase/database.types"

type ApplicationSupabaseClient = SupabaseClient<Database>

type StoredMessage = {
  id: string
  direction: "inbound" | "outbound"
  sender_type: string
  text_body: string | null
}

type OpenAiResponse = {
  output_text?: unknown
  output?: Array<{
    content?: Array<{
      type?: unknown
      text?: unknown
    }>
  }>
}

export type AutomaticReplyResult = {
  status:
    | "disabled"
    | "consent_required"
    | "unsupported_contact"
    | "service_window_closed"
    | "channel_unavailable"
    | "superseded"
    | "needs_human"
    | "duplicate"
    | "sent"
    | "provider_error"
  confidence?: number
  category?: string
}

const MAX_MESSAGES = 60
const MAX_TRANSCRIPT_CHARACTERS = 12_000

function extractOutputText(payload: OpenAiResponse) {
  if (typeof payload.output_text === "string" && payload.output_text.trim()) {
    return payload.output_text.trim()
  }

  return payload.output
    ?.flatMap((item) => item.content ?? [])
    .filter((item) => item.type === "output_text" && typeof item.text === "string")
    .map((item) => item.text as string)
    .join("\n")
    .trim() || null
}

function buildTranscript(messagesNewestFirst: StoredMessage[]) {
  const lines = messagesNewestFirst
    .slice(0, MAX_MESSAGES)
    .reverse()
    .filter((message) => message.text_body?.trim())
    .map((message) => {
      const speaker = message.direction === "inbound"
        ? "Customer"
        : message.sender_type === "ai"
          ? "AI assistant"
          : "Business"
      return `${speaker}: ${message.text_body!.trim()}`
    })

  while (lines.length > 1 && lines.join("\n").length > MAX_TRANSCRIPT_CHARACTERS) {
    lines.shift()
  }

  return lines.join("\n").slice(-MAX_TRANSCRIPT_CHARACTERS)
}

async function markNeedsHuman(
  admin: ApplicationSupabaseClient,
  organizationId: string,
  conversationId: string,
) {
  const result = await admin
    .from("conversations")
    .update({ needs_human: true, status: "pending" })
    .eq("id", conversationId)
    .eq("organization_id", organizationId)

  if (result.error) throw result.error
}

async function requestAutomaticReplyDecision(messages: StoredMessage[]) {
  const apiKey = process.env.OPENAI_API_KEY?.trim()
  if (!apiKey) return null

  const transcript = buildTranscript(messages)
  if (!transcript) return null

  let response: Response
  try {
    response = await fetch("https://api.openai.com/v1/responses", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${apiKey}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        model: process.env.OPENAI_MODEL?.trim() || "gpt-5.6-luna",
        instructions: [
          "You are AIT's safety gate for an automatic WhatsApp reply that will be sent without human review.",
          "Use only the supplied conversation. Never invent a fact, promise, price, stock status, policy, completed action, or customer detail.",
          "Choose reply only for a harmless greeting, a simple acknowledgement/thanks, or a fact explicitly written earlier by the Business.",
          "Choose escalate for any product identification, price, availability, stock, delivery, refund, payment, discount, policy, personal-data, medical, legal, safety, ambiguous, or action-requiring request.",
          "A customer's statement is not a verified business fact. Match the language of the customer's latest message.",
          "For escalate, return an empty reply. Confidence measures certainty that the reply is both safe and grounded.",
        ].join(" "),
        input: `Conversation transcript (oldest to newest):\n\n${transcript}`,
        max_output_tokens: 250,
        text: {
          format: {
            type: "json_schema",
            name: "automatic_reply_decision",
            strict: true,
            schema: {
              type: "object",
              additionalProperties: false,
              properties: {
                action: { type: "string", enum: ["reply", "escalate"] },
                category: {
                  type: "string",
                  enum: ["greeting", "acknowledgement", "conversation_fact", "needs_human"],
                },
                confidence: { type: "number", minimum: 0, maximum: 1 },
                reply: { type: "string" },
                reason: { type: "string" },
              },
              required: ["action", "category", "confidence", "reply", "reason"],
            },
          },
        },
      }),
      signal: AbortSignal.timeout(30_000),
    })
  } catch {
    return null
  }

  const payload = await response.json().catch(() => null) as OpenAiResponse | null
  if (!response.ok || !payload) return null
  const text = extractOutputText(payload)
  return text ? parseAutomaticReplyDecision(text) : null
}

export async function processAutomaticReply(input: {
  admin: ApplicationSupabaseClient
  adapter: MessagingProviderAdapter
  connection: MessagingConnectionContext
  inboundMessageId: string
  conversationId: string
  now?: Date
}): Promise<AutomaticReplyResult> {
  const { admin, connection, inboundMessageId, conversationId } = input
  const settingsResult = await admin
    .from("organization_ai_settings")
    .select("response_mode, auto_reply_min_confidence")
    .eq("organization_id", connection.organizationId)
    .maybeSingle()

  if (settingsResult.error) throw settingsResult.error
  if (settingsResult.data?.response_mode !== "auto") return { status: "disabled" }

  const conversationResult = await admin
    .from("conversations")
    .select("id, organization_id, channel_connection_id, contact_id, service_window_expires_at")
    .eq("id", conversationId)
    .eq("organization_id", connection.organizationId)
    .eq("channel_connection_id", connection.id)
    .maybeSingle()

  if (conversationResult.error) throw conversationResult.error
  const conversation = conversationResult.data
  if (!conversation) return { status: "superseded" }

  const [contactResult, channelResult, messagesResult] = await Promise.all([
    admin
      .from("contacts")
      .select("contact_type, ai_analysis_allowed, external_contact_id, phone_number")
      .eq("id", conversation.contact_id)
      .eq("organization_id", connection.organizationId)
      .maybeSingle(),
    admin
      .from("channel_connections")
      .select("status")
      .eq("id", connection.id)
      .eq("organization_id", connection.organizationId)
      .maybeSingle(),
    admin
      .from("messages")
      .select("id, direction, sender_type, text_body")
      .eq("conversation_id", conversationId)
      .eq("organization_id", connection.organizationId)
      .order("created_at", { ascending: false })
      .limit(MAX_MESSAGES),
  ])

  if (contactResult.error) throw contactResult.error
  if (channelResult.error) throw channelResult.error
  if (messagesResult.error) throw messagesResult.error

  const contact = contactResult.data
  if (!contact?.ai_analysis_allowed) {
    await markNeedsHuman(admin, connection.organizationId, conversationId)
    return { status: "consent_required" }
  }
  if (contact.contact_type !== "customer") {
    return { status: "unsupported_contact" }
  }
  if (channelResult.data?.status !== "connected" || input.adapter.provider !== connection.provider) {
    await markNeedsHuman(admin, connection.organizationId, conversationId)
    return { status: "channel_unavailable" }
  }
  if (!isServiceWindowOpen(conversation.service_window_expires_at, input.now ?? new Date())) {
    await markNeedsHuman(admin, connection.organizationId, conversationId)
    return { status: "service_window_closed" }
  }

  const messages = messagesResult.data ?? []
  const latestInbound = messages.find((message) => message.direction === "inbound")
  if (!latestInbound || latestInbound.id !== inboundMessageId) return { status: "superseded" }

  const decision = await requestAutomaticReplyDecision(messages)
  const minimumConfidence = Number(settingsResult.data.auto_reply_min_confidence)
  if (!decision || !shouldSendAutomaticReply(decision, minimumConfidence)) {
    await markNeedsHuman(admin, connection.organizationId, conversationId)
    return {
      status: "needs_human",
      confidence: decision?.confidence,
      category: decision?.category,
    }
  }

  const recipientExternalId = contact.external_contact_id ?? contact.phone_number
  if (!recipientExternalId) {
    await markNeedsHuman(admin, connection.organizationId, conversationId)
    return { status: "channel_unavailable" }
  }

  const pendingResult = await admin
    .from("messages")
    .insert({
      organization_id: connection.organizationId,
      channel_connection_id: connection.id,
      conversation_id: conversationId,
      direction: "outbound",
      sender_type: "ai",
      message_type: "text",
      text_body: decision.reply,
      delivery_status: "pending",
      reply_to_message_id: inboundMessageId,
      ai_analysis_allowed: true,
    })
    .select("id")
    .single()

  if (pendingResult.error) {
    if (pendingResult.error.code === "23505") return { status: "duplicate" }
    throw pendingResult.error
  }

  try {
    const sent = await input.adapter.sendText({
      connection,
      recipientExternalId,
      text: decision.reply,
    })
    const markedResult = await admin.rpc("ait_mark_outbound_message_sent", {
      target_message_id: pendingResult.data.id,
      target_organization_id: connection.organizationId,
      target_provider_message_id: sent.externalMessageId,
      target_provider_timestamp: sent.acceptedAt.toISOString(),
    })
    if (markedResult.error) throw markedResult.error
    if (!markedResult.data) throw new Error("Automatic outbound message could not be marked sent")

    return {
      status: "sent",
      confidence: decision.confidence,
      category: decision.category,
    }
  } catch {
    await admin
      .from("messages")
      .update({ delivery_status: "failed" })
      .eq("id", pendingResult.data.id)
      .eq("delivery_status", "pending")
    await markNeedsHuman(admin, connection.organizationId, conversationId)
    return {
      status: "provider_error",
      confidence: decision.confidence,
      category: decision.category,
    }
  }
}
