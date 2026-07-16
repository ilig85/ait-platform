"use client"

import Link from "next/link"
import { AlertCircle, CheckCircle2, Info, MessageSquare, Users } from "lucide-react"
import { Card } from "@/components/ui/card"
import { Tooltip, TooltipContent, TooltipTrigger } from "@/components/ui/tooltip"
import type { OverviewData } from "@/lib/data/models"
import { cn } from "@/lib/utils"

export function MetricCards({ metrics }: { metrics: OverviewData["metrics"] }) {
  const items = [
    {
      label: "Contacts",
      value: metrics.contacts,
      icon: Users,
      href: "/customers",
      color: "text-[#0F766E]",
      bg: "bg-[#0F766E]/10",
      tooltip: "All contacts stored for the selected organization.",
    },
    {
      label: "Resolved conversations",
      value: metrics.resolvedConversations,
      icon: CheckCircle2,
      href: "/inbox?filter=resolved",
      color: "text-[#0F766E]",
      bg: "bg-[#0F766E]/10",
      tooltip: "Conversations whose current database status is resolved.",
    },
    {
      label: "Open conversations",
      value: metrics.openConversations,
      icon: MessageSquare,
      href: "/inbox?filter=open",
      color: "text-amber-600",
      bg: "bg-amber-50",
      tooltip: "Conversations whose current status is open or pending.",
    },
    {
      label: "Needs human",
      value: metrics.needsHuman,
      icon: AlertCircle,
      href: "/inbox?filter=needs_human",
      color: "text-destructive",
      bg: "bg-destructive/10",
      tooltip: "Conversations currently marked as needing human attention.",
    },
  ]

  return (
    <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 md:gap-4">
      {items.map((item) => {
        const Icon = item.icon
        return (
          <Link key={item.label} href={item.href}>
            <Card className="p-4 hover:shadow-md transition-all duration-200 hover:-translate-y-0.5 cursor-pointer group border-border/60">
              <div className="flex items-start justify-between gap-2 mb-3">
                <div className={cn("w-9 h-9 rounded-lg flex items-center justify-center flex-shrink-0", item.bg)}>
                  <Icon className={cn("w-4 h-4", item.color)} />
                </div>
                <Tooltip>
                  <TooltipTrigger asChild>
                    <button className="text-muted-foreground/50 hover:text-muted-foreground transition-colors mt-0.5" aria-label={`About ${item.label}`}>
                      <Info className="w-3.5 h-3.5" />
                    </button>
                  </TooltipTrigger>
                  <TooltipContent className="max-w-[220px] text-xs">{item.tooltip}</TooltipContent>
                </Tooltip>
              </div>
              <div className="space-y-1">
                <p className="text-2xl font-bold text-foreground">{item.value}</p>
                <p className="text-xs text-muted-foreground leading-snug">{item.label}</p>
                <p className="text-[10px] text-muted-foreground">Current database total</p>
              </div>
            </Card>
          </Link>
        )
      })}
    </div>
  )
}
