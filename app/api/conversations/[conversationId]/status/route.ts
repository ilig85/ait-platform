import { NextResponse } from "next/server"
import { createClient } from "@/lib/supabase/server"

export const runtime = "nodejs"
export const dynamic = "force-dynamic"

export async function PATCH(
  _request: Request,
  context: { params: Promise<{ conversationId: string }> },
) {
  const { conversationId } = await context.params
  const supabase = await createClient()
  const userResult = await supabase.auth.getUser()

  if (userResult.error || !userResult.data.user) {
    return NextResponse.json(
      { status: "unauthenticated", message: "Sign in again before changing the conversation status." },
      { status: 401 },
    )
  }

  const conversationResult = await supabase
    .from("conversations")
    .select("id, organization_id")
    .eq("id", conversationId)
    .maybeSingle()

  if (conversationResult.error) {
    return NextResponse.json(
      { status: "server_error", message: "AIT could not load this conversation." },
      { status: 500 },
    )
  }
  if (!conversationResult.data) {
    return NextResponse.json(
      { status: "not_found", message: "This conversation is no longer available." },
      { status: 404 },
    )
  }

  const membershipResult = await supabase
    .from("organization_members")
    .select("role")
    .eq("organization_id", conversationResult.data.organization_id)
    .eq("user_id", userResult.data.user.id)
    .maybeSingle()

  if (membershipResult.error) {
    return NextResponse.json(
      { status: "server_error", message: "AIT could not verify your organization role." },
      { status: 500 },
    )
  }
  if (!membershipResult.data || !["owner", "manager"].includes(membershipResult.data.role)) {
    return NextResponse.json(
      { status: "forbidden", message: "Only organization owners and managers can clear a handoff." },
      { status: 403 },
    )
  }

  const updateResult = await supabase
    .from("conversations")
    .update({ needs_human: false })
    .eq("id", conversationId)
    .eq("organization_id", conversationResult.data.organization_id)
    .select("id, status, needs_human")
    .single()

  if (updateResult.error) {
    return NextResponse.json(
      { status: "server_error", message: "AIT could not clear the manager handoff." },
      { status: 500 },
    )
  }

  return NextResponse.json({
    status: "updated",
    conversation: {
      id: updateResult.data.id,
      conversationStatus: updateResult.data.status,
      needsHuman: updateResult.data.needs_human,
    },
  })
}
