import { redirect } from "next/navigation"
import { getShellData } from "@/lib/data/workspace"
import { AppShellClient } from "@/components/ait/app-shell-client"

export async function AppShell({ children }: { children: React.ReactNode }) {
  const shell = await getShellData()

  if (shell.workspaceStatus === "unauthenticated") {
    redirect("/login")
  }

  return <AppShellClient shell={shell}>{children}</AppShellClient>
}
