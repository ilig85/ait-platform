import Link from "next/link"
import { ChevronRight, Sparkles } from "lucide-react"
import { Card, CardContent, CardHeader } from "@/components/ui/card"
import { Button } from "@/components/ui/button"

export function AiCommandCenter() {
  return (
    <Card className="border-border/60 bg-card">
      <CardHeader className="pb-3">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <div className="w-7 h-7 rounded-md bg-[#2DE2B1]/12 flex items-center justify-center">
              <Sparkles className="w-3.5 h-3.5 text-[#2DE2B1]" />
            </div>
            <h3 className="font-semibold text-sm text-foreground">AI Command Center</h3>
          </div>
          <Button variant="ghost" size="sm" className="h-7 px-2 text-xs text-muted-foreground gap-1 hover:text-foreground" asChild>
            <Link href="/ai-tasks">
              View details
              <ChevronRight className="w-3 h-3" />
            </Link>
          </Button>
        </div>
      </CardHeader>
      <CardContent>
        <div className="rounded-lg border border-dashed border-border/60 p-5 text-center bg-muted/20">
          <p className="text-sm font-medium text-foreground">AI tasks are not connected yet</p>
          <p className="text-xs text-muted-foreground mt-1 leading-relaxed">
            No production AI-task table or execution workflow exists in this phase.
          </p>
        </div>
      </CardContent>
    </Card>
  )
}
