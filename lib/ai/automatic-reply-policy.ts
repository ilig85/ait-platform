export const AUTOMATIC_REPLY_CATEGORIES = [
  "greeting",
  "acknowledgement",
  "conversation_fact",
  "knowledge_fact",
  "needs_human",
] as const

export type AutomaticReplyCategory = (typeof AUTOMATIC_REPLY_CATEGORIES)[number]

export type AutomaticReplyDecision = {
  action: "reply" | "escalate"
  category: AutomaticReplyCategory
  confidence: number
  reply: string
  reason: string
}

const MAX_AUTOMATIC_REPLY_CHARACTERS = 1_000
const SAFE_REPLY_CATEGORIES = new Set<AutomaticReplyCategory>([
  "greeting",
  "acknowledgement",
  "conversation_fact",
  "knowledge_fact",
])

export function parseAutomaticReplyDecision(value: string): AutomaticReplyDecision | null {
  let parsed: unknown
  try {
    parsed = JSON.parse(value)
  } catch {
    return null
  }

  if (!parsed || typeof parsed !== "object") return null
  const candidate = parsed as Record<string, unknown>
  if (candidate.action !== "reply" && candidate.action !== "escalate") return null
  if (
    typeof candidate.category !== "string"
    || !AUTOMATIC_REPLY_CATEGORIES.includes(candidate.category as AutomaticReplyCategory)
  ) return null
  if (
    typeof candidate.confidence !== "number"
    || !Number.isFinite(candidate.confidence)
    || candidate.confidence < 0
    || candidate.confidence > 1
  ) return null
  if (typeof candidate.reply !== "string" || typeof candidate.reason !== "string") return null

  return {
    action: candidate.action,
    category: candidate.category as AutomaticReplyCategory,
    confidence: candidate.confidence,
    reply: candidate.reply.trim(),
    reason: candidate.reason.slice(0, 500),
  }
}

export function shouldSendAutomaticReply(
  decision: AutomaticReplyDecision,
  minimumConfidence: number,
): boolean {
  const replyLength = Array.from(decision.reply).length
  return decision.action === "reply"
    && SAFE_REPLY_CATEGORIES.has(decision.category)
    && decision.confidence >= minimumConfidence
    && replyLength > 0
    && replyLength <= MAX_AUTOMATIC_REPLY_CHARACTERS
}
