import assert from "node:assert/strict"
import test from "node:test"
import {
  diagnoseMetaWhatsAppWebhook,
  parseMetaWhatsAppWebhook,
} from "../lib/messaging/meta/webhook-parser.ts"
import { processProviderWebhook } from "../lib/messaging/webhook-service.ts"

const RECIPIENT_ID = "phone-number-id-private"
const CUSTOMER_ID = "15551234567"
const MESSAGE_TEXT = "private customer message"

function payload({ messages = [], statuses = [], field = "messages", metadata = true } = {}) {
  return {
    object: "whatsapp_business_account",
    entry: [{
      changes: [{
        field,
        value: {
          metadata: metadata ? { phone_number_id: RECIPIENT_ID } : {},
          contacts: [{ wa_id: CUSTOMER_ID, profile: { name: "Private Customer" } }],
          messages,
          statuses,
        },
      }],
    }],
  }
}

test("diagnostics distinguish parsed text, status-only, and unsupported message deliveries", () => {
  const inbound = payload({
    messages: [{
      from: CUSTOMER_ID,
      id: "wamid.inbound-1",
      timestamp: "1784289600",
      type: "text",
      text: { body: MESSAGE_TEXT },
    }],
  })
  const statusOnly = payload({
    statuses: [{ id: "wamid.outbound-1", status: "delivered", timestamp: "1784289601" }],
  })
  const unsupported = payload({
    messages: [{
      from: CUSTOMER_ID,
      id: "wamid.image-1",
      timestamp: "1784289602",
      type: "image",
      image: { caption: MESSAGE_TEXT },
    }],
  })

  const inboundDiagnostics = diagnoseMetaWhatsAppWebhook(inbound)
  assert.equal(inboundDiagnostics.parsedInboundTexts, 1)
  assert.equal(inboundDiagnostics.parsedDeliveryStatuses, 0)
  assert.equal(parseMetaWhatsAppWebhook(inbound).length, 1)

  const statusDiagnostics = diagnoseMetaWhatsAppWebhook(statusOnly)
  assert.equal(statusDiagnostics.parsedInboundTexts, 0)
  assert.equal(statusDiagnostics.parsedDeliveryStatuses, 1)

  const unsupportedDiagnostics = diagnoseMetaWhatsAppWebhook(unsupported)
  assert.equal(unsupportedDiagnostics.messageObjects, 1)
  assert.equal(unsupportedDiagnostics.ignoredUnsupportedMessages, 1)
  assert.equal(parseMetaWhatsAppWebhook(unsupported).length, 0)
})

test("diagnostics explain ignored payload shapes without copying customer data", () => {
  const nonMessageChange = payload({ field: "account_update" })
  const missingRecipient = payload({
    metadata: false,
    messages: [{
      from: CUSTOMER_ID,
      id: "wamid.inbound-2",
      timestamp: "1784289600",
      type: "text",
      text: { body: MESSAGE_TEXT },
    }],
  })

  assert.equal(diagnoseMetaWhatsAppWebhook(nonMessageChange).ignoredNonMessageChanges, 1)
  assert.equal(diagnoseMetaWhatsAppWebhook(missingRecipient).changesMissingPhoneNumberId, 1)

  const serializedDiagnostics = JSON.stringify(diagnoseMetaWhatsAppWebhook(missingRecipient))
  assert.equal(serializedDiagnostics.includes(RECIPIENT_ID), false)
  assert.equal(serializedDiagnostics.includes(CUSTOMER_ID), false)
  assert.equal(serializedDiagnostics.includes(MESSAGE_TEXT), false)
})

test("processing counters distinguish inbound text from delivery-status events", async () => {
  const connection = {
    id: "connection-1",
    organizationId: "organization-1",
    provider: "meta_cloud",
    externalAddressId: RECIPIENT_ID,
    externalBusinessAccountId: "waba-1",
  }
  const events = [
    {
      kind: "inbound_text",
      externalMessageId: "wamid.inbound-1",
      externalRecipientId: RECIPIENT_ID,
      senderExternalId: CUSTOMER_ID,
      senderPhoneNumber: CUSTOMER_ID,
      senderDisplayName: "Private Customer",
      text: MESSAGE_TEXT,
      occurredAt: new Date("2026-07-17T12:00:00.000Z"),
    },
    {
      kind: "delivery_status",
      externalMessageId: "wamid.outbound-1",
      externalRecipientId: RECIPIENT_ID,
      status: "delivered",
      occurredAt: new Date("2026-07-17T12:00:01.000Z"),
    },
  ]
  const adapter = {
    provider: "meta_cloud",
    verifyWebhookSignature: () => true,
    parseWebhook: () => events,
    sendText: async () => { throw new Error("Unexpected provider call") },
  }
  const store = {
    resolveConnection: async () => connection,
    recordInboundText: async () => ({ created: true }),
    advanceDeliveryStatus: async () => ({ advanced: false }),
  }

  const result = await processProviderWebhook(adapter, {}, store)
  assert.deepEqual(result, {
    received: 2,
    inboundTextsReceived: 1,
    deliveryStatusesReceived: 1,
    created: 1,
    duplicates: 0,
    statusesAdvanced: 0,
    ignoredUnmapped: 0,
  })
})
