import type {
  MessagingConnectionContext,
  MessagingProviderAdapter,
  ProviderDeliveryStatus,
  ProviderWebhookEvent,
} from "./provider"

export type InboundTextWrite = {
  connection: MessagingConnectionContext
  externalMessageId: string
  senderExternalId: string
  senderPhoneNumber: string
  senderDisplayName: string | null
  text: string
  occurredAt: Date
}

export interface WebhookMessageStore {
  resolveConnection(externalRecipientId: string): Promise<MessagingConnectionContext | null>
  recordInboundText(message: InboundTextWrite): Promise<{ created: boolean }>
  advanceDeliveryStatus(input: {
    connection: MessagingConnectionContext
    externalMessageId: string
    status: ProviderDeliveryStatus
    occurredAt: Date
  }): Promise<{ advanced: boolean }>
}

export type WebhookProcessingResult = {
  received: number
  created: number
  duplicates: number
  statusesAdvanced: number
  ignoredUnmapped: number
}

export async function processProviderWebhook(
  adapter: MessagingProviderAdapter,
  payload: unknown,
  store: WebhookMessageStore,
): Promise<WebhookProcessingResult> {
  const events = adapter.parseWebhook(payload)
  const connectionCache = new Map<string, MessagingConnectionContext | null>()
  const result: WebhookProcessingResult = {
    received: events.length,
    created: 0,
    duplicates: 0,
    statusesAdvanced: 0,
    ignoredUnmapped: 0,
  }

  async function connectionFor(event: ProviderWebhookEvent) {
    if (!connectionCache.has(event.externalRecipientId)) {
      connectionCache.set(
        event.externalRecipientId,
        await store.resolveConnection(event.externalRecipientId),
      )
    }

    const connection = connectionCache.get(event.externalRecipientId) ?? null
    return connection?.provider === adapter.provider ? connection : null
  }

  for (const event of events) {
    const connection = await connectionFor(event)

    if (!connection) {
      result.ignoredUnmapped += 1
      continue
    }

    if (event.kind === "inbound_text") {
      const writeResult = await store.recordInboundText({
        connection,
        externalMessageId: event.externalMessageId,
        senderExternalId: event.senderExternalId,
        senderPhoneNumber: event.senderPhoneNumber,
        senderDisplayName: event.senderDisplayName,
        text: event.text,
        occurredAt: event.occurredAt,
      })

      if (writeResult.created) result.created += 1
      else result.duplicates += 1
      continue
    }

    const updateResult = await store.advanceDeliveryStatus({
      connection,
      externalMessageId: event.externalMessageId,
      status: event.status,
      occurredAt: event.occurredAt,
    })
    if (updateResult.advanced) result.statusesAdvanced += 1
  }

  return result
}
