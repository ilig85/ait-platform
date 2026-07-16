import "server-only"

import { cache } from "react"
import { createClient } from "@/lib/supabase/server"
import type { ShellData, WorkspaceContext, WorkspaceUser } from "@/lib/data/models"

function toWorkspaceUser(
  user: { id: string; email?: string | null; user_metadata?: Record<string, unknown> },
  profile?: { full_name: string | null; avatar_url: string | null } | null,
): WorkspaceUser {
  const metadataName = typeof user.user_metadata?.full_name === "string"
    ? user.user_metadata.full_name
    : null
  const metadataAvatar = typeof user.user_metadata?.avatar_url === "string"
    ? user.user_metadata.avatar_url
    : null
  const displayName = profile?.full_name ?? metadataName ?? user.email ?? "User"

  return {
    id: user.id,
    email: user.email ?? null,
    displayName,
    avatarUrl: profile?.avatar_url ?? metadataAvatar,
  }
}

export const getCurrentWorkspace = cache(async (): Promise<WorkspaceContext> => {
  const supabase = await createClient()
  const {
    data: { user },
    error: userError,
  } = await supabase.auth.getUser()

  if (userError) {
    console.error("[workspace] Unable to verify the authenticated user", userError.message)
    return {
      status: "error",
      user: null,
      message: "We could not verify your account. Please refresh and try again.",
    }
  }

  if (!user) {
    return { status: "unauthenticated", message: "Please sign in to continue." }
  }

  const [membershipResult, profileResult] = await Promise.all([
    supabase
      .from("organization_members")
      .select("organization_id, role")
      .eq("user_id", user.id)
      .order("organization_id", { ascending: true }),
    supabase
      .from("profiles")
      .select("full_name, avatar_url")
      .eq("id", user.id)
      .maybeSingle(),
  ])

  const workspaceUser = toWorkspaceUser(user, profileResult.data)

  if (membershipResult.error) {
    console.error("[workspace] Unable to load organization memberships", membershipResult.error.message)
    return {
      status: "error",
      user: workspaceUser,
      message: "We could not load your organization membership.",
    }
  }

  if (profileResult.error) {
    console.error("[workspace] Unable to load the current profile", profileResult.error.message)
  }

  if (!membershipResult.data.length) {
    return {
      status: "missing_membership",
      user: workspaceUser,
      message: "Your account is not assigned to an organization yet. Ask an organization owner to add you.",
    }
  }

  // Until workspace selection exists, choose the lexicographically smallest
  // organization UUID. This is stable across requests and does not depend on
  // database return order.
  const selectedMembership = membershipResult.data[0]
  const organizationResult = await supabase
    .from("organizations")
    .select("id, name, slug, plan, default_language, timezone")
    .eq("id", selectedMembership.organization_id)
    .maybeSingle()

  if (organizationResult.error || !organizationResult.data) {
    if (organizationResult.error) {
      console.error("[workspace] Unable to load the selected organization", organizationResult.error.message)
    }
    return {
      status: "error",
      user: workspaceUser,
      message: "Your organization could not be loaded. Please contact support.",
    }
  }

  return {
    status: "ready",
    user: workspaceUser,
    organization: {
      id: organizationResult.data.id,
      name: organizationResult.data.name,
      slug: organizationResult.data.slug,
      plan: organizationResult.data.plan,
      defaultLanguage: organizationResult.data.default_language,
      timezone: organizationResult.data.timezone,
    },
    role: selectedMembership.role,
    organizationCount: membershipResult.data.length,
  }
})

export const getShellData = cache(async (): Promise<ShellData> => {
  const workspace = await getCurrentWorkspace()

  if (workspace.status !== "ready") {
    return {
      workspaceStatus: workspace.status,
      user: "user" in workspace ? workspace.user : null,
      organizationName: null,
      unreadConversationCount: 0,
      needsHumanCount: 0,
      message: workspace.message,
    }
  }

  const supabase = await createClient()
  const [unreadResult, needsHumanResult] = await Promise.all([
    supabase
      .from("conversations")
      .select("id", { count: "exact", head: true })
      .eq("organization_id", workspace.organization.id)
      .gt("unread_count", 0),
    supabase
      .from("conversations")
      .select("id", { count: "exact", head: true })
      .eq("organization_id", workspace.organization.id)
      .eq("needs_human", true),
  ])

  if (unreadResult.error) {
    console.error("[shell] Unable to count unread conversations", unreadResult.error.message)
  }
  if (needsHumanResult.error) {
    console.error("[shell] Unable to count conversations needing attention", needsHumanResult.error.message)
  }

  return {
    workspaceStatus: "ready",
    user: workspace.user,
    organizationName: workspace.organization.name,
    unreadConversationCount: unreadResult.count ?? 0,
    needsHumanCount: needsHumanResult.count ?? 0,
    message: null,
  }
})
