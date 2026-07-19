import type {
  ProviderDeliveryStatus,
  ProviderWebhookEvent,
} from "../provider"

type JsonRecord = Record<string, unknown>

function record(value: unknown): JsonRecord | null {
  return value !== null && typeof value === "object" && !Array.isArray(value)
    ? value as JsonRecord
    : null
}

function array(value: unknown): unknown[] {
  return Array.isArray(value) ? value : []
}

function nonBlankString(value: unknown): string | null {
  return typeof value === "string" && value.trim().length > 0 ? value : null
}

function providerDate(value: unknown): Date | null {
  const timestamp = nonBlankString(value)
  if (!timestamp || !/^\d{1,13}$/.test(timestamp)) return null

  const date = new Date(Number(timestamp) * 1000)
  return Number.isNaN(date.getTime()) ? null : date
}

function profileName(contacts: unknown[], senderExternalId: string): string | null {
  for (const contactValue of contacts) {
    const contact = record(contactValue)
    if (!contact || contact.wa_id !== senderExternalId) continue
    const name = nonBlankString(record(contact.profile)?.name)
    return name ? Array.from(name).slice(0, 200).join("") : null
  }

  return null
}

function isDeliveryStatus(value: string): value is ProviderDeliveryStatus {
  return value === "sent" || value === "delivered" || value === "read" || value === "failed"
}

export function parseMetaWhatsAppWebhook(payload: unknown): ProviderWebhookEvent[] {
  const root = record(payload)
  if (root?.object !== "whatsapp_business_account") return []

  const events: ProviderWebhookEvent[] = []

  for (const entryValue of array(root.entry)) {
    const entry = record(entryValue)
    if (!entry) continue

    for (const changeValue of array(entry.changes)) {
      const change = record(changeValue)
      const value = record(change?.value)
      const metadata = record(value?.metadata)
      const externalRecipientId = nonBlankString(metadata?.phone_number_id)

      if (change?.field !== "messages" || !value || !externalRecipientId) continue

      const contacts = array(value.contacts)
      for (const messageValue of array(value.messages)) {
        const message = record(messageValue)
        const text = record(message?.text)
        const externalMessageId = nonBlankString(message?.id)
        const senderExternalId = nonBlankString(message?.from)
        const occurredAt = providerDate(message?.timestamp)
        const body = typeof text?.body === "string" ? text.body : null

        if (
          message?.type !== "text"
          || !externalMessageId
          || !senderExternalId
          || !occurredAt
          || body === null
        ) {
          continue
        }

        events.push({
          kind: "inbound_text",
          externalMessageId,
          externalRecipientId,
          senderExternalId,
          senderPhoneNumber: senderExternalId,
          senderDisplayName: profileName(contacts, senderExternalId),
          text: body,
          occurredAt,
        })
      }

      for (const statusValue of array(value.statuses)) {
        const statusRecord = record(statusValue)
        const externalMessageId = nonBlankString(statusRecord?.id)
        const status = nonBlankString(statusRecord?.status)
        const occurredAt = providerDate(statusRecord?.timestamp)

        if (!externalMessageId || !status || !isDeliveryStatus(status) || !occurredAt) continue

        events.push({
          kind: "delivery_status",
          externalMessageId,
          externalRecipientId,
          status,
          occurredAt,
        })
      }
    }
  }

  return events
}
