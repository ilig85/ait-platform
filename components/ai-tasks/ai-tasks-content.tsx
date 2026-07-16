"use client"

import { Sparkles } from "lucide-react"
import { AitHeader } from "@/components/ait/header"
import { Button } from "@/components/ui/button"

export function AITasksContent() {
  return (
    <>
      <AitHeader title="AI Tasks" subtitle="Create and supervise AI-assisted work." />
      <div className="flex items-center justify-center flex-1 py-16">
        <div className="flex flex-col items-center text-center max-w-sm gap-4">
          <div className="w-14 h-14 rounded-2xl bg-[#2DE2B1]/10 border border-[#2DE2B1]/20 flex items-center justify-center">
            <Sparkles className="w-6 h-6 text-[#2DE2B1]" />
          </div>
          <div>
            <h2 className="text-sm font-semibold text-foreground">AI Tasks are coming soon</h2>
            <p className="text-sm text-muted-foreground mt-1 leading-relaxed">
              The production database does not yet contain AI-task records or an execution workflow. No demo tasks are shown.
            </p>
          </div>
          <Button
            size="sm"
            disabled
            className="bg-[#2DE2B1] text-[#071A1B] hover:bg-[#2DE2B1]/90 opacity-50 cursor-not-allowed"
          >
            Create AI Task
          </Button>
        </div>
      </div>
    </>
  )
}
