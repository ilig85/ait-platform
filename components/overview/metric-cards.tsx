"use client"

import Link from "next/link"
import { AlertCircle, CheckCircle2, MessageSquare, Users } from "lucide-react"
import { Tooltip, TooltipContent, TooltipTrigger } from "@/components/ui/tooltip"
import type { OverviewData } from "@/lib/data/models"
import { cn } from "@/lib/utils"

const ITEMS = [
  {
    label: "Contacts",
    key: "contacts" as const,
    icon: Users,
    href: "/customers",
    accent: "#2DE2B1",
    tooltip: "All contacts stored for the selected organization.",
  },
  {
    label: "Resolved",
    key: "resolvedConversations" as const,
    icon: CheckCircle2,
    href: "/inbox?filter=resolved",
    accent: "#2DE2B1",
    tooltip: "Conversations whose current database status is resolved.",
  },
  {
    label: "Open",
    key: "openConversations" as const,
    icon: MessageSquare,
    href: "/inbox?filter=open",
    accent: "#67D9FF",
    tooltip: "Conversations whose current status is open or pending.",
  },
  {
    label: "Needs human",
    key: "needsHuman" as const,
    icon: AlertCircle,
    href: "/inbox?filter=needs_human",
    accent: "#FF6B6B",
    tooltip: "Conversations currently marked as needing human attention.",
  },
]

export function MetricCards({ metrics }: { metrics: OverviewData["metrics"] }) {
  return (
    <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 stagger-children">
      {ITEMS.map((item) => {
        const Icon = item.icon
        const value = metrics[item.key]
        return (
          <Tooltip key={item.label}>
            <TooltipTrigger asChild>
              <Link href={item.href} className="block group">
                <div
                  className={cn(
                    "bg-card border border-border/60 rounded-xl p-4",
                    "hover:shadow-md hover:-translate-y-0.5 transition-all duration-200",
                    "flex flex-col gap-3",
                  )}
                >
                  <div
                    className="w-8 h-8 rounded-lg flex items-center justify-center flex-shrink-0"
                    style={{ backgroundColor: `${item.accent}18` }}
                  >
                    <Icon className="w-4 h-4" style={{ color: item.accent }} />
                  </div>
                  <div>
                    <p className="text-2xl font-semibold text-foreground tabular-nums">{value}</p>
                    <p className="text-xs text-muted-foreground mt-0.5 leading-snug">{item.label}</p>
                  </div>
                </div>
              </Link>
            </TooltipTrigger>
            <TooltipContent className="max-w-[220px] text-xs">{item.tooltip}</TooltipContent>
          </Tooltip>
        )
      })}
    </div>
  )
}
