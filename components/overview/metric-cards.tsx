"use client"

import Link from "next/link"
import { TrendingUp, TrendingDown, Users, Sparkles, Zap, AlertCircle, Info } from "lucide-react"
import { Card } from "@/components/ui/card"
import { Tooltip, TooltipContent, TooltipTrigger } from "@/components/ui/tooltip"
import { useI18n } from "@/lib/i18n"
import { DEMO_METRICS } from "@/lib/mock-data"
import { cn } from "@/lib/utils"

const metrics = [
  {
    labelKey: "overview_customers_contacted" as const,
    value: DEMO_METRICS.customersContacted,
    change: DEMO_METRICS.customersContactedChange,
    icon: Users,
    href: "/customers",
    color: "text-[#0F766E]",
    bg: "bg-[#0F766E]/10",
    tooltip: "Distinct customers who sent at least one message in the selected period.",
  },
  {
    labelKey: "overview_ai_resolved" as const,
    value: DEMO_METRICS.aiResolved,
    change: DEMO_METRICS.aiResolvedChange,
    icon: Sparkles,
    href: "/inbox?filter=resolved",
    color: "text-[#0F766E]",
    bg: "bg-[#0F766E]/10",
    tooltip: "Conversations closed by AI without any manager involvement.",
  },
  {
    labelKey: "overview_ai_active" as const,
    value: DEMO_METRICS.aiActive,
    change: DEMO_METRICS.aiActiveChange,
    icon: Zap,
    href: "/inbox?filter=ai_active",
    color: "text-amber-600",
    bg: "bg-amber-50",
    tooltip: "Conversations the AI is currently drafting or waiting to send a reply.",
  },
  {
    labelKey: "overview_needs_human" as const,
    value: DEMO_METRICS.needsHuman,
    change: DEMO_METRICS.needsHumanChange,
    icon: AlertCircle,
    href: "/inbox?filter=needs_human",
    color: "text-destructive",
    bg: "bg-destructive/10",
    tooltip: "Conversations escalated and waiting for a manager to respond.",
  },
]

export function MetricCards() {
  const { t } = useI18n()

  return (
    <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 md:gap-4">
      {metrics.map((m) => {
        const Icon = m.icon
        const positive = m.change >= 0
        const TrendIcon = positive ? TrendingUp : TrendingDown
        const isNeedsHuman = m.labelKey === "overview_needs_human"
        const changeGood = isNeedsHuman ? !positive : positive

        return (
          <Link key={m.labelKey} href={m.href}>
            <Card className="p-4 hover:shadow-md transition-all duration-200 hover:-translate-y-0.5 cursor-pointer group border-border/60">
              <div className="flex items-start justify-between gap-2 mb-3">
                <div className={cn("w-9 h-9 rounded-lg flex items-center justify-center flex-shrink-0", m.bg)}>
                  <Icon className={cn("w-4 h-4", m.color)} />
                </div>
                <Tooltip>
                  <TooltipTrigger asChild>
                    <button className="text-muted-foreground/50 hover:text-muted-foreground transition-colors mt-0.5">
                      <Info className="w-3.5 h-3.5" />
                    </button>
                  </TooltipTrigger>
                  <TooltipContent className="max-w-[200px] text-xs">{m.tooltip}</TooltipContent>
                </Tooltip>
              </div>
              <div className="space-y-1">
                <p className="text-2xl font-bold text-foreground">{m.value}</p>
                <p className="text-xs text-muted-foreground leading-snug">{t(m.labelKey)}</p>
                <div className={cn(
                  "flex items-center gap-1 text-xs font-medium",
                  changeGood ? "text-[#0F766E]" : "text-destructive"
                )}>
                  <TrendIcon className="w-3 h-3" />
                  <span>{positive ? "+" : ""}{m.change} vs last period</span>
                </div>
              </div>
            </Card>
          </Link>
        )
      })}
    </div>
  )
}
