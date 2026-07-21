"use client"

import { useEffect, useMemo, useRef, useState } from "react"
import Link from "next/link"
import { useRouter } from "next/navigation"
import {
  AlertCircle,
  CheckCircle2,
  ChevronDown,
  ChevronUp,
  Clock,
  FileText,
  GripHorizontal,
  Info,
  Loader2,
  MessageSquare,
  Search,
  Send,
  Sparkles,
  Users,
} from "lucide-react"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { ScrollArea } from "@/components/ui/scroll-area"
import { Textarea } from "@/components/ui/textarea"
import type { InboxConversation, InboxData, InboxMessage } from "@/lib/data/models"
import { AitHeader } from "@/components/ait/header"
import { useI18n } from "@/lib/i18n"
import { createClient as createBrowserClient } from "@/lib/supabase/client"
import { cn } from "@/lib/utils"

type Filter = "all" | "unread" | "needs_human" | "open" | "pending" | "resolved" | "archived"

const FILTERS: Filter[] = ["all", "unread", "needs_human", "open", "pending", "resolved", "archived"]

function statusFor(conversation: InboxConversation) {
  return conversation.needsHuman ? "needs_human" : conversation.status
}

const STATUS_CONFIG: Record<
  ReturnType<typeof statusFor>,
  { label: string; icon: React.ElementType; dotColor: string; badgeClass: string }
> = {
  needs_human: {
    label: "Needs human",
    icon: AlertCircle,
    dotColor: "#FF6B6B",
    badgeClass: "bg-[#FF6B6B]/10 text-[#FF6B6B] border-[#FF6B6B]/20",
  },
  open: {
    label: "Open",
    icon: MessageSquare,
    dotColor: "#67D9FF",
    badgeClass: "bg-[#67D9FF]/10 text-[#67D9FF] border-[#67D9FF]/20",
  },
  pending: {
    label: "Pending",
    icon: Clock,
    dotColor: "#FFA94D",
    badgeClass: "bg-amber-400/10 text-amber-400 border-amber-400/20",
  },
  resolved: {
    label: "Resolved",
    icon: CheckCircle2,
    dotColor: "#2DE2B1",
    badgeClass: "bg-[#2DE2B1]/10 text-[#2DE2B1] border-[#2DE2B1]/20",
  },
  archived: {
    label: "Archived",
    icon: MessageSquare,
    dotColor: "var(--muted-foreground)",
    badgeClass: "bg-muted text-muted-foreground border-border",
  },
}

function relativeTime(iso: string) {
  const diff = Math.max(0, Date.now() - new Date(iso).getTime())
  const minutes = Math.floor(diff / 60000)
  if (minutes < 60) return `${minutes}m`
  const hours = Math.floor(minutes / 60)
  if (hours < 24) return `${hours}h`
  return `${Math.floor(hours / 24)}d`
}

function outboundErrorMessage(
  responseStatus: number,
  payload: { status?: string; message?: string } | null,
) {
  if (payload?.message) return payload.message
  switch (payload?.status) {
    case "unauthenticated":
      return "Your session has expired. Sign in again before sending."
    case "forbidden":
      return "Only organization owners and managers can send replies."
    case "not_found":
      return "This conversation is no longer available."
    case "approved_template_required":
      return "The 24-hour reply window is closed. An approved template is required."
    case "channel_unavailable":
      return "The WhatsApp channel is unavailable. Check Settings and try again."
    case "provider_error":
      return "WhatsApp rejected the message. Check the provider configuration and try again."
    case "invalid_message":
      return "Enter a valid message before sending."
    default:
      return responseStatus >= 500
        ? "AIT could not send the message. Try again in a moment."
        : "The message could not be sent."
  }
}

function ConvRow({
  conversation,
  active,
  onClick,
}: {
  conversation: InboxConversation
  active: boolean
  onClick: () => void
}) {
  const config = STATUS_CONFIG[statusFor(conversation)]
  return (
    <button
      onClick={onClick}
      className={cn(
        "w-full text-left px-3 py-3 flex items-start gap-3 border-b border-border/40 transition-all duration-150",
        active
          ? "bg-[#2DE2B1]/6 border-l-2 border-l-[#2DE2B1]"
          : "hover:bg-muted/30",
      )}
    >
      <div className="w-8 h-8 rounded-full bg-[#2DE2B1]/15 text-[#102223] text-[10px] font-bold flex items-center justify-center flex-shrink-0 mt-0.5">
        {conversation.contactName.slice(0, 2).toUpperCase()}
      </div>
      <div className="flex-1 min-w-0">
        <div className="flex items-center justify-between gap-1 mb-0.5">
          <span className="text-sm font-medium text-foreground truncate">{conversation.contactName}</span>
          <span className="text-[10px] text-muted-foreground flex-shrink-0">{relativeTime(conversation.lastMessageAt)}</span>
        </div>
        <p className="text-xs text-muted-foreground truncate leading-snug">{conversation.lastMessage}</p>
        <div className="flex items-center gap-1.5 mt-1.5">
          <span
            className="w-1.5 h-1.5 rounded-full flex-shrink-0"
            style={{ backgroundColor: config.dotColor }}
          />
          <span className={cn("text-[10px] font-medium px-1.5 py-0.5 rounded-full border", config.badgeClass)}>
            {config.label}
          </span>
          {conversation.unreadCount > 0 && (
            <span className="ml-auto text-[10px] bg-[#2DE2B1] text-[#071A1B] rounded-full px-1.5 py-0.5 font-semibold">
              {conversation.unreadCount}
            </span>
          )}
        </div>
      </div>
    </button>
  )
}

function messageLabel(message: InboxMessage) {
  if (message.direction === "inbound") return "Customer"
  if (message.senderType === "ai") return "AI"
  if (message.senderType === "manager") return "Manager"
  if (message.senderType === "system") return "System"
  return "Outbound"
}

function MessageBubble({ message }: { message: InboxMessage }) {
  const inbound = message.direction === "inbound"
  const body = message.textBody ?? `[${message.messageType}]`
  return (
    <div className={cn("flex mb-3", inbound ? "justify-start" : "justify-end")}>
      {inbound && (
        <div className="w-6 h-6 rounded-full bg-[#2DE2B1]/15 text-[#102223] text-[9px] font-bold flex items-center justify-center mr-2 mt-auto flex-shrink-0">
          C
        </div>
      )}
      <div
        className={cn(
          "max-w-[72%] rounded-2xl px-3.5 py-2.5 text-sm leading-relaxed",
          inbound && "bg-muted/60 text-foreground rounded-tl-sm",
          !inbound && message.senderType === "ai" && "bg-[#2DE2B1]/12 text-foreground rounded-tr-sm",
          !inbound && message.senderType !== "ai" && "bg-[#102223] text-sidebar-foreground rounded-tr-sm",
        )}
      >
        {!inbound && (
          <p className="text-[10px] font-semibold opacity-60 mb-0.5">{messageLabel(message)}</p>
        )}
        <p>{body}</p>
        <div className="flex items-center justify-end gap-1.5 mt-1">
          <span className="text-[10px] opacity-40">
            {new Date(message.timestamp).toISOString().slice(11, 16)} UTC
          </span>
          {!inbound && (
            <span className="text-[9px] opacity-50 capitalize">{message.deliveryStatus}</span>
          )}
        </div>
      </div>
    </div>
  )
}

function CustomerPanel({
  conversation,
  isUpdatingAiConsent,
  onChangeAiConsent,
}: {
  conversation: InboxConversation
  isUpdatingAiConsent: boolean
  onChangeAiConsent: (allowed: boolean) => void
}) {
  return (
    <aside className="w-64 xl:w-72 flex-shrink-0 border-l border-border/60 bg-sidebar overflow-y-auto">
      <div className="p-4 border-b border-border/60">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-full bg-[#2DE2B1]/15 text-[#102223] text-sm font-bold flex items-center justify-center flex-shrink-0">
            {conversation.contactName.slice(0, 2).toUpperCase()}
          </div>
          <div className="min-w-0">
            <p className="font-semibold text-sm text-sidebar-foreground truncate">{conversation.contactName}</p>
            <p className="text-xs text-sidebar-foreground/50 truncate">{conversation.phoneNumber ?? "No phone number"}</p>
          </div>
        </div>
      </div>
      <div className="p-4 space-y-4 text-xs">
        {[
          ["Contact type", conversation.contactType],
          ["Status", statusFor(conversation).replace("_", " ")],
          ["Messages", `${conversation.messages.length} stored`],
          ["AI analysis", conversation.aiAnalysisAllowed ? "Allowed" : "Not allowed"],
          ["Assignment", conversation.assignedUserId ? "Assigned to a member" : "Unassigned"],
        ].map(([label, value]) => (
          <div key={label}>
            <p className="text-sidebar-foreground/40 font-medium mb-0.5">{label}</p>
            <p className="text-sidebar-foreground font-medium capitalize">{value}</p>
          </div>
        ))}
      </div>
      <div className="p-4 border-t border-border/60">
        <Button
          type="button"
          size="sm"
          variant="outline"
          className="w-full text-xs"
          disabled={isUpdatingAiConsent}
          onClick={() => onChangeAiConsent(!conversation.aiAnalysisAllowed)}
        >
          {isUpdatingAiConsent && <Loader2 className="w-3.5 h-3.5 mr-1.5 animate-spin" />}
          {conversation.aiAnalysisAllowed ? "Disable AI analysis" : "Record consent & enable AI"}
        </Button>
        <p className="mt-2 text-[10px] leading-relaxed text-sidebar-foreground/40">
          Enable AI only after the customer has agreed to conversation analysis.
        </p>
      </div>
    </aside>
  )
}

export function InboxContent({
  data,
  initialConversationId,
  initialFilter,
}: {
  data: InboxData
  initialConversationId?: string
  initialFilter?: string
}) {
  const { t } = useI18n()
  const router = useRouter()
  const validFilter = FILTERS.includes(initialFilter as Filter) ? (initialFilter as Filter) : "all"
  const [filter, setFilter] = useState<Filter>(validFilter)
  const [search, setSearch] = useState("")
  const [activeId, setActiveId] = useState<string>(
    data.conversations.some((c) => c.id === initialConversationId)
      ? initialConversationId!
      : data.conversations[0]?.id ?? "",
  )
  const [showCustomerPanel, setShowCustomerPanel] = useState(true)
  const [draft, setDraft] = useState("")
  const [isSending, setIsSending] = useState(false)
  const [sendError, setSendError] = useState<string | null>(null)
  const [aiAction, setAiAction] = useState<"summary" | "draft" | null>(null)
  const [aiSummary, setAiSummary] = useState<string | null>(null)
  const [summaryCollapsed, setSummaryCollapsed] = useState(false)
  const [aiError, setAiError] = useState<string | null>(null)
  const [isUpdatingAiConsent, setIsUpdatingAiConsent] = useState(false)
  const messageViewportRef = useRef<HTMLDivElement>(null)
  const refreshTimerRef = useRef<number | null>(null)

  useEffect(() => {
    const supabase = createBrowserClient()

    const refreshInbox = () => {
      if (document.visibilityState !== "visible") return
      if (refreshTimerRef.current !== null) {
        window.clearTimeout(refreshTimerRef.current)
      }
      refreshTimerRef.current = window.setTimeout(() => {
        refreshTimerRef.current = null
        router.refresh()
      }, 250)
    }

    const organizationFilter = `organization_id=eq.${data.organizationId}`
    const channel = supabase
      .channel(`inbox:${data.organizationId}`)
      .on(
        "postgres_changes",
        {
          event: "*",
          schema: "public",
          table: "messages",
          filter: organizationFilter,
        },
        refreshInbox,
      )
      .on(
        "postgres_changes",
        {
          event: "*",
          schema: "public",
          table: "conversations",
          filter: organizationFilter,
        },
        refreshInbox,
      )
      .subscribe()

    const refreshWhenVisible = () => {
      if (document.visibilityState === "visible") refreshInbox()
    }
    document.addEventListener("visibilitychange", refreshWhenVisible)

    return () => {
      document.removeEventListener("visibilitychange", refreshWhenVisible)
      if (refreshTimerRef.current !== null) {
        window.clearTimeout(refreshTimerRef.current)
        refreshTimerRef.current = null
      }
      void supabase.removeChannel(channel)
    }
  }, [data.organizationId, router])

  function selectConversation(conversationId: string) {
    setActiveId(conversationId)
    setDraft("")
    setSendError(null)
    setAiSummary(null)
    setSummaryCollapsed(false)
    setAiError(null)
  }

  async function updateAiConsent(allowed: boolean) {
    if (!activeId || isUpdatingAiConsent) return

    setIsUpdatingAiConsent(true)
    setAiError(null)

    try {
      const response = await fetch(
        `/api/conversations/${encodeURIComponent(activeId)}/ai-consent`,
        {
          method: "PATCH",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ allowed }),
        },
      )
      const payload = await response.json().catch(() => null) as {
        message?: string
      } | null

      if (!response.ok) {
        setAiError(payload?.message ?? "AIT could not update the AI consent setting.")
        return
      }

      if (!allowed) setAiSummary(null)
      router.refresh()
    } catch {
      setAiError("AIT could not reach the server. Check your connection and try again.")
    } finally {
      setIsUpdatingAiConsent(false)
    }
  }

  async function requestAi(action: "summary" | "draft") {
    if (!activeId || aiAction) return

    setAiAction(action)
    setAiError(null)

    try {
      const response = await fetch(
        `/api/conversations/${encodeURIComponent(activeId)}/ai`,
        {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ action }),
        },
      )
      const payload = await response.json().catch(() => null) as {
        text?: string
        message?: string
      } | null

      if (!response.ok || !payload?.text) {
        setAiError(payload?.message ?? "AIT could not complete the AI request.")
        return
      }

      if (action === "summary") {
        setAiSummary(payload.text)
        setSummaryCollapsed(false)
      } else {
        setDraft(payload.text)
      }
    } catch {
      setAiError("AIT could not reach the server. Check your connection and try again.")
    } finally {
      setAiAction(null)
    }
  }

  async function sendMessage() {
    const text = draft.trim()
    if (!activeId || !text || isSending || !data.whatsappConnected) return

    setIsSending(true)
    setSendError(null)

    try {
      const response = await fetch(
        `/api/conversations/${encodeURIComponent(activeId)}/messages`,
        {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ text }),
        },
      )
      const payload = await response.json().catch(() => null) as {
        status?: string
        message?: string
      } | null

      if (!response.ok) {
        setSendError(outboundErrorMessage(response.status, payload))
        return
      }

      setDraft("")
      router.refresh()
    } catch {
      setSendError("AIT could not reach the server. Check your connection and try again.")
    } finally {
      setIsSending(false)
    }
  }

  const filtered = useMemo(
    () =>
      data.conversations.filter((conversation) => {
        const status = statusFor(conversation)
        const matchesFilter =
          filter === "all" ||
          (filter === "unread" ? conversation.unreadCount > 0 : status === filter)
        const term = search.trim().toLowerCase()
        const matchesSearch =
          !term ||
          conversation.contactName.toLowerCase().includes(term) ||
          conversation.lastMessage.toLowerCase().includes(term) ||
          conversation.phoneNumber?.toLowerCase().includes(term)
        return matchesFilter && matchesSearch
      }),
    [data.conversations, filter, search],
  )

  const active = data.conversations.find((c) => c.id === activeId) ?? filtered[0] ?? null

  useEffect(() => {
    const frame = window.requestAnimationFrame(() => {
      const viewport = messageViewportRef.current
      if (viewport) viewport.scrollTop = viewport.scrollHeight
    })

    return () => window.cancelAnimationFrame(frame)
  }, [active?.id, active?.messages.length])

  if (data.conversations.length === 0) {
    return (
      <>
        <AitHeader title="Inbox" subtitle="Organization-scoped conversations and messages." />
        <div className="flex flex-col items-center justify-center min-h-[60vh] text-center p-8 rounded-xl border border-border/60 bg-card">
          <div className="w-12 h-12 rounded-full bg-[#2DE2B1]/10 flex items-center justify-center mb-4">
            <MessageSquare className="w-6 h-6 text-[#2DE2B1]" />
          </div>
          <h2 className="text-base font-semibold text-foreground">No conversations yet</h2>
          <p className="text-sm text-muted-foreground mt-1.5 max-w-sm leading-relaxed">
            {data.whatsappConnected
              ? "This organization has no stored conversations yet."
              : "WhatsApp is not connected. Conversations will appear here after a real channel connection receives messages."}
          </p>
          {!data.whatsappConnected && (
            <Button variant="outline" size="sm" className="mt-5" asChild>
              <Link href="/settings">View channel settings</Link>
            </Button>
          )}
        </div>
      </>
    )
  }

  return (
    <>
      <AitHeader title="Inbox" subtitle="Organization-scoped conversations and messages." />
      <div className="flex min-h-0 rounded-xl border border-border/60 bg-card overflow-hidden" style={{ height: "calc(100vh - 10rem)" }}>
        {/* Conversation list */}
        <div className="w-72 xl:w-80 min-h-0 flex-shrink-0 flex flex-col border-r border-border/60">
          <div className="p-3 border-b border-border/60 space-y-2">
            <div className="relative">
              <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-muted-foreground" />
              <Input
                placeholder={t("inbox_search_conversations")}
                className="pl-8 h-8 text-xs bg-background"
                value={search}
                onChange={(e) => setSearch(e.target.value)}
              />
            </div>
            <div className="flex gap-1 overflow-x-auto pb-0.5 no-scrollbar">
              {FILTERS.map((item) => (
                <button
                  key={item}
                  onClick={() => setFilter(item)}
                  className={cn(
                    "text-[10px] font-medium px-2.5 py-1 rounded-full whitespace-nowrap transition-colors flex-shrink-0 capitalize",
                    filter === item
                      ? "bg-[#2DE2B1] text-[#071A1B]"
                      : "bg-muted/60 text-muted-foreground hover:bg-muted",
                  )}
                >
                  {item.replace("_", " ")}
                </button>
              ))}
            </div>
          </div>
          <ScrollArea className="min-h-0 flex-1">
            {filtered.length === 0 ? (
              <div className="p-6 text-center text-xs text-muted-foreground">
                No conversations match this filter.
              </div>
            ) : (
              filtered.map((conversation) => (
                <ConvRow
                  key={conversation.id}
                  conversation={conversation}
                  active={conversation.id === active?.id}
                  onClick={() => selectConversation(conversation.id)}
                />
              ))
            )}
          </ScrollArea>
        </div>

        {/* Thread + customer panel */}
        {active ? (
          <>
            <div className="flex-1 min-h-0 flex flex-col min-w-0">
              {/* Thread header */}
              <div className="px-4 py-3 border-b border-border/60 flex-shrink-0 space-y-2">
                <div className="flex items-center justify-between gap-3 min-w-0">
                  <div className="flex items-center gap-3 min-w-0">
                  <div className="w-8 h-8 rounded-full bg-[#2DE2B1]/15 text-[#102223] text-[10px] font-bold flex items-center justify-center flex-shrink-0">
                    {active.contactName.slice(0, 2).toUpperCase()}
                  </div>
                  <div className="min-w-0">
                    <p className="font-semibold text-sm text-foreground truncate">{active.contactName}</p>
                    <div className="flex items-center gap-1.5">
                      <span
                        className="w-1.5 h-1.5 rounded-full"
                        style={{ backgroundColor: STATUS_CONFIG[statusFor(active)].dotColor }}
                      />
                      <p className="text-[10px] text-muted-foreground capitalize">
                        {statusFor(active).replace("_", " ")}
                      </p>
                      <span className="text-[10px] text-muted-foreground/50">·</span>
                      <p className="text-[10px] text-muted-foreground">
                        {active.messages.length} stored messages
                      </p>
                    </div>
                  </div>
                  </div>
                  <Button
                    size="sm"
                    variant="ghost"
                    className="h-7 w-7 p-0 flex-shrink-0 text-muted-foreground hover:text-foreground"
                    onClick={() => setShowCustomerPanel((v) => !v)}
                    aria-label="Toggle contact panel"
                  >
                    <Users className="w-4 h-4" />
                  </Button>
                </div>
                <div className="flex flex-wrap items-center gap-1.5">
                  <Button
                    type="button"
                    size="sm"
                    variant="outline"
                    className="h-8 px-2.5 text-xs"
                    disabled={
                      !active.aiAnalysisAllowed
                      || active.messages.length === 0
                      || aiAction !== null
                    }
                    onClick={() => void requestAi("summary")}
                  >
                    {aiAction === "summary"
                      ? <Loader2 className="w-3.5 h-3.5 mr-1.5 animate-spin" />
                      : <FileText className="w-3.5 h-3.5 mr-1.5" />}
                    Summarize
                  </Button>
                  <Button
                    type="button"
                    size="sm"
                    className="h-8 px-2.5 text-xs bg-[#2DE2B1] text-[#071A1B] hover:bg-[#2DE2B1]/90"
                    disabled={
                      !active.aiAnalysisAllowed
                      || active.messages.length === 0
                      || aiAction !== null
                    }
                    onClick={() => void requestAi("draft")}
                  >
                    {aiAction === "draft"
                      ? <Loader2 className="w-3.5 h-3.5 mr-1.5 animate-spin" />
                      : <Sparkles className="w-3.5 h-3.5 mr-1.5" />}
                    Draft reply
                  </Button>
                </div>
              </div>

              {aiSummary && (
                <div
                  className={cn(
                    "mx-4 mt-3 rounded-lg border border-[#2DE2B1]/25 bg-[#2DE2B1]/7 flex-shrink-0",
                    !summaryCollapsed && "resize-y overflow-auto",
                  )}
                  style={summaryCollapsed ? undefined : {
                    height: "10rem",
                    minHeight: "7rem",
                    maxHeight: "45vh",
                  }}
                >
                  <div className="sticky top-0 flex items-center justify-between gap-2 px-3 py-2 bg-[#eafaf5] dark:bg-[#12302d] border-b border-[#2DE2B1]/15">
                    <div className="flex items-center gap-1.5 min-w-0">
                      <Sparkles className="w-3.5 h-3.5 text-[#2DE2B1] flex-shrink-0" />
                      <p className="text-xs font-semibold text-foreground truncate">AI conversation summary</p>
                    </div>
                    <Button
                      type="button"
                      size="sm"
                      variant="ghost"
                      className="h-6 w-6 p-0 flex-shrink-0"
                      onClick={() => setSummaryCollapsed((value) => !value)}
                      aria-label={summaryCollapsed ? "Expand summary" : "Collapse summary"}
                    >
                      {summaryCollapsed
                        ? <ChevronDown className="w-3.5 h-3.5" />
                        : <ChevronUp className="w-3.5 h-3.5" />}
                    </Button>
                  </div>
                  {!summaryCollapsed && (
                    <>
                      <p className="px-3 py-2 text-xs leading-relaxed text-muted-foreground whitespace-pre-wrap">
                        {aiSummary}
                      </p>
                      <div className="sticky bottom-0 flex items-center justify-center h-4 bg-gradient-to-t from-background/80 to-transparent pointer-events-none">
                        <GripHorizontal className="w-4 h-4 text-muted-foreground/45" />
                      </div>
                    </>
                  )}
                </div>
              )}

              {/* Messages */}
              <div
                ref={messageViewportRef}
                className="min-h-0 flex-1 overflow-y-auto overscroll-contain px-4 py-4"
                aria-label="Stored conversation history"
              >
                {active.messages.length === 0 ? (
                  <div className="h-full min-h-32 flex items-center justify-center text-xs text-muted-foreground">
                    No stored messages in this conversation.
                  </div>
                ) : (
                  <div>
                    {active.messages.map((message) => (
                      <MessageBubble key={message.id} message={message} />
                    ))}
                  </div>
                )}
              </div>

              {aiError && (
                <div className="px-4 pb-2">
                  <Alert className="border-destructive/30 bg-destructive/5 py-2">
                    <AlertCircle className="h-3.5 w-3.5 text-destructive" />
                    <AlertDescription className="ml-1 text-xs text-destructive">
                      {aiError}
                    </AlertDescription>
                  </Alert>
                </div>
              )}

              {!active.aiAnalysisAllowed && (
                <div className="px-4 pb-2">
                  <Alert className="border-[#2DE2B1]/25 bg-[#2DE2B1]/5 py-2">
                    <Sparkles className="h-3.5 w-3.5 text-[#2DE2B1]" />
                    <AlertDescription className="ml-1 text-xs text-muted-foreground flex items-center justify-between gap-3">
                      <span>
                        AI is off for this contact. Enable it only after the customer agrees to analysis.
                      </span>
                      <Button
                        type="button"
                        size="sm"
                        variant="outline"
                        className="h-7 whitespace-nowrap text-xs"
                        disabled={isUpdatingAiConsent}
                        onClick={() => void updateAiConsent(true)}
                      >
                        {isUpdatingAiConsent && <Loader2 className="w-3.5 h-3.5 mr-1.5 animate-spin" />}
                        Record consent
                      </Button>
                    </AlertDescription>
                  </Alert>
                </div>
              )}

              {/* Channel warning */}
              {!data.whatsappConnected && (
                <div className="px-4 pb-2">
                  <Alert className="border-amber-400/30 bg-amber-400/8 py-2">
                    <AlertCircle className="h-3.5 w-3.5 text-amber-400" />
                    <AlertDescription className="text-xs text-amber-300 ml-1">
                      WhatsApp is not connected.{" "}
                      <Link href="/settings" className="underline font-medium">
                        View Settings
                      </Link>
                    </AlertDescription>
                  </Alert>
                </div>
              )}

              {/* Compose area */}
              <form
                className="border-t border-border/60 p-3 flex-shrink-0"
                onSubmit={(event) => {
                  event.preventDefault()
                  void sendMessage()
                }}
              >
                <div className="flex items-center gap-1.5 text-xs text-muted-foreground mb-2">
                  <Info className="w-3.5 h-3.5 flex-shrink-0" />
                  Replies are available during the 24-hour WhatsApp customer-service window.
                </div>
                {sendError && (
                  <Alert className="mb-2 border-destructive/30 bg-destructive/5 py-2">
                    <AlertCircle className="h-3.5 w-3.5 text-destructive" />
                    <AlertDescription className="ml-1 text-xs text-destructive">
                      {sendError}
                    </AlertDescription>
                  </Alert>
                )}
                <div className="relative">
                  <Textarea
                    aria-label="Message reply"
                    placeholder={
                      data.whatsappConnected
                        ? "Write a reply…"
                        : "Connect WhatsApp before sending a reply."
                    }
                    className="min-h-[64px] resize-none text-sm pr-12"
                    value={draft}
                    maxLength={4096}
                    disabled={!data.whatsappConnected || isSending}
                    onChange={(event) => {
                      setDraft(event.target.value)
                      if (sendError) setSendError(null)
                    }}
                    onKeyDown={(event) => {
                      if (event.key === "Enter" && !event.shiftKey) {
                        event.preventDefault()
                        void sendMessage()
                      }
                    }}
                  />
                  <Button
                    type="submit"
                    size="sm"
                    className="absolute bottom-2 right-2 h-7 w-7 p-0"
                    disabled={
                      !data.whatsappConnected
                      || isSending
                      || draft.trim().length === 0
                    }
                    aria-label={isSending ? "Sending reply" : "Send reply"}
                  >
                    {isSending
                      ? <Loader2 className="w-3.5 h-3.5 animate-spin" />
                      : <Send className="w-3.5 h-3.5" />}
                  </Button>
                </div>
              </form>
            </div>

            {/* Customer side panel */}
            {showCustomerPanel && (
              <CustomerPanel
                conversation={active}
                isUpdatingAiConsent={isUpdatingAiConsent}
                onChangeAiConsent={(allowed) => void updateAiConsent(allowed)}
              />
            )}
          </>
        ) : (
          <div className="flex-1 flex items-center justify-center text-sm text-muted-foreground">
            Select a conversation.
          </div>
        )}
      </div>
    </>
  )
}
