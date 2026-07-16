import { Sparkles } from "lucide-react"
import { AitHeader } from "@/components/ait/header"
import { Button } from "@/components/ui/button"
import { Card } from "@/components/ui/card"

export function AITasksContent() {
  return (
    <>
      <AitHeader title="AI Tasks" subtitle="Create and supervise AI-assisted work." />
      <Card className="min-h-[360px] border-border/60 flex items-center justify-center p-8">
        <div className="text-center max-w-md">
          <Sparkles className="w-9 h-9 text-muted-foreground mx-auto mb-3" />
          <h2 className="text-sm font-semibold text-foreground">AI Tasks are coming later</h2>
          <p className="text-sm text-muted-foreground mt-1">
            The production database does not yet contain AI-task records or an execution workflow, so no demo tasks are shown.
          </p>
          <Button size="sm" className="mt-4" disabled>Create AI Task</Button>
        </div>
      </Card>
    </>
  )
}
