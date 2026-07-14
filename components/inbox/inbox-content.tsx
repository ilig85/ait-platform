"use client"

import { useState, useMemo } from "react"
import {
  Search, Filter, MessageSquare, AlertCircle, Zap, CheckCircle2,
  Send, RefreshCw, UserCheck, UserX, ArrowUpCircle, Tag,
  Paperclip, FileText, ChevronRight, Users, Info, Clock,
  ThumbsUp, MoreHorizontal, Plus, StickyNote,
} from "lucide-react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Badge } from "@/components/ui/badge"
import { Textarea } from "@/components/ui/textarea"
import { ScrollArea } from "@/components/ui/scroll-area"
import { Separator } from "@/components/ui/separator"
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Card } from "@/components/ui/card"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { Tooltip, TooltipContent, TooltipTrigger } from "@/components/ui/tooltip"
import { useI18n } from "@/lib/i18n"
import { DEMO_CONVERSATIONS, DEMO_CUSTOMERS, type Conversation, type Message } from "@/lib/mock-data"
import { cn } from "@/lib/utils"

type Filter = "all" | "unread" | "needs_human" | "ai_active" | "resolved"

function timeAgo(iso: string) {
  const diff = Date.now() - new Date(iso).getTime()
  const m = Math.floor(diff / 60000)
  if (m < 60) return `${m}m`
  const h = Math.floor(m / 60)
  if (h < 24) return `${h}h`
  return `${Math.floor(h / 24)}d`
}

const STATUS_CONFIG: Record<string, { label: string; icon: React.ElementType; color: string; badge: string }> = {
  needs_human: { label: "Needs human",  icon: AlertCircle,   color: "text-destructive",   badge: "bg-destructive/10 text-destructive border-destructive/20" },
  ai_active:   { label: "AI active",    icon: Zap,           color: "text-amber-600",     badge: "bg-amber-50 text-amber-700 border-amber-200"             },
  resolved:    { label: "Resolved",     icon: CheckCircle2,  color: "text-[#0F766E]",     badge: "bg-[#0F766E]/10 text-[#0F766E] border-[#0F766E]/20"     },
  idle:        { label: "Idle",         icon: MessageSquare, color: "text-muted-foreground", badge: "bg-muted text-muted-foreground border-border"          },
}

function ConvRow({ conv, active, onClick }: { conv: Conversation; active: boolean; onClick: () => void }) {
  const cfg = STATUS_CONFIG[conv.status]
  const StatusIcon = cfg.icon
  return (
    <button
      onClick={onClick}
      className={cn(
        "w-full text-left px-3 py-3 flex items-start gap-3 border-b border-border/50 hover:bg-muted/40 transition-colors",
        active && "bg-accent/10 border-l-2 border-l-accent"
      )}
    >
      <div className="w-8 h-8 rounded-full bg-primary/15 text-primary text-xs font-bold flex items-center justify-center flex-shrink-0 mt-0.5">
        {conv.customerName.slice(0, 2).toUpperCase()}
      </div>
      <div className="flex-1 min-w-0">
        <div className="flex items-center justify-between gap-1 mb-0.5">
          <span className="text-sm font-semibold truncate">{conv.customerName}</span>
          <span className="text-[10px] text-muted-foreground flex-shrink-0">{timeAgo(conv.lastMessageTime)}</span>
        </div>
        <p className="text-xs text-muted-foreground truncate">{conv.lastMessage}</p>
        <div className="flex items-center gap-1.5 mt-1.5">
          <StatusIcon className={cn("w-3 h-3", cfg.color)} />
          <span className={cn("text-[10px] font-medium px-1.5 py-0.5 rounded-full border", cfg.badge)}>{cfg.label}</span>
          {conv.unreadCount > 0 && (
            <span className="ml-auto text-[10px] bg-accent text-accent-foreground rounded-full px-1.5 py-0.5 font-semibold">{conv.unreadCount}</span>
          )}
        </div>
      </div>
    </button>
  )
}

function MessageBubble({ msg }: { msg: Message }) {
  const isCustomer = msg.sender === "customer"
  const isInternal = msg.isInternal
  const isDraft = msg.aiDraft

  if (isDraft) {
    return (
      <div className="flex flex-col gap-1.5 mb-3">
        <div className="flex items-center gap-2">
          <Zap className="w-3.5 h-3.5 text-[#0F766E]" />
          <span className="text-xs font-semibold text-[#0F766E]">AI Draft</span>
          {msg.knowledgeSources && (
            <span className="text-[10px] text-muted-foreground">· Sources: {msg.knowledgeSources.join(", ")}</span>
          )}
        </div>
        <div className="border border-[#0F766E]/30 rounded-xl p-3 bg-[#0F766E]/5">
          <p className="text-sm text-foreground leading-relaxed">{msg.text}</p>
        </div>
      </div>
    )
  }

  return (
    <div className={cn("flex mb-2", isCustomer ? "justify-start" : "justify-end")}>
      {isCustomer && (
        <div className="w-6 h-6 rounded-full bg-primary/15 text-primary text-[9px] font-bold flex items-center justify-center mr-2 mt-auto flex-shrink-0">C</div>
      )}
      <div className={cn(
        "max-w-[75%] rounded-2xl px-3 py-2 text-sm leading-relaxed",
        isCustomer    && "bg-muted text-foreground rounded-tl-sm",
        !isCustomer && !isInternal && "bg-[#15253D] text-white rounded-tr-sm",
        isInternal  && "bg-amber-50 text-amber-900 border border-amber-200 rounded-tr-sm",
        msg.sender === "ai" && !isDraft && "bg-[#0F766E]/15 text-foreground rounded-tr-sm",
      )}>
        {isInternal && <p className="text-[10px] font-semibold text-amber-600 mb-0.5">Internal note</p>}
        {msg.sender === "ai" && !isCustomer && !isInternal && (
          <div className="flex items-center gap-1 mb-0.5">
            <Zap className="w-3 h-3 text-[#0F766E]" />
            <p className="text-[10px] font-semibold text-[#0F766E]">AI</p>
          </div>
        )}
        {msg.sender === "manager" && !isInternal && (
          <p className="text-[10px] font-semibold text-white/70 mb-0.5">Manager</p>
        )}
        {msg.text}
        <div className="flex items-center justify-end gap-1 mt-1">
          <span className="text-[10px] opacity-50">{new Date(msg.timestamp).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })}</span>
          {msg.deliveryStatus === "read" && <span className="text-[10px] text-blue-300">✓✓</span>}
        </div>
      </div>
    </div>
  )
}

function CustomerPanel({ conv }: { conv: Conversation }) {
  const customer = DEMO_CUSTOMERS.find((c) => c.id === conv.customerId)
  if (!customer) return null

  return (
    <div className="w-72 xl:w-80 flex-shrink-0 border-l border-border bg-card overflow-y-auto">
      <div className="p-4 border-b border-border">
        <div className="flex items-center gap-3 mb-3">
          <div className="w-10 h-10 rounded-full bg-primary/15 text-primary text-sm font-bold flex items-center justify-center flex-shrink-0">
            {customer.name.slice(0, 2).toUpperCase()}
          </div>
          <div className="min-w-0">
            <p className="font-semibold text-sm truncate">{customer.name}</p>
            <p className="text-xs text-muted-foreground">{customer.phone}</p>
          </div>
        </div>
        <div className="flex gap-2 flex-wrap">
          {customer.tags.map((tag) => (
            <Badge key={tag} variant="outline" className="text-[10px] h-5 px-1.5">{tag}</Badge>
          ))}
        </div>
      </div>
      <div className="p-4 space-y-4 text-xs">
        <div>
          <p className="text-muted-foreground font-medium mb-1">Preferred language</p>
          <p className="font-medium uppercase">{customer.language}</p>
        </div>
        <div>
          <p className="text-muted-foreground font-medium mb-1">Sentiment</p>
          <span className={cn(
            "font-medium capitalize",
            customer.sentiment === "positive" && "text-[#0F766E]",
            customer.sentiment === "neutral"  && "text-muted-foreground",
            customer.sentiment === "negative" && "text-destructive",
          )}>{customer.sentiment}</span>
        </div>
        <div>
          <p className="text-muted-foreground font-medium mb-1">Conversations</p>
          <p>{customer.totalConversations} total · {customer.aiHandledCount} AI · {customer.humanEscalationCount} escalated</p>
        </div>
        <div>
          <p className="text-muted-foreground font-medium mb-1">Interests</p>
          <div className="flex flex-wrap gap-1">
            {customer.interests.map((i) => (
              <Badge key={i} variant="secondary" className="text-[10px] h-5 px-1.5">{i}</Badge>
            ))}
          </div>
        </div>
        {customer.notes.length > 0 && (
          <div>
            <p className="text-muted-foreground font-medium mb-1">Notes</p>
            <ul className="space-y-1">
              {customer.notes.map((n) => (
                <li key={n} className="text-foreground">{n}</li>
              ))}
            </ul>
          </div>
        )}
        <Separator />
        <div className="space-y-2">
          <Button size="sm" variant="outline" className="w-full justify-start gap-2 h-8 text-xs">
            <StickyNote className="w-3.5 h-3.5" />Add note
          </Button>
          <Button size="sm" variant="outline" className="w-full justify-start gap-2 h-8 text-xs">
            <UserCheck className="w-3.5 h-3.5" />Assign manager
          </Button>
          <Button size="sm" variant="outline" className="w-full justify-start gap-2 h-8 text-xs">
            <Plus className="w-3.5 h-3.5" />Create task
          </Button>
        </div>
      </div>
    </div>
  )
}

export function InboxContent() {
  const { t } = useI18n()
  const [filter, setFilter] = useState<Filter>("all")
  const [search, setSearch] = useState("")
  const [activeId, setActiveId] = useState<string>(DEMO_CONVERSATIONS[0].id)
  const [composerMode, setComposerMode] = useState<"reply" | "note">("reply")
  const [draft, setDraft] = useState("")
  const [showCustomerPanel, setShowCustomerPanel] = useState(true)

  const filtered = useMemo(() => {
    return DEMO_CONVERSATIONS.filter((c) => {
      const matchFilter =
        filter === "all" ? true :
        filter === "unread" ? c.unreadCount > 0 :
        c.status === filter
      const matchSearch = search
        ? c.customerName.toLowerCase().includes(search.toLowerCase()) ||
          c.lastMessage.toLowerCase().includes(search.toLowerCase())
        : true
      return matchFilter && matchSearch
    })
  }, [filter, search])

  const active = DEMO_CONVERSATIONS.find((c) => c.id === activeId) ?? DEMO_CONVERSATIONS[0]
  const channelConfigured = false // WhatsApp not connected in demo

  return (
    <div className="flex h-[calc(100vh-5rem)] rounded-xl border border-border bg-card overflow-hidden -mx-0">
      {/* Conversation list */}
      <div className="w-72 xl:w-80 flex-shrink-0 flex flex-col border-r border-border">
        <div className="p-3 border-b border-border space-y-2">
          <div className="relative">
            <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-muted-foreground" />
            <Input
              placeholder={t("inbox_search_conversations")}
              className="pl-8 h-8 text-xs"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
            />
          </div>
          <div className="flex gap-1 overflow-x-auto pb-0.5 no-scrollbar">
            {(["all", "unread", "needs_human", "ai_active", "resolved"] as Filter[]).map((f) => (
              <button
                key={f}
                onClick={() => setFilter(f)}
                className={cn(
                  "text-[10px] font-medium px-2.5 py-1 rounded-full whitespace-nowrap transition-colors flex-shrink-0",
                  filter === f
                    ? "bg-[#15253D] text-white"
                    : "bg-muted text-muted-foreground hover:bg-muted/80"
                )}
              >
                {f === "all" ? "All" : f === "unread" ? t("inbox_unread") : f === "needs_human" ? t("inbox_needs_human") : f === "ai_active" ? t("inbox_ai_active") : t("inbox_resolved")}
              </button>
            ))}
          </div>
        </div>
        <ScrollArea className="flex-1">
          {filtered.length === 0 ? (
            <div className="p-6 text-center text-xs text-muted-foreground">{t("inbox_no_conversations")}</div>
          ) : (
            filtered.map((conv) => (
              <ConvRow key={conv.id} conv={conv} active={conv.id === activeId} onClick={() => setActiveId(conv.id)} />
            ))
          )}
        </ScrollArea>
      </div>

      {/* Thread */}
      <div className="flex-1 flex flex-col min-w-0">
        {/* Thread header */}
        <div className="flex items-center justify-between gap-3 px-4 py-3 border-b border-border flex-shrink-0">
          <div className="flex items-center gap-3 min-w-0">
            <div className="w-8 h-8 rounded-full bg-primary/15 text-primary text-xs font-bold flex items-center justify-center flex-shrink-0">
              {active.customerName.slice(0, 2).toUpperCase()}
            </div>
            <div className="min-w-0">
              <p className="font-semibold text-sm truncate">{active.customerName}</p>
              <div className="flex items-center gap-1.5">
                {(() => { const cfg = STATUS_CONFIG[active.status]; const Icon = cfg.icon; return <><Icon className={cn("w-3 h-3", cfg.color)} /><span className="text-[10px] text-muted-foreground">{cfg.label}</span></> })()}
              </div>
            </div>
          </div>
          <div className="flex items-center gap-1.5 flex-shrink-0">
            <Button size="sm" variant="outline" className="h-7 text-xs gap-1 hidden sm:flex">
              <ArrowUpCircle className="w-3.5 h-3.5" />{t("inbox_escalate")}
            </Button>
            <Button size="sm" variant="outline" className="h-7 text-xs gap-1 hidden sm:flex text-[#0F766E] border-[#0F766E]/30 hover:bg-[#0F766E]/10">
              <CheckCircle2 className="w-3.5 h-3.5" />{t("inbox_resolve")}
            </Button>
            <Button size="sm" variant="ghost" className="h-7 w-7 p-0" onClick={() => setShowCustomerPanel((v) => !v)}>
              <Users className="w-4 h-4" />
            </Button>
          </div>
        </div>

        {/* Messages */}
        <ScrollArea className="flex-1 px-4 py-3">
          <div className="space-y-1">
            {active.messages.map((msg) => <MessageBubble key={msg.id} msg={msg} />)}
          </div>

          {/* AI draft action bar */}
          {active.messages.some((m) => m.aiDraft) && (
            <div className="mt-3 flex items-center gap-2 p-3 rounded-xl border border-[#0F766E]/30 bg-[#0F766E]/5 flex-wrap">
              <Button size="sm" className="h-7 text-xs bg-[#0F766E] hover:bg-[#0F766E]/90 text-white gap-1.5">
                <ThumbsUp className="w-3.5 h-3.5" />{t("inbox_approve_send")}
              </Button>
              <Button size="sm" variant="outline" className="h-7 text-xs gap-1.5">
                <RefreshCw className="w-3.5 h-3.5" />{t("inbox_regenerate")}
              </Button>
              <Button size="sm" variant="outline" className="h-7 text-xs gap-1.5">
                <UserCheck className="w-3.5 h-3.5" />{t("inbox_take_over")}
              </Button>
            </div>
          )}
        </ScrollArea>

        {/* Channel not configured banner */}
        {!channelConfigured && (
          <div className="px-4 pb-2">
            <Alert className="border-amber-200 bg-amber-50 py-2">
              <AlertCircle className="h-3.5 w-3.5 text-amber-600" />
              <AlertDescription className="text-xs text-amber-800 ml-1">
                {t("inbox_channel_not_configured")}
                {" "}<a href="/settings" className="underline font-medium">Configure in Settings</a>
              </AlertDescription>
            </Alert>
          </div>
        )}

        {/* Composer */}
        <div className="border-t border-border p-3 flex-shrink-0">
          <div className="flex gap-2 mb-2">
            <button
              onClick={() => setComposerMode("reply")}
              className={cn("text-xs font-medium px-2.5 py-1 rounded-full transition-colors", composerMode === "reply" ? "bg-foreground text-background" : "text-muted-foreground hover:bg-muted")}
            >
              {t("inbox_reply")}
            </button>
            <button
              onClick={() => setComposerMode("note")}
              className={cn("text-xs font-medium px-2.5 py-1 rounded-full transition-colors flex items-center gap-1", composerMode === "note" ? "bg-amber-100 text-amber-800" : "text-muted-foreground hover:bg-muted")}
            >
              <StickyNote className="w-3 h-3" />{t("inbox_internal_note")}
            </button>
          </div>
          <div className="relative">
            <Textarea
              placeholder={composerMode === "note" ? "Add an internal note..." : t("inbox_composer_placeholder")}
              className={cn("min-h-[72px] resize-none text-sm pr-20", composerMode === "note" && "bg-amber-50/60 border-amber-200")}
              value={draft}
              onChange={(e) => setDraft(e.target.value)}
            />
            <div className="absolute bottom-2 right-2 flex gap-1">
              <Button size="sm" variant="ghost" className="h-7 w-7 p-0">
                <Paperclip className="w-3.5 h-3.5" />
              </Button>
              <Button
                size="sm"
                className="h-7 w-7 p-0 bg-[#0F766E] hover:bg-[#0F766E]/90 text-white"
                disabled={!channelConfigured && composerMode === "reply"}
                title={!channelConfigured && composerMode === "reply" ? "WhatsApp not configured" : undefined}
              >
                <Send className="w-3.5 h-3.5" />
              </Button>
            </div>
          </div>
        </div>
      </div>

      {/* Customer panel */}
      {showCustomerPanel && <CustomerPanel conv={active} />}
    </div>
  )
}
