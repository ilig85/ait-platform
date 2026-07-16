"use client"

import { useState } from "react"
import Link from "next/link"
import { usePathname } from "next/navigation"
import {
  BarChart3,
  BookOpen,
  ChevronDown,
  HelpCircle,
  LayoutDashboard,
  LogOut,
  Menu,
  MessageSquare,
  Settings,
  Sparkles,
  Users,
} from "lucide-react"
import { AitLogo } from "@/components/brand/ait-logo"
import { AitSidebar } from "@/components/ait/sidebar"
import { ShellProvider, useShellData } from "@/components/ait/shell-context"
import { Sheet, SheetContent, SheetTrigger } from "@/components/ui/sheet"
import { Button } from "@/components/ui/button"
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from "@/components/ui/dropdown-menu"
import { useI18n, LOCALES, type Locale } from "@/lib/i18n"
import type { ShellData } from "@/lib/data/models"
import { cn } from "@/lib/utils"

const NAV_ITEMS = [
  { href: "/dashboard", labelKey: "nav_overview" as const, icon: LayoutDashboard },
  { href: "/inbox", labelKey: "nav_inbox" as const, icon: MessageSquare, showUnread: true },
  { href: "/ai-tasks", labelKey: "nav_ai_tasks" as const, icon: Sparkles },
  { href: "/customers", labelKey: "nav_customers" as const, icon: Users },
  { href: "/knowledge", labelKey: "nav_knowledge" as const, icon: BookOpen },
  { href: "/insights", labelKey: "nav_insights" as const, icon: BarChart3 },
  { href: "/settings", labelKey: "nav_settings" as const, icon: Settings },
  { href: "/help", labelKey: "nav_help" as const, icon: HelpCircle },
]

function MobileNav() {
  const { t, locale, setLocale } = useI18n()
  const { organizationName, unreadConversationCount } = useShellData()
  const pathname = usePathname()
  const [open, setOpen] = useState(false)

  return (
    <div className="lg:hidden fixed top-0 inset-x-0 z-50 flex items-center justify-between h-14 px-4 bg-sidebar border-b border-sidebar-border">
      <div className="flex items-center gap-2.5 min-w-0">
        <AitLogo variant="symbol" theme="sidebar" size="sm" label="AIT" />
        <div className="min-w-0 leading-none">
          <span className="text-sidebar-foreground font-bold text-base tracking-tight">AIT</span>
          <p className="text-sidebar-foreground/40 text-[9px] mt-0.5 truncate max-w-32">
            {organizationName ?? "No organization"}
          </p>
        </div>
      </div>

      <div className="flex items-center gap-1.5">
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button variant="ghost" size="sm" className="h-8 px-2 text-sidebar-foreground/70 text-xs font-semibold hover:bg-sidebar-accent/60">
              {locale.toUpperCase()}
              <ChevronDown className="w-3 h-3 ml-1 opacity-60" />
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end" className="w-32">
            {LOCALES.map((language) => (
              <DropdownMenuItem
                key={language.value}
                onClick={() => setLocale(language.value as Locale)}
                className={cn("gap-2 cursor-pointer", locale === language.value && "font-medium")}
              >
                <span className="text-xs font-mono text-muted-foreground w-6">{language.flag}</span>
                {language.label}
              </DropdownMenuItem>
            ))}
          </DropdownMenuContent>
        </DropdownMenu>

        <Sheet open={open} onOpenChange={setOpen}>
          <SheetTrigger asChild>
            <Button variant="ghost" size="sm" className="h-8 w-8 p-0 text-sidebar-foreground/70 hover:bg-sidebar-accent/60">
              <Menu className="w-5 h-5" />
              <span className="sr-only">Open navigation menu</span>
            </Button>
          </SheetTrigger>
          <SheetContent side="left" className="w-60 p-0 bg-sidebar border-sidebar-border">
            <div className="flex items-center gap-2.5 h-14 px-4 border-b border-sidebar-border">
              <AitLogo variant="symbol" theme="sidebar" size="sm" label="AIT" />
              <div className="min-w-0 leading-none">
                <span className="text-sidebar-foreground font-bold text-base tracking-tight">AIT</span>
                <p className="text-sidebar-foreground/40 text-[10px] mt-0.5 truncate">
                  {organizationName ?? "No organization"}
                </p>
              </div>
            </div>
            <nav className="py-3 px-2 space-y-0.5">
              {NAV_ITEMS.map((item) => {
                const active = pathname === item.href || pathname.startsWith(`${item.href}/`)
                const Icon = item.icon
                const badge = item.showUnread ? unreadConversationCount : 0
                return (
                  <Link
                    key={item.href}
                    href={item.href}
                    onClick={() => setOpen(false)}
                    className={cn(
                      "flex items-center gap-2.5 px-2.5 py-2 rounded-md transition-colors text-sm font-medium",
                      active
                        ? "bg-sidebar-accent text-[#2DE2B1]"
                        : "text-sidebar-foreground/50 hover:text-sidebar-foreground hover:bg-sidebar-accent/70",
                    )}
                    aria-current={active ? "page" : undefined}
                  >
                    <Icon className="w-4 h-4 flex-shrink-0" />
                    <span className="truncate">{t(item.labelKey)}</span>
                    {badge > 0 && (
                      <span className="ml-auto text-[10px] font-semibold leading-none px-1.5 py-0.5 rounded-full bg-[#FF6B6B] text-white">
                        {badge}
                      </span>
                    )}
                  </Link>
                )
              })}
              <div className="pt-3 mt-3 border-t border-sidebar-border/40">
                <Link
                  href="/logout"
                  onClick={() => setOpen(false)}
                  className="flex items-center gap-2.5 px-2.5 py-2 rounded-md transition-colors text-sm font-medium text-sidebar-foreground/30 hover:text-sidebar-foreground/70 hover:bg-sidebar-accent/60"
                >
                  <LogOut className="w-4 h-4" />
                  {t("nav_logout")}
                </Link>
              </div>
            </nav>
          </SheetContent>
        </Sheet>
      </div>
    </div>
  )
}

export function AppShellClient({
  children,
  shell,
}: {
  children: React.ReactNode
  shell: ShellData
}) {
  return (
    <ShellProvider value={shell}>
      <div className="min-h-screen bg-background">
        <div className="hidden lg:block">
          <AitSidebar />
        </div>
        <MobileNav />
        {/* Sidebar is w-60, collapsed is w-16 — use w-60 as default offset */}
        <main id="main-content" className="lg:pl-60 pt-14 lg:pt-0 transition-all duration-300">
          <div className="p-5 md:p-6 lg:p-7 max-w-[1400px]">{children}</div>
        </main>
      </div>
    </ShellProvider>
  )
}
