import assert from "node:assert/strict"
import { createHmac } from "node:crypto"
import test from "node:test"
import { parseMetaWhatsAppWebhook } from "../lib/messaging/meta/webhook-parser.ts"
import { sendServiceWindowReply } from "../lib/messaging/outbound-service.ts"
import { verifyHmacSha256Signature, verifyWebhookChallenge } from "../lib/messaging/security.ts"
import { shouldAdvanceDeliveryStatus } from "../lib/messaging/status.ts"
import { processProviderWebhook } from "../lib/messaging/webhook-service.ts"

const NOW = new Date("2026-07-17T12:00:00.000Z")

function connection(overrides = {}) {
  return {
    id: "connection-trusted",
    organizationId: "organization-trusted",
    provider: "meta_cloud",
    externalAddressId: "phone-number-id-trusted",
    externalBusinessAccountId: "waba-trusted",
    ...overrides,
  }
}

function inboundEvent(overrides = {}) {
  return {
    kind: "inbound_text",
    externalMessageId: "wamid.message-1",
    externalRecipientId: "phone-number-id-trusted",
    senderExternalId: "15551234567",
    senderPhoneNumber: "15551234567",
    senderDisplayName: "Sandbox Customer",
    text: "Hello",
    occurredAt: NOW,
    ...overrides,
  }
}

function fakeAdapter(events, sendText = async () => {
  throw new Error("Unexpected provider call")
}) {
  return {
    provider: "meta_cloud",
    verifyWebhookSignature: () => true,
    parseWebhook: () => events,
    sendText,
  }
}

test("webhook verification returns the challenge only for the correct private token", () => {
  const validQuery = new URLSearchParams({
    "hub.mode": "subscribe",
    "hub.verify_token": "private-random-token",
    "hub.challenge": "challenge-123",
  })
  assert.deepEqual(verifyWebhookChallenge(validQuery, "private-random-token"), {
    valid: true,
    challenge: "challenge-123",
  })

  validQuery.set("hub.verify_token", "wrong-token")
  assert.deepEqual(verifyWebhookChallenge(validQuery, "private-random-token"), { valid: false })
  validQuery.set("hub.verify_token", "private-random-token")
  validQuery.set("hub.mode", "unexpected")
  assert.deepEqual(verifyWebhookChallenge(validQuery, "private-random-token"), { valid: false })
})

test("valid Meta HMAC signatures are accepted", () => {
  const body = Buffer.from('{"object":"whatsapp_business_account"}')
  const secret = "test-only-app-secret"
  const signature = `sha256=${createHmac("sha256", secret).update(body).digest("hex")}`
  assert.equal(verifyHmacSha256Signature(body, signature, secret), true)
})

test("the Meta adapter parses text-message and delivery-status event shapes", () => {
  const events = parseMetaWhatsAppWebhook({
    object: "whatsapp_business_account",
    entry: [{
      changes: [{
        field: "messages",
        value: {
          metadata: { phone_number_id: "phone-number-id-trusted" },
          contacts: [{ wa_id: "15551234567", profile: { name: "Sandbox Customer" } }],
          messages: [{
            from: "15551234567",
            id: "wamid.inbound-1",
            timestamp: "1784289600",
            type: "text",
            text: { body: "Hello" },
          }],
          statuses: [{
            id: "wamid.outbound-1",
            status: "delivered",
            timestamp: "1784289601",
          }],
        },
      }],
    }],
  })

  assert.equal(events.length, 2)
  assert.equal(events[0].kind, "inbound_text")
  assert.equal(events[0].externalMessageId, "wamid.inbound-1")
  assert.equal(events[0].senderDisplayName, "Sandbox Customer")
  assert.equal(events[1].kind, "delivery_status")
  assert.equal(events[1].status, "delivered")
})

test("missing, malformed, and invalid Meta HMAC signatures are rejected", () => {
  const body = Buffer.from("signed bytes")
  assert.equal(verifyHmacSha256Signature(body, null, "test-secret"), false)
  assert.equal(verifyHmacSha256Signature(body, "sha256=not-hex", "test-secret"), false)
  const otherSignature = `sha256=${createHmac("sha256", "other-secret").update(body).digest("hex")}`
  assert.equal(verifyHmacSha256Signature(body, otherSignature, "test-secret"), false)
})

test("duplicate inbound provider IDs do not apply conversation effects twice", async () => {
  const seenMessageIds = new Set()
  let conversationEffects = 0
  const store = {
    resolveConnection: async () => connection(),
    recordInboundText: async (message) => {
      const created = !seenMessageIds.has(message.externalMessageId)
      seenMessageIds.add(message.externalMessageId)
      if (created) conversationEffects += 1
      return { created }
    },
    advanceDeliveryStatus: async () => ({ advanced: false }),
  }
  const adapter = fakeAdapter([inboundEvent()])

  const first = await processProviderWebhook(adapter, {}, store)
  const duplicate = await processProviderWebhook(adapter, {}, store)

  assert.equal(first.created, 1)
  assert.equal(duplicate.duplicates, 1)
  assert.equal(conversationEffects, 1)
})

test("organization scope comes only from the trusted phone-number mapping", async () => {
  let recordedOrganizationId
  const maliciousEvent = inboundEvent({ organizationId: "organization-from-untrusted-payload" })
  const store = {
    resolveConnection: async (phoneNumberId) => {
      assert.equal(phoneNumberId, "phone-number-id-trusted")
      return connection()
    },
    recordInboundText: async (message) => {
      recordedOrganizationId = message.connection.organizationId
      return { created: true }
    },
    advanceDeliveryStatus: async () => ({ advanced: false }),
  }

  await processProviderWebhook(fakeAdapter([maliciousEvent]), {}, store)
  assert.equal(recordedOrganizationId, "organization-trusted")
})

function outboundFixture({ user = { id: "user-1" }, role = "manager", expiresAt } = {}) {
  let pendingWrites = 0
  let providerCalls = 0
  const conversation = {
    id: "conversation-1",
    organizationId: "organization-trusted",
    channelConnectionId: "connection-trusted",
    contactId: "contact-1",
    serviceWindowExpiresAt: expiresAt ?? new Date(NOW.getTime() + 60_000).toISOString(),
  }
  const outboundConnection = {
    ...connection(),
    status: "connected",
    recipientExternalId: "15551234567",
  }
  const store = {
    getAuthenticatedUser: async () => user,
    getConversationVisibleToUser: async () => conversation,
    getOrganizationRole: async () => role,
    getConnectionForConversation: async () => outboundConnection,
    createPendingOutbound: async () => {
      pendingWrites += 1
      return { id: "message-local-1" }
    },
    markOutboundSent: async () => {},
    markOutboundFailed: async () => {},
  }
  const adapter = fakeAdapter([], async () => {
    providerCalls += 1
    return { externalMessageId: "wamid.outbound-1", acceptedAt: NOW }
  })

  return {
    store,
    adapters: new Map([[adapter.provider, adapter]]),
    counts: () => ({ pendingWrites, providerCalls }),
  }
}

test("outbound replies require authentication and manager-or-owner organization membership", async () => {
  const unauthenticated = outboundFixture({ user: null })
  const unauthenticatedResult = await sendServiceWindowReply(
    { conversationId: "conversation-1", text: "Reply" },
    { ...unauthenticated, now: () => NOW },
  )
  assert.equal(unauthenticatedResult.status, "unauthenticated")
  assert.deepEqual(unauthenticated.counts(), { pendingWrites: 0, providerCalls: 0 })

  const nonManager = outboundFixture({ role: "member" })
  const forbiddenResult = await sendServiceWindowReply(
    { conversationId: "conversation-1", text: "Reply" },
    { ...nonManager, now: () => NOW },
  )
  assert.equal(forbiddenResult.status, "forbidden")
  assert.deepEqual(nonManager.counts(), { pendingWrites: 0, providerCalls: 0 })
})

test("free-form outbound replies are blocked after the 24-hour service window", async () => {
  const fixture = outboundFixture({ expiresAt: new Date(NOW.getTime() - 1).toISOString() })
  const result = await sendServiceWindowReply(
    { conversationId: "conversation-1", text: "Reply" },
    { ...fixture, now: () => NOW },
  )

  assert.equal(result.status, "approved_template_required")
  assert.deepEqual(fixture.counts(), { pendingWrites: 0, providerCalls: 0 })
})

test("out-of-order delivery statuses cannot regress a message", () => {
  assert.equal(shouldAdvanceDeliveryStatus("pending", "delivered"), true)
  assert.equal(shouldAdvanceDeliveryStatus("delivered", "sent"), false)
  assert.equal(shouldAdvanceDeliveryStatus("read", "delivered"), false)
  assert.equal(shouldAdvanceDeliveryStatus("delivered", "failed"), false)
  assert.equal(shouldAdvanceDeliveryStatus("sent", "failed"), true)
  assert.equal(shouldAdvanceDeliveryStatus("failed", "read"), false)
})
