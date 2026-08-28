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
} from "lucide-react"
import { Tooltip, TooltipContent, TooltipTrigger } from "@/components/ui/tooltip"
import { useI18n } from "@/lib/i18n"
import { useShellData } from "@/components/ait/shell-context"
import { cn } from "@/lib/utils"
import { AitLogo } from "@/components/brand/ait-logo"

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
    <aside
      className={cn(
        "fixed inset-y-0 left-0 z-40 flex flex-col transition-all duration-300 ease-in-out",
        "bg-sidebar border-r border-sidebar-border",
        collapsed ? "w-16" : "w-60",
      )}
    >
      {/* Logo */}
      <div
        className={cn(
          "flex items-center h-14 px-4 border-b border-sidebar-border flex-shrink-0",
          collapsed ? "justify-center" : "gap-3",
        )}
      >
        {collapsed ? (
          /* Mark only when collapsed */
          <AitLogo variant="symbol" theme="sidebar" size="sm" label="AIT" />
        ) : (
          /* Mark + wordmark + org name when expanded */
          <div className="flex items-center gap-2.5 min-w-0">
            <AitLogo variant="symbol" theme="sidebar" size="sm" label="AIT" />
            <div className="min-w-0 leading-none">
              <span className="text-sidebar-foreground font-bold text-base tracking-tight">AIT</span>
              <p className="text-sidebar-foreground/40 text-[10px] mt-0.5 truncate">
                {organizationName ?? "No organization"}
              </p>
            </div>
          </div>
        )}
      </div>

      {/* Main nav */}
      <nav className="flex-1 py-3 overflow-y-auto overflow-x-hidden no-scrollbar">
        <ul className="space-y-0.5 px-2" role="list">
          {NAV_ITEMS.map((item) => {
            const active = pathname === item.href || pathname.startsWith(`${item.href}/`)
            const Icon = item.icon
            const badge = item.showUnread ? unreadConversationCount : 0
            return (
              <li key={item.href}>
                <Tooltip delayDuration={collapsed ? 100 : 999999}>
                  <TooltipTrigger asChild>
                    <Link
                      href={item.href}
                      className={cn(
                        "flex items-center rounded-md transition-all duration-150 relative",
                        collapsed ? "justify-center h-9 w-9 mx-auto" : "gap-2.5 px-2.5 py-2",
                        active
                          ? "bg-sidebar-accent text-sidebar-primary"
                          : "text-sidebar-foreground/50 hover:text-sidebar-foreground hover:bg-sidebar-accent/70",
                      )}
                      aria-current={active ? "page" : undefined}
                    >
                      <Icon className="w-4 h-4 flex-shrink-0" />
                      {!collapsed && (
                        <span className="text-sm font-medium truncate">{t(item.labelKey)}</span>
                      )}
                      {badge > 0 && (
                        <span
                          className={cn(
                            "text-[10px] font-semibold leading-none px-1.5 py-0.5 rounded-full",
                            "bg-destructive text-destructive-foreground",
                            collapsed ? "absolute -top-0.5 -right-0.5" : "ml-auto",
                          )}
                        >
                          {badge}
                        </span>
                      )}
                      {active && !collapsed && (
                        <span className="absolute left-0 top-1/2 -translate-y-1/2 w-0.5 h-4 bg-sidebar-primary rounded-r-full" />
                      )}
                    </Link>
                  </TooltipTrigger>
                  {collapsed && (
                    <TooltipContent side="right" className="bg-sidebar-accent text-sidebar-foreground text-xs border-sidebar-border">
                      {t(item.labelKey)}
                    </TooltipContent>
                  )}
                </Tooltip>
              </li>
            )
          })}
        </ul>

        <div className="mt-3 pt-3 border-t border-sidebar-border/40 space-y-0.5 px-2">
          {SECONDARY_ITEMS.map((item) => {
            const active = pathname.startsWith(item.href)
            const Icon = item.icon
            return (
              <Tooltip key={item.href} delayDuration={collapsed ? 100 : 999999}>
                <TooltipTrigger asChild>
                  <Link
                    href={item.href}
                    className={cn(
                      "flex items-center rounded-md transition-all duration-150",
                      collapsed ? "justify-center h-9 w-9 mx-auto" : "gap-2.5 px-2.5 py-2",
                      active
                        ? "bg-sidebar-accent text-sidebar-primary"
                        : "text-sidebar-foreground/40 hover:text-sidebar-foreground hover:bg-sidebar-accent/70",
                    )}
                    aria-current={active ? "page" : undefined}
                  >
                    <Icon className="w-4 h-4 flex-shrink-0" />
                    {!collapsed && <span className="text-sm font-medium truncate">{t(item.labelKey)}</span>}
                  </Link>
                </TooltipTrigger>
                {collapsed && (
                  <TooltipContent side="right" className="bg-sidebar-accent text-sidebar-foreground text-xs border-sidebar-border">
                    {t(item.labelKey)}
                  </TooltipContent>
                )}
              </Tooltip>
            )
          })}
        </div>
      </nav>

      {/* Logout */}
      <div className="border-t border-sidebar-border/40 p-2">
        <Tooltip delayDuration={collapsed ? 100 : 999999}>
          <TooltipTrigger asChild>
            <Link
              href="/logout"
              className={cn(
                "flex items-center rounded-md text-sidebar-foreground/30 hover:text-sidebar-foreground/60 hover:bg-sidebar-accent/60 transition-colors",
                collapsed ? "justify-center h-9 w-9 mx-auto" : "gap-2.5 px-2.5 py-2",
              )}
            >
              <LogOut className="w-4 h-4 flex-shrink-0" />
              {!collapsed && <span className="text-sm font-medium">{t("nav_logout")}</span>}
            </Link>
          </TooltipTrigger>
          {collapsed && (
            <TooltipContent side="right" className="bg-sidebar-accent text-sidebar-foreground text-xs border-sidebar-border">
              {t("nav_logout")}
            </TooltipContent>
          )}
        </Tooltip>
      </div>

      {/* Collapse toggle */}
      <button
        onClick={() => setCollapsed((v) => !v)}
        className={cn(
          "absolute -right-3 top-[4.5rem] w-6 h-6 rounded-full",
          "bg-sidebar border border-sidebar-primary/25 text-sidebar-primary/60 hover:text-sidebar-primary",
          "flex items-center justify-center shadow-sm transition-colors",
        )}
        aria-label={collapsed ? "Expand sidebar" : "Collapse sidebar"}
      >
        {collapsed ? <ChevronRight className="w-3 h-3" /> : <ChevronLeft className="w-3 h-3" />}
      </button>
    </aside>
  )
}
