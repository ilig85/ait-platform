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
  Zap,
} from "lucide-react"
import { AitSidebar } from "@/components/ait/sidebar"
import { ShellProvider, useShellData } from "@/components/ait/shell-context"
import { Sheet, SheetContent, SheetTrigger } from "@/components/ui/sheet"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
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
      <div className="flex items-center gap-2 min-w-0">
        <div className="w-7 h-7 rounded-lg bg-accent flex items-center justify-center flex-shrink-0">
          <Zap className="w-3.5 h-3.5 text-accent-foreground" />
        </div>
        <div className="min-w-0">
          <span className="text-sidebar-foreground font-bold text-base">AIT</span>
          <p className="text-sidebar-foreground/50 text-[9px] leading-none truncate max-w-32">
            {organizationName ?? "No organization"}
          </p>
        </div>
      </div>
      <div className="flex items-center gap-2">
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button variant="ghost" size="sm" className="h-8 px-2 text-sidebar-foreground/70 text-xs font-semibold">
              {locale.toUpperCase()}<ChevronDown className="w-3 h-3 ml-1" />
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end" className="w-32">
            {LOCALES.map((language) => (
              <DropdownMenuItem
                key={language.value}
                onClick={() => setLocale(language.value as Locale)}
                className={cn("gap-2 cursor-pointer", locale === language.value && "font-medium")}
              >
                <span className="text-xs font-mono text-muted-foreground w-6">{language.flag}</span>{language.label}
              </DropdownMenuItem>
            ))}
          </DropdownMenuContent>
        </DropdownMenu>
        <Sheet open={open} onOpenChange={setOpen}>
          <SheetTrigger asChild>
            <Button variant="ghost" size="sm" className="h-8 w-8 p-0 text-sidebar-foreground/70">
              <Menu className="w-5 h-5" />
            </Button>
          </SheetTrigger>
          <SheetContent side="left" className="w-64 p-0 bg-sidebar border-sidebar-border">
            <div className="flex items-center gap-3 h-14 px-4 border-b border-sidebar-border">
              <div className="w-8 h-8 rounded-lg bg-accent flex items-center justify-center">
                <Zap className="w-4 h-4 text-accent-foreground" />
              </div>
              <div className="min-w-0">
                <span className="text-sidebar-foreground font-bold text-lg">AIT</span>
                <p className="text-sidebar-foreground/50 text-[10px] -mt-0.5 truncate">
                  {organizationName ?? "No organization"}
                </p>
              </div>
            </div>
            <nav className="py-4 px-2 space-y-0.5">
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
                      "flex items-center gap-3 px-3 py-2.5 rounded-lg transition-colors text-sm font-medium",
                      active
                        ? "bg-sidebar-accent text-sidebar-foreground"
                        : "text-sidebar-foreground/60 hover:text-sidebar-foreground hover:bg-sidebar-accent/60",
                    )}
                  >
                    <Icon className="w-4 h-4 flex-shrink-0" />
                    <span className="truncate">{t(item.labelKey)}</span>
                    {badge > 0 && (
                      <Badge className="ml-auto bg-accent text-accent-foreground text-[10px] px-1.5 h-[18px] border-0">
                        {badge}
                      </Badge>
                    )}
                  </Link>
                )
              })}
              <div className="pt-3 mt-3 border-t border-sidebar-border/50">
                <Link
                  href="/logout"
                  onClick={() => setOpen(false)}
                  className="flex items-center gap-3 px-3 py-2.5 rounded-lg transition-colors text-sm font-medium text-sidebar-foreground/40 hover:text-sidebar-foreground/70 hover:bg-sidebar-accent/60"
                >
                  <LogOut className="w-4 h-4" />{t("nav_logout")}
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
        <main className="lg:pl-64 pt-14 lg:pt-0 transition-all duration-300">
          <div className="p-4 md:p-6 max-w-[1400px]">{children}</div>
        </main>
      </div>
    </ShellProvider>
  )
}
