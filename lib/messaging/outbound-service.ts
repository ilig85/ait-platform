import type {
  MessagingConnectionContext,
  MessagingProviderAdapter,
} from "./provider"

const MAX_TEXT_LENGTH = 4096

type OrganizationRole = "owner" | "manager" | "member"

export type OutboundConversation = {
  id: string
  organizationId: string
  channelConnectionId: string
  contactId: string
  serviceWindowExpiresAt: string | null
}

export type OutboundConnection = MessagingConnectionContext & {
  status: string
  recipientExternalId: string
}

export interface OutboundMessageStore {
  getAuthenticatedUser(): Promise<{ id: string } | null>
  getConversationVisibleToUser(conversationId: string): Promise<OutboundConversation | null>
  getOrganizationRole(userId: string, organizationId: string): Promise<OrganizationRole | null>
  getConnectionForConversation(
    conversation: OutboundConversation,
  ): Promise<OutboundConnection | null>
  createPendingOutbound(input: {
    conversation: OutboundConversation
    connection: OutboundConnection
    text: string
  }): Promise<{ id: string }>
  markOutboundSent(input: {
    messageId: string
    externalMessageId: string
    acceptedAt: Date
    conversation: OutboundConversation
  }): Promise<void>
  markOutboundFailed(messageId: string): Promise<void>
}

export type SendServiceReplyResult =
  | { status: "sent"; messageId: string; externalMessageId: string }
  | { status: "invalid_message"; message: string }
  | { status: "unauthenticated" }
  | { status: "not_found" }
  | { status: "forbidden" }
  | { status: "channel_unavailable" }
  | { status: "approved_template_required"; serviceWindowExpiresAt: string | null }
  | { status: "provider_error" }

function validateText(text: unknown): { valid: true; text: string } | { valid: false; message: string } {
  if (typeof text !== "string") {
    return { valid: false, message: "Message text is required." }
  }

  if (text.trim().length === 0) {
    return { valid: false, message: "Message text cannot be empty." }
  }

  if (Array.from(text).length > MAX_TEXT_LENGTH) {
    return { valid: false, message: `Message text must be ${MAX_TEXT_LENGTH} characters or fewer.` }
  }

  return { valid: true, text }
}

export function isServiceWindowOpen(expiresAt: string | null, now: Date): boolean {
  if (!expiresAt) return false
  const expiry = new Date(expiresAt)
  return !Number.isNaN(expiry.getTime()) && expiry.getTime() > now.getTime()
}

export async function sendServiceWindowReply(
  input: { conversationId: string; text: unknown },
  dependencies: {
    store: OutboundMessageStore
    adapters: ReadonlyMap<string, MessagingProviderAdapter>
    now?: () => Date
  },
): Promise<SendServiceReplyResult> {
  const validated = validateText(input.text)
  if (!validated.valid) return { status: "invalid_message", message: validated.message }

  const user = await dependencies.store.getAuthenticatedUser()
  if (!user) return { status: "unauthenticated" }

  const conversation = await dependencies.store.getConversationVisibleToUser(input.conversationId)
  if (!conversation) return { status: "not_found" }

  const role = await dependencies.store.getOrganizationRole(user.id, conversation.organizationId)
  if (role !== "owner" && role !== "manager") return { status: "forbidden" }

  const now = dependencies.now?.() ?? new Date()
  if (!isServiceWindowOpen(conversation.serviceWindowExpiresAt, now)) {
    return {
      status: "approved_template_required",
      serviceWindowExpiresAt: conversation.serviceWindowExpiresAt,
    }
  }

  const connection = await dependencies.store.getConnectionForConversation(conversation)
  const adapter = connection ? dependencies.adapters.get(connection.provider) : null
  if (!connection || connection.status !== "connected" || !adapter) {
    return { status: "channel_unavailable" }
  }

  const pending = await dependencies.store.createPendingOutbound({
    conversation,
    connection,
    text: validated.text,
  })

  try {
    const sent = await adapter.sendText({
      connection,
      recipientExternalId: connection.recipientExternalId,
      text: validated.text,
    })
    await dependencies.store.markOutboundSent({
      messageId: pending.id,
      externalMessageId: sent.externalMessageId,
      acceptedAt: sent.acceptedAt,
      conversation,
    })

    return {
      status: "sent",
      messageId: pending.id,
      externalMessageId: sent.externalMessageId,
    }
  } catch {
    await dependencies.store.markOutboundFailed(pending.id)
    return { status: "provider_error" }
  }
}
