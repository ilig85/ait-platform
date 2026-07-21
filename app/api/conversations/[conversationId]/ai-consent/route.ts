import { NextResponse } from "next/server"
import { createClient } from "@/lib/supabase/server"

export const runtime = "nodejs"
export const dynamic = "force-dynamic"

export async function PATCH(
  request: Request,
  context: { params: Promise<{ conversationId: string }> },
) {
  let body: unknown
  try {
    body = await request.json()
  } catch {
    return NextResponse.json(
      { status: "invalid_request", message: "A consent choice is required." },
      { status: 400 },
    )
  }

  const allowed = body !== null && typeof body === "object" && "allowed" in body
    ? (body as { allowed?: unknown }).allowed
    : undefined
  if (typeof allowed !== "boolean") {
    return NextResponse.json(
      { status: "invalid_request", message: "The allowed value must be true or false." },
      { status: 400 },
    )
  }

  const { conversationId } = await context.params
  const supabase = await createClient()
  const userResult = await supabase.auth.getUser()

  if (userResult.error || !userResult.data.user) {
    return NextResponse.json(
      { status: "unauthenticated", message: "Sign in again before changing consent." },
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
  const membershipResult = await supabase
    .from("organization_members")
    .select("role")
    .eq("organization_id", conversation.organization_id)
    .eq("user_id", userResult.data.user.id)
    .maybeSingle()

  if (membershipResult.error) {
    return NextResponse.json({ status: "server_error" }, { status: 500 })
  }
  if (!membershipResult.data || !["owner", "manager"].includes(membershipResult.data.role)) {
    return NextResponse.json(
      { status: "forbidden", message: "Only organization owners and managers can change AI consent." },
      { status: 403 },
    )
  }

  const now = new Date().toISOString()
  const consent = {
    organization_id: conversation.organization_id,
    contact_id: conversation.contact_id,
    consent_type: "ai_analysis",
    topic: "conversation_assistance",
    status: allowed ? "granted" as const : "revoked" as const,
    source: "ait_manager_dashboard",
    consented_at: allowed ? now : null,
    revoked_at: allowed ? null : now,
  }

  async function recordConsent() {
    return supabase
      .from("customer_consents")
      .upsert(consent, {
        onConflict: "organization_id,contact_id,consent_type,topic",
      })
  }

  async function updateContact() {
    return supabase
      .from("contacts")
      .update({ ai_analysis_allowed: allowed })
      .eq("organization_id", conversation.organization_id)
      .eq("id", conversation.contact_id)
  }

  const first = allowed ? await recordConsent() : await updateContact()
  if (first.error) {
    return NextResponse.json(
      { status: "server_error", message: "AIT could not save the consent choice." },
      { status: 500 },
    )
  }

  const second = allowed ? await updateContact() : await recordConsent()
  if (second.error) {
    return NextResponse.json(
      { status: "server_error", message: "AIT could not finish saving the consent choice." },
      { status: 500 },
    )
  }

  return NextResponse.json({
    status: "updated",
    aiAnalysisAllowed: allowed,
  })
}
