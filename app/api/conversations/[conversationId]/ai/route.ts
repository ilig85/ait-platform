import { NextResponse } from "next/server"
import {
  ConversationAssistantError,
  runConversationAssistant,
  type ConversationAiAction,
} from "@/lib/ai/conversation-assistant"
import { createClient } from "@/lib/supabase/server"

export const runtime = "nodejs"
export const dynamic = "force-dynamic"

function isAction(value: unknown): value is ConversationAiAction {
  return value === "summary" || value === "draft"
}

export async function POST(
  request: Request,
  context: { params: Promise<{ conversationId: string }> },
) {
  let body: unknown
  try {
    body = await request.json()
  } catch {
    return NextResponse.json(
      { status: "invalid_request", message: "Choose an AI action and try again." },
      { status: 400 },
    )
  }

  const action = body !== null && typeof body === "object" && "action" in body
    ? (body as { action?: unknown }).action
    : undefined
  if (!isAction(action)) {
    return NextResponse.json(
      { status: "invalid_request", message: "The AI action must be summary or draft." },
      { status: 400 },
    )
  }

  const { conversationId } = await context.params
  const supabase = await createClient()

  const userResult = await supabase.auth.getUser()
  if (userResult.error || !userResult.data.user) {
    return NextResponse.json(
      { status: "unauthenticated", message: "Sign in again before using AI." },
      { status: 401 },
    )
  }

  const conversationResult = await supabase
    .from("conversations")
    .select("id, organization_id, contact_id")
    .eq("id", conversationId)
    .maybeSingle()

  if (conversationResult.error) {
    return NextResponse.json({ status: "server_error" }, { status: 500 })
  }
  if (!conversationResult.data) {
    return NextResponse.json(
      { status: "not_found", message: "This conversation is no longer available." },
      { status: 404 },
    )
  }

  const conversation = conversationResult.data
  const [membershipResult, contactResult, messagesResult] = await Promise.all([
    supabase
      .from("organization_members")
      .select("role")
      .eq("organization_id", conversation.organization_id)
      .eq("user_id", userResult.data.user.id)
      .maybeSingle(),
    supabase
      .from("contacts")
      .select("ai_analysis_allowed")
      .eq("organization_id", conversation.organization_id)
      .eq("id", conversation.contact_id)
      .maybeSingle(),
    supabase
      .from("messages")
      .select("direction, sender_type, text_body")
      .eq("organization_id", conversation.organization_id)
      .eq("conversation_id", conversation.id)
      .order("created_at", { ascending: true })
      .limit(60),
  ])

  if (membershipResult.error || contactResult.error || messagesResult.error) {
    return NextResponse.json({ status: "server_error" }, { status: 500 })
  }
  if (!membershipResult.data || !["owner", "manager"].includes(membershipResult.data.role)) {
    return NextResponse.json(
      { status: "forbidden", message: "Only organization owners and managers can use AI." },
      { status: 403 },
    )
  }
  if (!contactResult.data?.ai_analysis_allowed) {
    return NextResponse.json(
      {
        status: "ai_consent_required",
        message: "Record the customer's AI-analysis consent before using this conversation with AI.",
      },
      { status: 409 },
    )
  }

  try {
    const result = await runConversationAssistant({
      action,
      messages: messagesResult.data ?? [],
    })
    return NextResponse.json({ status: "completed", action, ...result })
  } catch (error) {
    if (error instanceof ConversationAssistantError) {
      const status = error.code === "not_configured"
        ? 503
        : error.code === "empty_conversation"
          ? 409
          : 502
      return NextResponse.json(
        { status: error.code, message: error.message },
        { status },
      )
    }

    return NextResponse.json({ status: "server_error" }, { status: 500 })
  }
}
