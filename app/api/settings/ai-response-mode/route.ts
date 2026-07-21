import { NextResponse } from "next/server"
import { getCurrentWorkspace } from "@/lib/data/workspace"
import { createClient } from "@/lib/supabase/server"

export const runtime = "nodejs"
export const dynamic = "force-dynamic"

type ResponseMode = "draft" | "auto"

function isResponseMode(value: unknown): value is ResponseMode {
  return value === "draft" || value === "auto"
}

export async function PATCH(request: Request) {
  let body: unknown
  try {
    body = await request.json()
  } catch {
    return NextResponse.json(
      { status: "invalid_request", message: "Choose draft or automatic response mode." },
      { status: 400 },
    )
  }

  const responseMode = body !== null && typeof body === "object" && "responseMode" in body
    ? (body as { responseMode?: unknown }).responseMode
    : undefined
  if (!isResponseMode(responseMode)) {
    return NextResponse.json(
      { status: "invalid_request", message: "Choose draft or automatic response mode." },
      { status: 400 },
    )
  }

  const workspace = await getCurrentWorkspace()
  if (workspace.status === "unauthenticated") {
    return NextResponse.json(
      { status: "unauthenticated", message: "Sign in again before changing AI settings." },
      { status: 401 },
    )
  }
  if (workspace.status !== "ready") {
    return NextResponse.json(
      { status: "workspace_unavailable", message: "AIT could not load this organization." },
      { status: 409 },
    )
  }
  if (workspace.role !== "owner") {
    return NextResponse.json(
      { status: "forbidden", message: "Only the organization owner can change automatic sending." },
      { status: 403 },
    )
  }

  const supabase = await createClient()
  const existingResult = await supabase
    .from("organization_ai_settings")
    .select("organization_id")
    .eq("organization_id", workspace.organization.id)
    .maybeSingle()

  if (existingResult.error) {
    const migrationMissing = existingResult.error.code === "42P01"
    return NextResponse.json(
      {
        status: migrationMissing ? "migration_required" : "server_error",
        message: migrationMissing
          ? "Apply the automatic-response Supabase migration before changing this setting."
          : "AIT could not load the AI setting.",
      },
      { status: migrationMissing ? 503 : 500 },
    )
  }

  const timestamp = new Date().toISOString()
  const writeResult = existingResult.data
    ? await supabase
        .from("organization_ai_settings")
        .update({ response_mode: responseMode, updated_at: timestamp })
        .eq("organization_id", workspace.organization.id)
    : await supabase
        .from("organization_ai_settings")
        .insert({
          organization_id: workspace.organization.id,
          response_mode: responseMode,
          auto_reply_min_confidence: 0.9,
          updated_at: timestamp,
        })

  if (writeResult.error) {
    return NextResponse.json(
      { status: "server_error", message: "AIT could not save the AI response mode." },
      { status: 500 },
    )
  }

  return NextResponse.json({ status: "updated", responseMode })
}
