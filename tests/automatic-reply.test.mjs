import assert from "node:assert/strict"
import test from "node:test"
import {
  parseAutomaticReplyDecision,
  shouldSendAutomaticReply,
} from "../lib/ai/automatic-reply-policy.ts"

test("automatic replies require a valid structured decision", () => {
  assert.equal(parseAutomaticReplyDecision("not json"), null)
  assert.equal(parseAutomaticReplyDecision(JSON.stringify({ action: "reply" })), null)

  const decision = parseAutomaticReplyDecision(JSON.stringify({
    action: "reply",
    category: "greeting",
    confidence: 0.97,
    reply: "  Саламатсызбы! Сизге кантип жардам бере алам?  ",
    reason: "Simple greeting",
  }))

  assert.deepEqual(decision, {
    action: "reply",
    category: "greeting",
    confidence: 0.97,
    reply: "Саламатсызбы! Сизге кантип жардам бере алам?",
    reason: "Simple greeting",
  })
})

test("the confidence gate blocks uncertain or unsafe automatic replies", () => {
  const safe = {
    action: "reply",
    category: "acknowledgement",
    confidence: 0.9,
    reply: "Спасибо!",
    reason: "Acknowledgement",
  }
  assert.equal(shouldSendAutomaticReply(safe, 0.9), true)
  assert.equal(shouldSendAutomaticReply({ ...safe, confidence: 0.899 }, 0.9), false)
  assert.equal(
    shouldSendAutomaticReply({ ...safe, category: "needs_human" }, 0.9),
    false,
  )
  assert.equal(shouldSendAutomaticReply({ ...safe, reply: "" }, 0.9), false)
})
