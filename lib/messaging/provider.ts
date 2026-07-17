export const PROVIDER_DELIVERY_STATUSES = ["sent", "delivered", "read", "failed"] as const

export type ProviderDeliveryStatus = (typeof PROVIDER_DELIVERY_STATUSES)[number]

export type ProviderWebhookEvent =
  | {
      kind: "inbound_text"
      externalMessageId: string
      externalRecipientId: string
      senderExternalId: string
      senderPhoneNumber: string
      senderDisplayName: string | null
      text: string
      occurredAt: Date
    }
  | {
      kind: "delivery_status"
      externalMessageId: string
      externalRecipientId: string
      status: ProviderDeliveryStatus
      occurredAt: Date
    }

export type MessagingConnectionContext = {
  id: string
  organizationId: string
  provider: string
  externalAddressId: string
  externalBusinessAccountId: string | null
}

export type ProviderTextSendRequest = {
  connection: MessagingConnectionContext
  recipientExternalId: string
  text: string
}

export type ProviderTextSendResult = {
  externalMessageId: string
  acceptedAt: Date
}

/**
 * The application depends on this provider-neutral boundary. Provider-specific
 * payloads, signatures, credentials, and HTTP calls stay behind adapters.
 */
export interface MessagingProviderAdapter {
  readonly provider: string
  verifyWebhookSignature(rawBody: Uint8Array, signature: string | null): boolean
  parseWebhook(payload: unknown): ProviderWebhookEvent[]
  sendText(request: ProviderTextSendRequest): Promise<ProviderTextSendResult>
}
