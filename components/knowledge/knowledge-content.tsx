import { BookOpen } from "lucide-react"
import { AitHeader } from "@/components/ait/header"
import { Button } from "@/components/ui/button"
import { Card } from "@/components/ui/card"

export function KnowledgeContent() {
  return (
    <>
      <AitHeader title="Knowledge Base" subtitle="Manager-verified business knowledge for future AI workflows." />
      <Card className="min-h-[360px] border-border/60 flex items-center justify-center p-8">
        <div className="text-center max-w-md">
          <BookOpen className="w-9 h-9 text-muted-foreground mx-auto mb-3" />
          <h2 className="text-sm font-semibold text-foreground">Knowledge storage is coming later</h2>
          <p className="text-sm text-muted-foreground mt-1">
            No production knowledge-base table exists in the current schema, so no placeholder entries are displayed or editable.
          </p>
          <Button size="sm" className="mt-4" disabled>Add Entry</Button>
        </div>
      </Card>
    </>
  )
}
