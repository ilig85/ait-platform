"use client"

import { useState } from "react"
import Link from "next/link"
import {
  CheckCircle2, Clock, PlayCircle, Sparkles, AlertTriangle,
  ChevronDown, ChevronUp, ThumbsUp, ThumbsDown, Search,
  CalendarClock, XCircle, Settings2, Plus,
} from "lucide-react"
import { cn } from "@/lib/utils"
import { DEMO_AI_TASKS } from "@/lib/mock-data"
import type { AITask, TaskStatus } from "@/lib/mock-data"
import { AitHeader } from "@/components/ait/header"
import { useI18n } from "@/lib/i18n"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"

const STATUS_CONFIG: Record<TaskStatus, { label: string; color: string; icon: React.ElementType }> = {
  draft:                { label: "Draft",              color: "bg-muted text-muted-foreground border-border", icon: Clock },
  awaiting_approval:    { label: "Awaiting approval",  color: "bg-amber-50 text-amber-700 border-amber-200", icon: AlertTriangle },
  scheduled:            { label: "Scheduled",          color: "bg-blue-50 text-blue-700 border-blue-200",    icon: CalendarClock },
  running:              { label: "Running",             color: "bg-[#0F766E]/10 text-[#0F766E] border-[#0F766E]/20", icon: PlayCircle },
  completed:            { label: "Completed",           color: "bg-[#0F766E]/10 text-[#0F766E] border-[#0F766E]/20", icon: CheckCircle2 },
  failed:               { label: "Failed",              color: "bg-destructive/10 text-destructive border-destructive/20", icon: XCircle },
  configuration_required: { label: "Config required",  color: "bg-muted text-muted-foreground border-border", icon: Settings2 },
}

const RISK_COLOR: Record<string, string> = {
  low:    "text-[#0F766E] bg-[#0F766E]/10",
  medium: "text-amber-700 bg-amber-50",
  high:   "text-destructive bg-destructive/10",
}

const FILTERS: { key: TaskStatus | "all"; label: string }[] = [
  { key: "all",             label: "All" },
  { key: "awaiting_approval", label: "Awaiting" },
  { key: "running",         label: "Running" },
  { key: "scheduled",       label: "Scheduled" },
  { key: "completed",       label: "Completed" },
]

function timeAgo(iso: string) {
  const diff = Date.now() - new Date(iso).getTime()
  const h = Math.floor(diff / 3600000)
  if (h < 24) return `${h}h ago`
  return `${Math.floor(h / 24)}d ago`
}

export function AITasksContent() {
  const { t } = useI18n()
  const [tasks, setTasks] = useState<AITask[]>(DEMO_AI_TASKS)
  const [expanded, setExpanded] = useState<string | null>(null)
  const [activeFilter, setActiveFilter] = useState<"all" | TaskStatus>("all")
  const [search, setSearch] = useState("")

  const filtered = tasks.filter((tk) => {
    const matchFilter = activeFilter === "all" || tk.status === activeFilter
    const matchSearch = search
      ? tk.title.toLowerCase().includes(search.toLowerCase()) ||
        tk.instruction.toLowerCase().includes(search.toLowerCase())
      : true
    return matchFilter && matchSearch
  })

  const approve = (id: string) =>
    setTasks((prev) => prev.map((t) => t.id === id ? { ...t, status: "completed" as TaskStatus } : t))

  const reject = (id: string) =>
    setTasks((prev) => prev.map((t) => t.id === id ? { ...t, status: "draft" as TaskStatus } : t))

  return (
    <>
      <AitHeader title={t("tasks_title")} subtitle={t("tasks_subtitle")} />

      <div className="flex flex-col gap-4">
        {/* Search + filters */}
        <div className="flex flex-col sm:flex-row gap-3">
          <div className="relative flex-1">
            <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-muted-foreground" />
            <input
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Search tasks..."
              className="w-full pl-8 pr-4 py-2 text-sm bg-card border border-border rounded-lg text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-ring/40"
            />
          </div>
          <div className="flex items-center gap-1 bg-card border border-border rounded-lg p-1 flex-shrink-0 flex-wrap">
            {FILTERS.map((f) => (
              <button
                key={f.key}
                onClick={() => setActiveFilter(f.key)}
                className={cn(
                  "px-2.5 py-1 text-xs rounded-md font-medium transition-all",
                  activeFilter === f.key
                    ? "bg-[#15253D] text-white"
                    : "text-muted-foreground hover:text-foreground hover:bg-accent"
                )}
              >
                {f.label}
              </button>
            ))}
          </div>
        </div>

        {/* New task CTA */}
        <Link href="/ai-tasks?new=1">
          <Button size="sm" className="bg-[#0F766E] hover:bg-[#0F766E]/90 text-white gap-2">
            <Plus className="w-3.5 h-3.5" />
            {t("tasks_new_task")}
          </Button>
        </Link>

        {/* Task list */}
        <div className="flex flex-col gap-2.5">
          {filtered.length === 0 && (
            <div className="text-center py-16 text-muted-foreground text-sm">{t("common_empty")}</div>
          )}
          {filtered.map((task) => {
            const cfg = STATUS_CONFIG[task.status]
            const Icon = cfg.icon
            const isOpen = expanded === task.id

            return (
              <div
                key={task.id}
                className="bg-card border border-border rounded-xl overflow-hidden transition-all"
              >
                {/* Row */}
                <div
                  className="flex items-center gap-3 px-4 py-3.5 cursor-pointer hover:bg-accent/40 transition-colors"
                  onClick={() => setExpanded(isOpen ? null : task.id)}
                >
                  <Icon className="w-4 h-4 text-muted-foreground flex-shrink-0" />
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 flex-wrap">
                      <span className="font-medium text-sm text-foreground truncate">{task.title}</span>
                      <Badge
                        variant="outline"
                        className={cn("text-[10px] h-5 px-1.5 border rounded-full font-medium", cfg.color)}
                      >
                        {cfg.label}
                      </Badge>
                      {task.requiresApproval && (
                        <Badge variant="outline" className="text-[10px] h-5 px-1.5 text-muted-foreground">
                          {t("tasks_requires_approval")}
                        </Badge>
                      )}
                    </div>
                    <p className="text-xs text-muted-foreground mt-0.5 truncate">
                      {task.targetDescription} · {timeAgo(task.createdAt)}
                    </p>
                  </div>
                  <div className="flex items-center gap-2 flex-shrink-0">
                    {task.status === "awaiting_approval" && (
                      <>
                        <button
                          onClick={(e) => { e.stopPropagation(); approve(task.id) }}
                          className="flex items-center gap-1 text-xs px-2.5 py-1.5 bg-[#0F766E] hover:bg-[#0F766E]/90 text-white rounded-lg font-medium transition-colors"
                        >
                          <ThumbsUp className="w-3 h-3" /> {t("common_approve")}
                        </button>
                        <button
                          onClick={(e) => { e.stopPropagation(); reject(task.id) }}
                          className="flex items-center gap-1 text-xs px-2.5 py-1.5 bg-card border border-border hover:bg-accent text-foreground rounded-lg font-medium transition-colors"
                        >
                          <ThumbsDown className="w-3 h-3" /> {t("common_reject")}
                        </button>
                      </>
                    )}
                    {isOpen ? <ChevronUp className="w-4 h-4 text-muted-foreground" /> : <ChevronDown className="w-4 h-4 text-muted-foreground" />}
                  </div>
                </div>

                {/* Expanded */}
                {isOpen && (
                  <div className="border-t border-border bg-accent/20 px-4 py-4 space-y-3">
                    <div>
                      <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wide mb-1">Instruction</p>
                      <p className="text-sm text-foreground leading-relaxed">{task.instruction}</p>
                    </div>
                    <div className="flex flex-wrap gap-4 pt-2 border-t border-border text-xs">
                      <div>
                        <p className="text-muted-foreground">Creator</p>
                        <p className="font-medium mt-0.5">{task.creator}</p>
                      </div>
                      <div>
                        <p className="text-muted-foreground">Risk</p>
                        <span className={cn("inline-block px-2 py-0.5 rounded-full font-medium mt-0.5", RISK_COLOR[task.riskLevel])}>
                          {task.riskLevel}
                        </span>
                      </div>
                      <div>
                        <p className="text-muted-foreground">Action</p>
                        <p className="font-medium mt-0.5 font-mono">{task.action}</p>
                      </div>
                      {task.scheduledAt && (
                        <div>
                          <p className="text-muted-foreground">Scheduled</p>
                          <p className="font-medium mt-0.5">{new Date(task.scheduledAt).toLocaleString([], { dateStyle: "short", timeStyle: "short" })}</p>
                        </div>
                      )}
                    </div>
                    {task.resultSummary && (
                      <div className="p-3 rounded-lg bg-[#0F766E]/8 border border-[#0F766E]/20">
                        <p className="text-xs font-semibold text-[#0F766E] mb-1">Result</p>
                        <p className="text-sm text-foreground">{task.resultSummary}</p>
                      </div>
                    )}
                    {task.status === "configuration_required" && (
                      <div className="p-3 rounded-lg border border-amber-200 bg-amber-50 text-xs text-amber-800">
                        {t("common_configuration_required")} —{" "}
                        <Link href="/settings" className="underline font-medium">Go to Settings</Link>
                      </div>
                    )}
                  </div>
                )}
              </div>
            )
          })}
        </div>
      </div>
    </>
  )
}
