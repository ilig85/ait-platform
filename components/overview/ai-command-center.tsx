"use client"

import { useState } from "react"
import Link from "next/link"
import { Sparkles, Plus, Clock, CheckCircle2, ChevronRight, AlertTriangle } from "lucide-react"
import { Card, CardContent, CardHeader } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { useI18n } from "@/lib/i18n"
import { DEMO_AI_TASKS } from "@/lib/mock-data"
import { cn } from "@/lib/utils"

const statusConfig: Record<string, { label: string; color: string; bg: string }> = {
  awaiting_approval: { label: "Awaiting approval", color: "text-amber-700", bg: "bg-amber-50" },
  scheduled:         { label: "Scheduled",          color: "text-blue-700",  bg: "bg-blue-50"  },
  running:           { label: "Running",             color: "text-[#0F766E]", bg: "bg-[#0F766E]/10" },
  completed:         { label: "Completed",           color: "text-[#0F766E]", bg: "bg-[#0F766E]/10" },
  failed:            { label: "Failed",              color: "text-destructive", bg: "bg-destructive/10" },
  configuration_required: { label: "Config required", color: "text-muted-foreground", bg: "bg-muted" },
  draft:             { label: "Draft",               color: "text-muted-foreground", bg: "bg-muted" },
}

export function AiCommandCenter() {
  const { t } = useI18n()
  const pending = DEMO_AI_TASKS.filter((tk) => tk.status === "awaiting_approval")
  const recent = DEMO_AI_TASKS.filter((tk) => tk.status === "completed").slice(0, 1)
  const suggested = [
    "Identify unanswered questions this week",
    "Draft follow-ups for 3-day-old unresolved conversations",
  ]

  return (
    <Card className="border-border/60">
      <CardHeader className="pb-3">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <div className="w-7 h-7 rounded-lg bg-[#0F766E]/10 flex items-center justify-center">
              <Sparkles className="w-3.5 h-3.5 text-[#0F766E]" />
            </div>
            <h3 className="font-semibold text-sm">{t("overview_ai_command_center")}</h3>
          </div>
          <Link href="/ai-tasks">
            <Button variant="ghost" size="sm" className="h-7 px-2 text-xs text-muted-foreground gap-1">
              {t("common_view_all")}<ChevronRight className="w-3 h-3" />
            </Button>
          </Link>
        </div>
        <p className="text-xs text-muted-foreground mt-1">
          AI can draft replies, tag conversations, and surface insights — always with your approval.
        </p>
      </CardHeader>
      <CardContent className="space-y-4">
        <Link href="/ai-tasks?new=1">
          <Button size="sm" className="w-full bg-[#0F766E] hover:bg-[#0F766E]/90 text-white gap-2 h-9">
            <Plus className="w-3.5 h-3.5" />
            {t("overview_create_ai_task")}
          </Button>
        </Link>

        {/* Awaiting approval */}
        {pending.length > 0 && (
          <div>
            <p className="text-xs font-medium text-muted-foreground mb-2 uppercase tracking-wide">Awaiting your approval</p>
            <div className="space-y-2">
              {pending.map((tk) => (
                <Link key={tk.id} href="/ai-tasks">
                  <div className="flex items-start gap-2.5 p-2.5 rounded-lg border border-amber-200 bg-amber-50/50 hover:bg-amber-50 transition-colors cursor-pointer">
                    <AlertTriangle className="w-3.5 h-3.5 text-amber-600 mt-0.5 flex-shrink-0" />
                    <div className="min-w-0">
                      <p className="text-xs font-medium text-foreground truncate">{tk.title}</p>
                      <p className="text-[10px] text-muted-foreground mt-0.5">Risk: {tk.riskLevel}</p>
                    </div>
                  </div>
                </Link>
              ))}
            </div>
          </div>
        )}

        {/* Suggested tasks */}
        <div>
          <p className="text-xs font-medium text-muted-foreground mb-2 uppercase tracking-wide">Suggested tasks</p>
          <div className="space-y-1.5">
            {suggested.map((s) => (
              <div key={s} className="flex items-center gap-2 p-2 rounded-lg bg-muted/40 hover:bg-muted/70 transition-colors cursor-pointer text-xs text-foreground">
                <Plus className="w-3 h-3 text-muted-foreground flex-shrink-0" />
                <span className="truncate">{s}</span>
              </div>
            ))}
          </div>
        </div>

        {/* Recently completed */}
        {recent.length > 0 && (
          <div>
            <p className="text-xs font-medium text-muted-foreground mb-2 uppercase tracking-wide">Recently completed</p>
            {recent.map((tk) => (
              <div key={tk.id} className="flex items-start gap-2 p-2.5 rounded-lg border border-border bg-muted/20">
                <CheckCircle2 className="w-3.5 h-3.5 text-[#0F766E] mt-0.5 flex-shrink-0" />
                <div className="min-w-0">
                  <p className="text-xs font-medium truncate">{tk.title}</p>
                  {tk.resultSummary && <p className="text-[10px] text-muted-foreground mt-0.5 line-clamp-2">{tk.resultSummary}</p>}
                </div>
              </div>
            ))}
          </div>
        )}
      </CardContent>
    </Card>
  )
}
