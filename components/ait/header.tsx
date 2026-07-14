"use client"

import { useState } from "react"
import { Bell, Search, ChevronDown, Settings, HelpCircle, LogOut, User } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover"
import { useI18n, LOCALES, type Locale } from "@/lib/i18n"
import { DEMO_USER, DEMO_ALERTS } from "@/lib/mock-data"
import { cn } from "@/lib/utils"
import Link from "next/link"

const unreadAlerts = DEMO_ALERTS.filter((a) => !a.read)

export function AitHeader({ title, subtitle }: { title: string; subtitle?: string }) {
  const { t, locale, setLocale } = useI18n()
  const [notifOpen, setNotifOpen] = useState(false)

  return (
    <header className="flex items-center justify-between gap-4 mb-6">
      <div className="min-w-0">
        <h1 className="text-xl font-bold text-foreground truncate">{title}</h1>
        {subtitle && <p className="text-sm text-muted-foreground mt-0.5 text-pretty">{subtitle}</p>}
      </div>

      <div className="flex items-center gap-2 flex-shrink-0">
        {/* Search */}
        <Button variant="outline" size="sm" className="hidden md:flex items-center gap-2 text-muted-foreground h-9 px-3 text-sm">
          <Search className="w-3.5 h-3.5" />
          <span>{t("common_search")}</span>
          <kbd className="ml-1 text-[10px] bg-muted px-1.5 py-0.5 rounded font-mono">⌘K</kbd>
        </Button>

        {/* Language switcher */}
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button variant="outline" size="sm" className="h-9 px-2.5 text-xs font-semibold gap-1 tracking-wide">
              {locale.toUpperCase()}
              <ChevronDown className="w-3 h-3 opacity-60" />
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end" className="w-36">
            {LOCALES.map((l) => (
              <DropdownMenuItem
                key={l.value}
                onClick={() => setLocale(l.value as Locale)}
                className={cn("gap-2 cursor-pointer", locale === l.value && "bg-accent/30 font-medium")}
              >
                <span className="text-xs font-mono w-7 text-muted-foreground">{l.flag}</span>
                {l.label}
              </DropdownMenuItem>
            ))}
          </DropdownMenuContent>
        </DropdownMenu>

        {/* Notifications */}
        <Popover open={notifOpen} onOpenChange={setNotifOpen}>
          <PopoverTrigger asChild>
            <Button variant="outline" size="sm" className="relative h-9 w-9 p-0">
              <Bell className="w-4 h-4" />
              {unreadAlerts.length > 0 && (
                <Badge className="absolute -top-1 -right-1 w-4 h-4 p-0 flex items-center justify-center text-[9px] bg-destructive text-destructive-foreground border-background border-2">
                  {unreadAlerts.length}
                </Badge>
              )}
            </Button>
          </PopoverTrigger>
          <PopoverContent align="end" className="w-80 p-0">
            <div className="px-4 py-3 border-b">
              <p className="font-semibold text-sm">Notifications</p>
              <p className="text-xs text-muted-foreground">{unreadAlerts.length} unread</p>
            </div>
            <div className="divide-y max-h-72 overflow-y-auto">
              {DEMO_ALERTS.slice(0, 5).map((alert) => (
                <div
                  key={alert.id}
                  className={cn(
                    "px-4 py-3 text-sm",
                    !alert.read && "bg-accent/10"
                  )}
                >
                  <div className="flex items-start gap-2">
                    <span className={cn(
                      "mt-1 w-1.5 h-1.5 rounded-full flex-shrink-0",
                      alert.type === "escalation" && "bg-destructive",
                      alert.type === "channel" && "bg-amber-500",
                      alert.type === "knowledge" && "bg-primary",
                      alert.type === "task" && "bg-accent",
                      !alert.read && "opacity-100",
                      alert.read && "opacity-0"
                    )} />
                    <div className="min-w-0">
                      <p className="text-foreground text-xs leading-snug">{alert.message}</p>
                    </div>
                  </div>
                </div>
              ))}
            </div>
            <div className="px-4 py-2 border-t">
              <Button variant="ghost" size="sm" className="w-full text-xs text-muted-foreground">{t("common_view_all")}</Button>
            </div>
          </PopoverContent>
        </Popover>

        {/* Profile */}
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button variant="outline" size="sm" className="h-9 gap-2 px-2.5">
              <div className="w-6 h-6 rounded-full bg-primary/20 text-primary text-[10px] font-bold flex items-center justify-center">
                {DEMO_USER.avatar}
              </div>
              <span className="hidden sm:block text-xs font-medium max-w-[100px] truncate">{DEMO_USER.name}</span>
              <ChevronDown className="w-3 h-3 opacity-60" />
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end" className="w-48">
            <DropdownMenuLabel className="font-normal">
              <div>
                <p className="font-semibold text-sm truncate">{DEMO_USER.name}</p>
                <p className="text-xs text-muted-foreground truncate">{DEMO_USER.email}</p>
              </div>
            </DropdownMenuLabel>
            <DropdownMenuSeparator />
            <DropdownMenuItem asChild className="gap-2 cursor-pointer">
              <Link href="/settings"><User className="w-4 h-4" />{t("settings_profile")}</Link>
            </DropdownMenuItem>
            <DropdownMenuItem asChild className="gap-2 cursor-pointer">
              <Link href="/settings"><Settings className="w-4 h-4" />{t("nav_settings")}</Link>
            </DropdownMenuItem>
            <DropdownMenuItem asChild className="gap-2 cursor-pointer">
              <Link href="/help"><HelpCircle className="w-4 h-4" />{t("nav_help")}</Link>
            </DropdownMenuItem>
            <DropdownMenuSeparator />
            <DropdownMenuItem asChild className="gap-2 cursor-pointer text-destructive focus:text-destructive">
              <Link href="/logout"><LogOut className="w-4 h-4" />{t("nav_logout")}</Link>
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      </div>
    </header>
  )
}
