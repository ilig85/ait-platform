import "server-only"

export type ConversationAiAction = "summary" | "draft"

export type ConversationAiMessage = {
  direction: "inbound" | "outbound"
  senderType: string
  textBody: string | null
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

const MAX_MESSAGES = 60
const MAX_TRANSCRIPT_CHARACTERS = 12_000

export class ConversationAssistantError extends Error {
  constructor(
    readonly code: "not_configured" | "empty_conversation" | "provider_error",
    message: string,
  ) {
    super(message)
    this.name = "ConversationAssistantError"
  }
}

function buildTranscript(messages: ConversationAiMessage[]) {
  const lines = messages
    .filter((message) => message.textBody?.trim())
    .slice(-MAX_MESSAGES)
    .map((message) => {
      const speaker = message.direction === "inbound"
        ? "Customer"
        : message.senderType === "ai"
          ? "AI assistant"
          : "Business"
      return `${speaker}: ${message.textBody!.trim()}`
    })

  while (lines.length > 1 && lines.join("\n").length > MAX_TRANSCRIPT_CHARACTERS) {
    lines.shift()
  }

  return lines.join("\n").slice(-MAX_TRANSCRIPT_CHARACTERS)
}

function instructionsFor(action: ConversationAiAction) {
  if (action === "summary") {
    return [
      "You are AIT's privacy-conscious customer support copilot.",
      "Summarize only the supplied conversation.",
      "Return four short sections: Customer need, Key facts, Current status, Recommended next step.",
      "Use plain text with concise bullet points.",
      "Do not invent facts, promises, names, prices, or policies.",
    ].join(" ")
  }

  return [
    "You are AIT's privacy-conscious customer support copilot.",
    "Write one concise WhatsApp reply for a human manager to review.",
    "Use the same language as the customer's latest message.",
    "Be helpful and natural, but do not invent facts, promises, prices, policies, or completed actions.",
    "If important information is missing, ask one clear follow-up question.",
    "Return only the reply text with no labels, quotation marks, or markdown.",
  ].join(" ")
}

function extractOutputText(payload: OpenAiResponse) {
  if (typeof payload.output_text === "string" && payload.output_text.trim()) {
    return payload.output_text.trim()
  }

  const outputText = payload.output
    ?.flatMap((item) => item.content ?? [])
    .filter((item) => item.type === "output_text" && typeof item.text === "string")
    .map((item) => item.text as string)
    .join("\n")
    .trim()

  return outputText || null
}

export async function runConversationAssistant(input: {
  action: ConversationAiAction
  messages: ConversationAiMessage[]
}) {
  const apiKey = process.env.OPENAI_API_KEY?.trim()
  if (!apiKey) {
    throw new ConversationAssistantError(
      "not_configured",
      "AI is not configured yet. Add OPENAI_API_KEY to the Vercel project.",
    )
  }

  const transcript = buildTranscript(input.messages)
  if (!transcript) {
    throw new ConversationAssistantError(
      "empty_conversation",
      "This conversation has no text messages to analyze.",
    )
  }

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
        instructions: instructionsFor(input.action),
        input: `Conversation transcript (oldest to newest):\n\n${transcript}`,
        max_output_tokens: input.action === "summary" ? 500 : 250,
      }),
      signal: AbortSignal.timeout(30_000),
    })
  } catch {
    throw new ConversationAssistantError(
      "provider_error",
      "AIT could not reach the AI provider. Try again in a moment.",
    )
  }

  const payload = await response.json().catch(() => null) as OpenAiResponse | null
  if (!response.ok || !payload) {
    throw new ConversationAssistantError(
      "provider_error",
      "The AI provider could not complete this request. Check the Vercel AI configuration.",
    )
  }

  const text = extractOutputText(payload)
  if (!text) {
    throw new ConversationAssistantError(
      "provider_error",
      "The AI provider returned an empty response. Try again.",
    )
  }

  return {
    text,
    model: process.env.OPENAI_MODEL?.trim() || "gpt-5.6-luna",
  }
}
