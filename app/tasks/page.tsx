"use client"

import { AppShell } from "@/components/ait/app-shell"
import { AITasksContent } from "@/components/ai-tasks/ai-tasks-content"

export default function TasksPage() {
  return (
    <AppShell>
      <AITasksContent />
    </AppShell>
  )
}
