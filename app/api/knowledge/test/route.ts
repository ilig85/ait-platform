import { NextResponse } from "next/server"
import { getCurrentWorkspace } from "@/lib/data/workspace"
import { createClient } from "@/lib/supabase/server"

export const runtime = "nodejs"
export const dynamic = "force-dynamic"

const MAX_QUESTION_CHARACTERS = 500
const MAX_KNOWLEDGE_CHARACTERS = 30_000

type OpenAiResponse = {
  output_text?: unknown
  output?: Array<{
    content?: Array<{
      type?: unknown
      text?: unknown
    }>
  }>
}

type TestDecision = {
  action: "answer" | "needs_human"
  answer: string
  reason: string
}

function extractOutputText(payload: OpenAiResponse) {
  if (typeof payload.output_text === "string" && payload.output_text.trim()) {
    return payload.output_text.trim()
  }

  return payload.output
    ?.flatMap((item) => item.content ?? [])
    .filter((item) => item.type === "output_text" && typeof item.text === "string")
    .map((item) => item.text as string)
    .join("\n")
    .trim() || null
}

function parseDecision(text: string): TestDecision | null {
  try {
    const candidate = JSON.parse(text) as Partial<TestDecision>
    if (
      (candidate.action !== "answer" && candidate.action !== "needs_human")
      || typeof candidate.answer !== "string"
      || typeof candidate.reason !== "string"
    ) {
      return null
    }
    return {
      action: candidate.action,
      answer: candidate.answer.trim(),
      reason: candidate.reason.trim(),
    }
  } catch {
    return null
  }
}

export async function POST(request: Request) {
  let body: unknown
  try {
    body = await request.json()
  } catch {
    return NextResponse.json(
      { status: "invalid_request", message: "Enter a customer question to test." },
      { status: 400 },
    )
  }

  const question = body !== null && typeof body === "object" && "question" in body
    ? (body as { question?: unknown }).question
    : undefined
  if (
    typeof question !== "string"
    || !question.trim()
    || question.length > MAX_QUESTION_CHARACTERS
  ) {
    return NextResponse.json(
      { status: "invalid_request", message: "Enter a question under 500 characters." },
      { status: 400 },
    )
  }

  const workspace = await getCurrentWorkspace()
  if (workspace.status === "unauthenticated") {
    return NextResponse.json(
      { status: "unauthenticated", message: "Sign in again before testing knowledge." },
      { status: 401 },
    )
  }
  if (workspace.status !== "ready") {
    return NextResponse.json(
      { status: "workspace_unavailable", message: "AIT could not load this organization." },
      { status: 409 },
    )
  }

  const supabase = await createClient()
  const knowledgeResult = await supabase
    .from("organization_knowledge")
    .select("content")
    .eq("organization_id", workspace.organization.id)
    .maybeSingle()

  if (knowledgeResult.error) {
    const migrationMissing = knowledgeResult.error.code === "42P01"
      || knowledgeResult.error.code === "PGRST205"
    return NextResponse.json(
      {
        status: migrationMissing ? "migration_required" : "server_error",
        message: migrationMissing
          ? "Apply the business-knowledge Supabase migration before testing."
          : "AIT could not load business knowledge.",
      },
      { status: migrationMissing ? 503 : 500 },
    )
  }

  const knowledge = knowledgeResult.data?.content.trim().slice(0, MAX_KNOWLEDGE_CHARACTERS) ?? ""
  if (!knowledge) {
    return NextResponse.json(
      { status: "knowledge_required", message: "Add and save business knowledge before testing." },
      { status: 409 },
    )
  }

  const apiKey = process.env.OPENAI_API_KEY?.trim()
  if (!apiKey) {
    return NextResponse.json(
      { status: "configuration_required", message: "The OpenAI API key is not configured." },
      { status: 503 },
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
        instructions: [
          "You are previewing an AIT customer-service answer.",
          "Use only the supplied verified business knowledge.",
          "Never invent or infer a price, schedule, availability, policy, promise, completed action, or customer detail.",
          "Answer when every factual claim is explicitly supported by the verified knowledge.",
          "If required information is absent, ambiguous, or requires a business decision, choose needs_human and leave answer empty.",
          "Match the language of the customer's question and keep a supported answer concise and helpful.",
        ].join(" "),
        input: [
          "Verified business knowledge:",
          knowledge,
          "",
          "Customer question:",
          question.trim(),
        ].join("\n"),
        max_output_tokens: 180,
        text: {
          format: {
            type: "json_schema",
            name: "knowledge_test_decision",
            strict: true,
            schema: {
              type: "object",
              additionalProperties: false,
              properties: {
                action: { type: "string", enum: ["answer", "needs_human"] },
                answer: { type: "string" },
                reason: { type: "string" },
              },
              required: ["action", "answer", "reason"],
            },
          },
        },
      }),
      signal: AbortSignal.timeout(30_000),
    })
  } catch {
    return NextResponse.json(
      { status: "provider_error", message: "AIT could not reach the AI service." },
      { status: 502 },
    )
  }

  const payload = await response.json().catch(() => null) as OpenAiResponse | null
  if (!response.ok || !payload) {
    return NextResponse.json(
      { status: "provider_error", message: "The AI service could not complete this test." },
      { status: 502 },
    )
  }

  const outputText = extractOutputText(payload)
  const decision = outputText ? parseDecision(outputText) : null
  if (!decision) {
    return NextResponse.json(
      { status: "provider_error", message: "AIT could not safely interpret the AI response." },
      { status: 502 },
    )
  }

  if (decision.action === "needs_human" || !decision.answer) {
    return NextResponse.json({
      status: "needs_human",
      answer: "The saved knowledge does not fully support an answer, so AIT would send this question to a manager.",
    })
  }

  return NextResponse.json({ status: "answered", answer: decision.answer })
}
