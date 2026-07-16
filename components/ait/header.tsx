"use client"

import { useState } from "react"
import Link from "next/link"
import { Bell, ChevronDown, HelpCircle, LogOut, Search, Settings, User } from "lucide-react"
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
import { useShellData } from "@/components/ait/shell-context"
import { cn } from "@/lib/utils"

export function AitHeader({ title, subtitle }: { title: string; subtitle?: string }) {
  const { t, locale, setLocale } = useI18n()
  const { user, organizationName, needsHumanCount } = useShellData()
  const [notifOpen, setNotifOpen] = useState(false)
  const displayName = user?.displayName ?? "User"
  const avatarInitial = displayName.charAt(0).toUpperCase()

  return (
    <header className="flex items-center justify-between gap-4 mb-6">
      <div className="min-w-0">
        <h1 className="text-xl font-bold text-foreground truncate">{title}</h1>
        {subtitle && <p className="text-sm text-muted-foreground mt-0.5 text-pretty">{subtitle}</p>}
      </div>

      <div className="flex items-center gap-2 flex-shrink-0">
        <Button variant="outline" size="sm" className="hidden md:flex items-center gap-2 text-muted-foreground h-9 px-3 text-sm">
          <Search className="w-3.5 h-3.5" />
          <span>{t("common_search")}</span>
          <kbd className="ml-1 text-[10px] bg-muted px-1.5 py-0.5 rounded font-mono">⌘K</kbd>
        </Button>

        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button variant="outline" size="sm" className="h-9 px-2.5 text-xs font-semibold gap-1 tracking-wide">
              {locale.toUpperCase()}<ChevronDown className="w-3 h-3 opacity-60" />
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end" className="w-36">
            {LOCALES.map((language) => (
              <DropdownMenuItem
                key={language.value}
                onClick={() => setLocale(language.value as Locale)}
                className={cn("gap-2 cursor-pointer", locale === language.value && "bg-accent/30 font-medium")}
              >
                <span className="text-xs font-mono w-7 text-muted-foreground">{language.flag}</span>
                {language.label}
              </DropdownMenuItem>
            ))}
          </DropdownMenuContent>
        </DropdownMenu>

        <Popover open={notifOpen} onOpenChange={setNotifOpen}>
          <PopoverTrigger asChild>
            <Button variant="outline" size="sm" className="relative h-9 w-9 p-0">
              <Bell className="w-4 h-4" />
              {needsHumanCount > 0 && (
                <Badge className="absolute -top-1 -right-1 min-w-4 h-4 px-1 flex items-center justify-center text-[9px] bg-destructive text-destructive-foreground border-background border-2">
                  {needsHumanCount}
                </Badge>
              )}
            </Button>
          </PopoverTrigger>
          <PopoverContent align="end" className="w-80 p-0">
            <div className="px-4 py-3 border-b">
              <p className="font-semibold text-sm">Notifications</p>
              <p className="text-xs text-muted-foreground">Live workspace status</p>
            </div>
            {needsHumanCount > 0 ? (
              <Link href="/inbox?filter=needs_human" onClick={() => setNotifOpen(false)} className="block px-4 py-3 hover:bg-muted/40">
                <p className="text-xs text-foreground">
                  {needsHumanCount} {needsHumanCount === 1 ? "conversation needs" : "conversations need"} human attention.
                </p>
              </Link>
            ) : (
              <p className="px-4 py-6 text-center text-xs text-muted-foreground">No conversations currently need attention.</p>
            )}
          </PopoverContent>
        </Popover>

        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button variant="outline" size="sm" className="h-9 gap-2 px-2.5">
              <div className="w-6 h-6 rounded-full bg-primary/20 text-primary text-[10px] font-bold flex items-center justify-center">
                {avatarInitial}
              </div>
              <span className="hidden sm:block text-xs font-medium max-w-[100px] truncate">{displayName}</span>
              <ChevronDown className="w-3 h-3 opacity-60" />
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end" className="w-52">
            <DropdownMenuLabel className="font-normal">
              <div>
                <p className="font-semibold text-sm truncate">{displayName}</p>
                <p className="text-xs text-muted-foreground truncate">{user?.email ?? ""}</p>
                <p className="text-[10px] text-muted-foreground truncate mt-1">{organizationName ?? "No organization"}</p>
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
