"use client"

import { useState } from "react"
import Link from "next/link"
import { Search, Phone, Globe, Clock, Tag, Plus, StickyNote, UserCheck, MessageCircle } from "lucide-react"
import { cn } from "@/lib/utils"
import { DEMO_CUSTOMERS, DEMO_CONVERSATIONS } from "@/lib/mock-data"
import type { Customer } from "@/lib/mock-data"
import { AitHeader } from "@/components/ait/header"
import { useI18n } from "@/lib/i18n"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"

const SENTIMENT_CONFIG = {
  positive: { label: "Positive", color: "text-[#0F766E] bg-[#0F766E]/10" },
  neutral:  { label: "Neutral",  color: "text-muted-foreground bg-muted" },
  negative: { label: "Negative", color: "text-destructive bg-destructive/10" },
}

const STATUS_COLOR = {
  ai_active:   "text-amber-700 bg-amber-50 border-amber-200",
  needs_human: "text-destructive bg-destructive/10 border-destructive/20",
  resolved:    "text-[#0F766E] bg-[#0F766E]/10 border-[#0F766E]/20",
  idle:        "text-muted-foreground bg-muted border-border",
}

function timeAgo(iso: string) {
  const diff = Date.now() - new Date(iso).getTime()
  const h = Math.floor(diff / 3600000)
  if (h < 1) return "< 1h ago"
  if (h < 24) return `${h}h ago`
  return `${Math.floor(h / 24)}d ago`
}

export function CustomersContent() {
  const { t } = useI18n()
  const [selected, setSelected] = useState<Customer | null>(DEMO_CUSTOMERS[0])
  const [search, setSearch] = useState("")

  const filtered = DEMO_CUSTOMERS.filter((c) =>
    c.name.toLowerCase().includes(search.toLowerCase()) ||
    c.phone.includes(search)
  )

  // Get conversations for selected customer
  const convs = selected
    ? DEMO_CONVERSATIONS.filter((cv) => cv.customerId === selected.id)
    : []

  return (
    <>
      <AitHeader title={t("customers_title")} subtitle="Customer profiles, sentiment, and conversation history." />

      <div className="flex gap-4 h-[calc(100vh-9.5rem)]">
        {/* Customer list */}
        <div className="w-72 xl:w-80 flex-shrink-0 flex flex-col gap-2">
          <div className="relative">
            <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-muted-foreground" />
            <input
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder={t("customers_search")}
              className="w-full pl-8 pr-4 py-2 text-sm bg-card border border-border rounded-lg text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-ring/40"
            />
          </div>
          <div className="flex flex-col gap-1.5 overflow-y-auto flex-1 pr-0.5">
            {filtered.map((c) => (
              <button
                key={c.id}
                onClick={() => setSelected(c)}
                className={cn(
                  "flex items-center gap-3 px-3 py-3 rounded-xl text-left transition-all border",
                  selected?.id === c.id
                    ? "bg-accent/20 border-accent/50"
                    : "bg-card border-border hover:bg-accent/30"
                )}
              >
                <div className="w-9 h-9 rounded-full bg-primary/15 flex items-center justify-center text-sm font-bold text-primary flex-shrink-0">
                  {c.name.charAt(0)}
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center justify-between gap-1">
                    <span className="text-sm font-medium text-foreground truncate">{c.name}</span>
                    <span className="text-[10px] text-muted-foreground flex-shrink-0">{timeAgo(c.lastContact)}</span>
                  </div>
                  <div className="flex items-center gap-1.5 mt-0.5">
                    <span className={cn(
                      "text-[10px] font-medium px-1.5 py-0.5 rounded-full border capitalize",
                      STATUS_COLOR[c.conversationStatus]
                    )}>{c.conversationStatus.replace("_", " ")}</span>
                    <span className="text-[10px] text-muted-foreground uppercase">{c.language}</span>
                  </div>
                </div>
              </button>
            ))}
          </div>
        </div>

        {/* Customer detail */}
        {selected ? (
          <div className="flex-1 bg-card border border-border rounded-xl overflow-y-auto">
            {/* Profile header */}
            <div className="p-5 border-b border-border">
              <div className="flex items-start gap-4">
                <div className="w-14 h-14 rounded-full bg-primary/15 flex items-center justify-center text-xl font-bold text-primary flex-shrink-0">
                  {selected.name.charAt(0)}
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 flex-wrap">
                    <h2 className="text-lg font-semibold text-foreground">{selected.name}</h2>
                    <span className={cn(
                      "text-xs font-medium px-2 py-0.5 rounded-full",
                      SENTIMENT_CONFIG[selected.sentiment].color
                    )}>
                      {SENTIMENT_CONFIG[selected.sentiment].label}
                    </span>
                  </div>
                  <div className="flex flex-wrap gap-3 mt-1">
                    <span className="flex items-center gap-1.5 text-xs text-muted-foreground">
                      <Phone className="w-3.5 h-3.5" />{selected.phone}
                    </span>
                    <span className="flex items-center gap-1.5 text-xs text-muted-foreground">
                      <Globe className="w-3.5 h-3.5" />{selected.language.toUpperCase()}
                    </span>
                    <span className="flex items-center gap-1.5 text-xs text-muted-foreground">
                      <Clock className="w-3.5 h-3.5" />Last contact: {timeAgo(selected.lastContact)}
                    </span>
                  </div>
                  <div className="flex flex-wrap gap-1.5 mt-2">
                    {selected.tags.map((tag) => (
                      <Badge key={tag} variant="outline" className="text-[10px] h-5 px-1.5 gap-1">
                        <Tag className="w-2.5 h-2.5" />{tag}
                      </Badge>
                    ))}
                  </div>
                </div>
                {selected.assignedManager && (
                  <div className="text-right flex-shrink-0">
                    <p className="text-[10px] text-muted-foreground">Assigned to</p>
                    <p className="text-xs font-medium">{selected.assignedManager}</p>
                  </div>
                )}
              </div>
            </div>

            {/* Stats */}
            <div className="grid grid-cols-3 divide-x divide-border border-b border-border">
              {[
                { label: "Conversations", value: selected.totalConversations },
                { label: "AI handled",    value: selected.aiHandledCount },
                { label: "Escalated",     value: selected.humanEscalationCount },
              ].map((stat) => (
                <div key={stat.label} className="px-5 py-4 text-center">
                  <p className="text-2xl font-bold text-foreground">{stat.value}</p>
                  <p className="text-xs text-muted-foreground mt-0.5">{stat.label}</p>
                </div>
              ))}
            </div>

            {/* Interests */}
            {selected.interests.length > 0 && (
              <div className="px-5 py-4 border-b border-border">
                <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wide mb-2">Interests</p>
                <div className="flex flex-wrap gap-1.5">
                  {selected.interests.map((i) => (
                    <Badge key={i} variant="secondary" className="text-xs">{i}</Badge>
                  ))}
                </div>
              </div>
            )}

            {/* Notes */}
            {selected.notes.length > 0 && (
              <div className="px-5 py-4 border-b border-border">
                <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wide mb-2">Manager notes</p>
                <ul className="space-y-1">
                  {selected.notes.map((n) => (
                    <li key={n} className="text-sm text-foreground">· {n}</li>
                  ))}
                </ul>
              </div>
            )}

            {/* Conversations */}
            <div className="px-5 py-4 border-b border-border">
              <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wide mb-3">Recent conversations</p>
              {convs.length === 0 ? (
                <p className="text-xs text-muted-foreground">{t("common_empty")}</p>
              ) : (
                <div className="space-y-2">
                  {convs.map((conv) => (
                    <Link key={conv.id} href="/inbox">
                      <div className="flex items-center gap-3 p-3 rounded-lg hover:bg-accent/40 transition-colors cursor-pointer border border-border">
                        <MessageCircle className="w-4 h-4 text-muted-foreground flex-shrink-0" />
                        <div className="flex-1 min-w-0">
                          <p className="text-sm text-foreground truncate">{conv.lastMessage}</p>
                          <p className="text-[10px] text-muted-foreground mt-0.5">{timeAgo(conv.lastMessageTime)} · {conv.status.replace("_", " ")}</p>
                        </div>
                        <Badge variant="outline" className={cn("text-[10px] h-5 px-1.5 border", STATUS_COLOR[conv.status])}>
                          {conv.status.replace("_", " ")}
                        </Badge>
                      </div>
                    </Link>
                  ))}
                </div>
              )}
            </div>

            {/* Actions */}
            <div className="px-5 py-4 flex gap-2 flex-wrap">
              <Button size="sm" variant="outline" className="gap-2 h-8 text-xs">
                <StickyNote className="w-3.5 h-3.5" />{t("customers_add_note")}
              </Button>
              <Button size="sm" variant="outline" className="gap-2 h-8 text-xs">
                <UserCheck className="w-3.5 h-3.5" />{t("customers_assign_manager")}
              </Button>
              <Button size="sm" variant="outline" className="gap-2 h-8 text-xs" asChild>
                <Link href="/inbox">
                  <MessageCircle className="w-3.5 h-3.5" />{t("customers_open_conversation")}
                </Link>
              </Button>
              <Button size="sm" variant="outline" className="gap-2 h-8 text-xs" asChild>
                <Link href="/ai-tasks">
                  <Plus className="w-3.5 h-3.5" />{t("customers_create_task")}
                </Link>
              </Button>
            </div>
          </div>
        ) : (
          <div className="flex-1 flex items-center justify-center text-muted-foreground text-sm">
            Select a customer to view their profile.
          </div>
        )}
      </div>
    </>
  )
}
