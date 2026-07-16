"use client"

import Link from "next/link"
import { usePathname } from "next/navigation"
import { useState } from "react"
import {
  BarChart3,
  BookOpen,
  ChevronLeft,
  ChevronRight,
  HelpCircle,
  LayoutDashboard,
  LogOut,
  MessageSquare,
  Settings,
  Sparkles,
  Users,
  Zap,
} from "lucide-react"
import { Badge } from "@/components/ui/badge"
import { Tooltip, TooltipContent, TooltipTrigger } from "@/components/ui/tooltip"
import { useI18n } from "@/lib/i18n"
import { useShellData } from "@/components/ait/shell-context"
import { cn } from "@/lib/utils"

const NAV_ITEMS = [
  { href: "/dashboard", labelKey: "nav_overview" as const, icon: LayoutDashboard },
  { href: "/inbox", labelKey: "nav_inbox" as const, icon: MessageSquare, showUnread: true },
  { href: "/ai-tasks", labelKey: "nav_ai_tasks" as const, icon: Sparkles },
  { href: "/customers", labelKey: "nav_customers" as const, icon: Users },
  { href: "/knowledge", labelKey: "nav_knowledge" as const, icon: BookOpen },
  { href: "/insights", labelKey: "nav_insights" as const, icon: BarChart3 },
]

const SECONDARY_ITEMS = [
  { href: "/settings", labelKey: "nav_settings" as const, icon: Settings },
  { href: "/help", labelKey: "nav_help" as const, icon: HelpCircle },
]

export function AitSidebar() {
  const { t } = useI18n()
  const { organizationName, unreadConversationCount } = useShellData()
  const pathname = usePathname()
  const [collapsed, setCollapsed] = useState(false)

  return (
    <aside className={cn(
      "fixed inset-y-0 left-0 z-40 flex flex-col transition-all duration-300 ease-in-out bg-sidebar border-r border-sidebar-border",
      collapsed ? "w-16" : "w-64",
    )}>
      <div className={cn("flex items-center h-16 px-4 border-b border-sidebar-border flex-shrink-0", collapsed ? "justify-center" : "gap-3")}>
        <div className="w-8 h-8 rounded-lg bg-accent flex items-center justify-center flex-shrink-0">
          <Zap className="w-4 h-4 text-accent-foreground" />
        </div>
        {!collapsed && (
          <div className="min-w-0">
            <span className="text-sidebar-foreground font-bold text-lg tracking-tight">AIT</span>
            <p className="text-sidebar-foreground/50 text-[10px] leading-none -mt-0.5 truncate">
              {organizationName ?? "No organization"}
            </p>
          </div>
        )}
      </div>

      <nav className="flex-1 py-4 overflow-y-auto overflow-x-hidden">
        <div className="space-y-0.5 px-2">
          {NAV_ITEMS.map((item) => {
            const active = pathname === item.href || pathname.startsWith(`${item.href}/`)
            const Icon = item.icon
            const badge = item.showUnread ? unreadConversationCount : 0
            return (
              <Tooltip key={item.href} delayDuration={collapsed ? 100 : 999999}>
                <TooltipTrigger asChild>
                  <Link href={item.href} className={cn(
                    "flex items-center rounded-lg transition-all duration-150 group relative",
                    collapsed ? "justify-center h-10 w-10 mx-auto" : "gap-3 px-3 py-2.5",
                    active
                      ? "bg-sidebar-accent text-sidebar-foreground"
                      : "text-sidebar-foreground/60 hover:text-sidebar-foreground hover:bg-sidebar-accent/60",
                  )}>
                    <Icon className={cn("flex-shrink-0", collapsed ? "w-5 h-5" : "w-4 h-4")} />
                    {!collapsed && <span className="text-sm font-medium truncate">{t(item.labelKey)}</span>}
                    {badge > 0 && (
                      <Badge className={cn(
                        "bg-accent text-accent-foreground text-[10px] px-1.5 min-w-[18px] h-[18px] flex items-center justify-center rounded-full border-0",
                        collapsed ? "absolute -top-0.5 -right-0.5" : "ml-auto",
                      )}>
                        {badge}
                      </Badge>
                    )}
                    {active && <span className="absolute left-0 top-1/2 -translate-y-1/2 w-0.5 h-6 bg-accent rounded-r-full" />}
                  </Link>
                </TooltipTrigger>
                {collapsed && <TooltipContent side="right" className="bg-sidebar-foreground/90 text-sidebar text-xs">{t(item.labelKey)}</TooltipContent>}
              </Tooltip>
            )
          })}
        </div>

        <div className="mt-4 pt-4 border-t border-sidebar-border/50 space-y-0.5 px-2">
          {SECONDARY_ITEMS.map((item) => {
            const active = pathname.startsWith(item.href)
            const Icon = item.icon
            return (
              <Tooltip key={item.href} delayDuration={collapsed ? 100 : 999999}>
                <TooltipTrigger asChild>
                  <Link href={item.href} className={cn(
                    "flex items-center rounded-lg transition-all duration-150",
                    collapsed ? "justify-center h-10 w-10 mx-auto" : "gap-3 px-3 py-2.5",
                    active
                      ? "bg-sidebar-accent text-sidebar-foreground"
                      : "text-sidebar-foreground/50 hover:text-sidebar-foreground hover:bg-sidebar-accent/60",
                  )}>
                    <Icon className={cn("flex-shrink-0", collapsed ? "w-5 h-5" : "w-4 h-4")} />
                    {!collapsed && <span className="text-sm font-medium truncate">{t(item.labelKey)}</span>}
                  </Link>
                </TooltipTrigger>
                {collapsed && <TooltipContent side="right" className="bg-sidebar-foreground/90 text-sidebar text-xs">{t(item.labelKey)}</TooltipContent>}
              </Tooltip>
            )
          })}
        </div>
      </nav>

      <div className="border-t border-sidebar-border p-2">
        <Tooltip delayDuration={collapsed ? 100 : 999999}>
          <TooltipTrigger asChild>
            <Link href="/logout" className={cn(
              "flex items-center rounded-lg text-sidebar-foreground/40 hover:text-sidebar-foreground/70 hover:bg-sidebar-accent/60 transition-colors",
              collapsed ? "justify-center h-10 w-10 mx-auto" : "gap-3 px-3 py-2.5",
            )}>
              <LogOut className={cn("flex-shrink-0", collapsed ? "w-5 h-5" : "w-4 h-4")} />
              {!collapsed && <span className="text-sm font-medium">{t("nav_logout")}</span>}
            </Link>
          </TooltipTrigger>
          {collapsed && <TooltipContent side="right" className="bg-sidebar-foreground/90 text-sidebar text-xs">{t("nav_logout")}</TooltipContent>}
        </Tooltip>
      </div>

      <button
        onClick={() => setCollapsed((value) => !value)}
        className="absolute -right-3 top-20 w-6 h-6 rounded-full bg-sidebar border border-sidebar-border text-sidebar-foreground/60 hover:text-sidebar-foreground flex items-center justify-center shadow-sm"
        aria-label={collapsed ? "Expand sidebar" : "Collapse sidebar"}
      >
        {collapsed ? <ChevronRight className="w-3 h-3" /> : <ChevronLeft className="w-3 h-3" />}
      </button>
    </aside>
  )
}
