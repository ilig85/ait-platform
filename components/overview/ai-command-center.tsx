import Link from "next/link"
import { ChevronRight, Sparkles } from "lucide-react"
import { Card, CardContent, CardHeader } from "@/components/ui/card"
import { Button } from "@/components/ui/button"

export function AiCommandCenter() {
  return (
    <Card className="border-border/60">
      <CardHeader className="pb-3">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <div className="w-7 h-7 rounded-lg bg-[#0F766E]/10 flex items-center justify-center">
              <Sparkles className="w-3.5 h-3.5 text-[#0F766E]" />
            </div>
            <h3 className="font-semibold text-sm">AI Command Center</h3>
          </div>
          <Link href="/ai-tasks">
            <Button variant="ghost" size="sm" className="h-7 px-2 text-xs text-muted-foreground gap-1">
              View details<ChevronRight className="w-3 h-3" />
            </Button>
          </Link>
        </div>
      </CardHeader>
      <CardContent>
        <div className="rounded-lg border border-dashed border-border p-5 text-center">
          <p className="text-sm font-medium text-foreground">AI tasks are not connected yet</p>
          <p className="text-xs text-muted-foreground mt-1">
            No production AI-task table or execution workflow exists in this phase.
          </p>
        </div>
      </CardContent>
    </Card>
  )
}
