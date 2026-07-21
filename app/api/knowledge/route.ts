import { NextResponse } from "next/server"
import { getCurrentWorkspace } from "@/lib/data/workspace"
import { createClient } from "@/lib/supabase/server"

export const runtime = "nodejs"
export const dynamic = "force-dynamic"

const MAX_KNOWLEDGE_CHARACTERS = 30_000

export async function PATCH(request: Request) {
  let body: unknown
  try {
    body = await request.json()
  } catch {
    return NextResponse.json(
      { status: "invalid_request", message: "Business knowledge text is required." },
      { status: 400 },
    )
  }

  const content = body !== null && typeof body === "object" && "content" in body
    ? (body as { content?: unknown }).content
    : undefined
  if (typeof content !== "string" || content.length > MAX_KNOWLEDGE_CHARACTERS) {
    return NextResponse.json(
      { status: "invalid_request", message: "Knowledge must be text under 30,000 characters." },
      { status: 400 },
    )
  }

  const workspace = await getCurrentWorkspace()
  if (workspace.status === "unauthenticated") {
    return NextResponse.json(
      { status: "unauthenticated", message: "Sign in again before saving knowledge." },
      { status: 401 },
    )
  }
  if (workspace.status !== "ready") {
    return NextResponse.json(
      { status: "workspace_unavailable", message: "AIT could not load this organization." },
      { status: 409 },
    )
  }
  if (workspace.role !== "owner" && workspace.role !== "manager") {
    return NextResponse.json(
      { status: "forbidden", message: "Only owners and managers can edit business knowledge." },
      { status: 403 },
    )
  }

  const supabase = await createClient()
  const existingResult = await supabase
    .from("organization_knowledge")
    .select("organization_id")
    .eq("organization_id", workspace.organization.id)
    .maybeSingle()

  if (existingResult.error) {
    const migrationMissing = existingResult.error.code === "42P01"
      || existingResult.error.code === "PGRST205"
    return NextResponse.json(
      {
        status: migrationMissing ? "migration_required" : "server_error",
        message: migrationMissing
          ? "Apply the business-knowledge Supabase migration before saving."
          : "AIT could not load business knowledge.",
      },
      { status: migrationMissing ? 503 : 500 },
    )
  }

  const timestamp = new Date().toISOString()
  const writeResult = existingResult.data
    ? await supabase
        .from("organization_knowledge")
        .update({ content, updated_by: workspace.user.id, updated_at: timestamp })
        .eq("organization_id", workspace.organization.id)
    : await supabase
        .from("organization_knowledge")
        .insert({
          organization_id: workspace.organization.id,
          content,
          updated_by: workspace.user.id,
          updated_at: timestamp,
        })

  if (writeResult.error) {
    return NextResponse.json(
      { status: "server_error", message: "AIT could not save business knowledge." },
      { status: 500 },
    )
  }

  return NextResponse.json({ status: "saved", updatedAt: timestamp })
}
