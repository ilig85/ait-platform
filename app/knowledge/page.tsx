import { AppShell } from "@/components/ait/app-shell"
import { KnowledgeContent } from "@/components/knowledge/knowledge-content"
import { getCurrentWorkspace } from "@/lib/data/workspace"
import { createClient } from "@/lib/supabase/server"

export default async function KnowledgePage() {
  const workspace = await getCurrentWorkspace()
  let initialContent = ""
  let available = workspace.status === "ready"

  if (workspace.status === "ready") {
    const supabase = await createClient()
    const result = await supabase
      .from("organization_knowledge")
      .select("content")
      .eq("organization_id", workspace.organization.id)
      .maybeSingle()

    if (result.error) {
      available = false
      if (result.error.code !== "42P01" && result.error.code !== "PGRST205") {
        console.error("[knowledge] Unable to load business knowledge", result.error.message)
      }
    } else {
      initialContent = result.data?.content ?? ""
    }
  }

  return (
    <AppShell>
      <KnowledgeContent
        initialContent={initialContent}
        available={available}
        canEdit={workspace.status === "ready" && (workspace.role === "owner" || workspace.role === "manager")}
      />
    </AppShell>
  )
}
