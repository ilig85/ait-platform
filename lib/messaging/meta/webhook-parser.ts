import type {
  ProviderDeliveryStatus,
  ProviderWebhookEvent,
} from "../provider"

type JsonRecord = Record<string, unknown>

export type MetaWhatsAppWebhookDiagnostics = {
  recognizedObject: boolean
  entries: number
  invalidEntries: number
  changes: number
  invalidChanges: number
  messageFieldChanges: number
  ignoredNonMessageChanges: number
  changesMissingValue: number
  changesMissingPhoneNumberId: number
  messageObjects: number
  statusObjects: number
  parsedInboundTexts: number
  parsedDeliveryStatuses: number
  ignoredUnsupportedMessages: number
  ignoredMalformedMessages: number
  ignoredMalformedStatuses: number
}

type MetaWhatsAppWebhookAnalysis = {
  events: ProviderWebhookEvent[]
  diagnostics: MetaWhatsAppWebhookDiagnostics
}

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

function createDiagnostics(recognizedObject: boolean): MetaWhatsAppWebhookDiagnostics {
  return {
    recognizedObject,
    entries: 0,
    invalidEntries: 0,
    changes: 0,
    invalidChanges: 0,
    messageFieldChanges: 0,
    ignoredNonMessageChanges: 0,
    changesMissingValue: 0,
    changesMissingPhoneNumberId: 0,
    messageObjects: 0,
    statusObjects: 0,
    parsedInboundTexts: 0,
    parsedDeliveryStatuses: 0,
    ignoredUnsupportedMessages: 0,
    ignoredMalformedMessages: 0,
    ignoredMalformedStatuses: 0,
  }
}

function analyzeMetaWhatsAppWebhook(payload: unknown): MetaWhatsAppWebhookAnalysis {
  const root = record(payload)
  const recognizedObject = root?.object === "whatsapp_business_account"
  const diagnostics = createDiagnostics(recognizedObject)
  const events: ProviderWebhookEvent[] = []

  if (!recognizedObject || !root) return { events, diagnostics }

  const entries = array(root.entry)
  diagnostics.entries = entries.length

  for (const entryValue of entries) {
    const entry = record(entryValue)
    if (!entry) {
      diagnostics.invalidEntries += 1
      continue
    }

    const changes = array(entry.changes)
    diagnostics.changes += changes.length

    for (const changeValue of changes) {
      const change = record(changeValue)
      if (!change) {
        diagnostics.invalidChanges += 1
        continue
      }

      if (change.field !== "messages") {
        diagnostics.ignoredNonMessageChanges += 1
        continue
      }

      diagnostics.messageFieldChanges += 1
      const value = record(change.value)
      if (!value) {
        diagnostics.changesMissingValue += 1
        continue
      }

      const metadata = record(value.metadata)
      const externalRecipientId = nonBlankString(metadata?.phone_number_id)
      if (!externalRecipientId) {
        diagnostics.changesMissingPhoneNumberId += 1
        continue
      }

      const contacts = array(value.contacts)
      const messages = array(value.messages)
      diagnostics.messageObjects += messages.length

      for (const messageValue of messages) {
        const message = record(messageValue)
        if (!message) {
          diagnostics.ignoredMalformedMessages += 1
          continue
        }

        if (message.type !== "text") {
          if (nonBlankString(message.type)) diagnostics.ignoredUnsupportedMessages += 1
          else diagnostics.ignoredMalformedMessages += 1
          continue
        }

        const text = record(message.text)
        const externalMessageId = nonBlankString(message.id)
        const senderExternalId = nonBlankString(message.from)
        const occurredAt = providerDate(message.timestamp)
        const body = typeof text?.body === "string" ? text.body : null

        if (!externalMessageId || !senderExternalId || !occurredAt || body === null) {
          diagnostics.ignoredMalformedMessages += 1
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
        diagnostics.parsedInboundTexts += 1
      }

      const statuses = array(value.statuses)
      diagnostics.statusObjects += statuses.length

      for (const statusValue of statuses) {
        const statusRecord = record(statusValue)
        const externalMessageId = nonBlankString(statusRecord?.id)
        const status = nonBlankString(statusRecord?.status)
        const occurredAt = providerDate(statusRecord?.timestamp)

        if (!externalMessageId || !status || !isDeliveryStatus(status) || !occurredAt) {
          diagnostics.ignoredMalformedStatuses += 1
          continue
        }

        events.push({
          kind: "delivery_status",
          externalMessageId,
          externalRecipientId,
          status,
          occurredAt,
        })
        diagnostics.parsedDeliveryStatuses += 1
      }
    }
  }

  return { events, diagnostics }
}

export function diagnoseMetaWhatsAppWebhook(payload: unknown): MetaWhatsAppWebhookDiagnostics {
  return analyzeMetaWhatsAppWebhook(payload).diagnostics
}

export function parseMetaWhatsAppWebhook(payload: unknown): ProviderWebhookEvent[] {
  return analyzeMetaWhatsAppWebhook(payload).events
}
