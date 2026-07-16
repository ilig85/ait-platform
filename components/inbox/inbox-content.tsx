"use client"

import { useMemo, useState } from "react"
import Link from "next/link"
import {
  AlertCircle,
  CheckCircle2,
  Clock,
  Info,
  MessageSquare,
  Search,
  Send,
  Users,
} from "lucide-react"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { ScrollArea } from "@/components/ui/scroll-area"
import { Textarea } from "@/components/ui/textarea"
import type { InboxConversation, InboxData, InboxMessage } from "@/lib/data/models"
import { useI18n } from "@/lib/i18n"
import { cn } from "@/lib/utils"

type Filter = "all" | "unread" | "needs_human" | "open" | "pending" | "resolved" | "archived"

const FILTERS: Filter[] = ["all", "unread", "needs_human", "open", "pending", "resolved", "archived"]

function statusFor(conversation: InboxConversation) {
  return conversation.needsHuman ? "needs_human" : conversation.status
}

const STATUS_CONFIG: Record<ReturnType<typeof statusFor>, { label: string; icon: React.ElementType; color: string; badge: string }> = {
  needs_human: { label: "Needs human", icon: AlertCircle, color: "text-destructive", badge: "bg-destructive/10 text-destructive border-destructive/20" },
  open: { label: "Open", icon: MessageSquare, color: "text-amber-600", badge: "bg-amber-50 text-amber-700 border-amber-200" },
  pending: { label: "Pending", icon: Clock, color: "text-blue-600", badge: "bg-blue-50 text-blue-700 border-blue-200" },
  resolved: { label: "Resolved", icon: CheckCircle2, color: "text-[#0F766E]", badge: "bg-[#0F766E]/10 text-[#0F766E] border-[#0F766E]/20" },
  archived: { label: "Archived", icon: MessageSquare, color: "text-muted-foreground", badge: "bg-muted text-muted-foreground border-border" },
}

function relativeTime(iso: string) {
  const diff = Math.max(0, Date.now() - new Date(iso).getTime())
  const minutes = Math.floor(diff / 60000)
  if (minutes < 60) return `${minutes}m`
  const hours = Math.floor(minutes / 60)
  if (hours < 24) return `${hours}h`
  return `${Math.floor(hours / 24)}d`
}

function ConvRow({ conversation, active, onClick }: { conversation: InboxConversation; active: boolean; onClick: () => void }) {
  const config = STATUS_CONFIG[statusFor(conversation)]
  const StatusIcon = config.icon
  return (
    <button
      onClick={onClick}
      className={cn(
        "w-full text-left px-3 py-3 flex items-start gap-3 border-b border-border/50 hover:bg-muted/40 transition-colors",
        active && "bg-accent/10 border-l-2 border-l-accent",
      )}
    >
      <div className="w-8 h-8 rounded-full bg-primary/15 text-primary text-xs font-bold flex items-center justify-center flex-shrink-0 mt-0.5">
        {conversation.contactName.slice(0, 2).toUpperCase()}
      </div>
      <div className="flex-1 min-w-0">
        <div className="flex items-center justify-between gap-1 mb-0.5">
          <span className="text-sm font-semibold truncate">{conversation.contactName}</span>
          <span className="text-[10px] text-muted-foreground flex-shrink-0">{relativeTime(conversation.lastMessageAt)}</span>
        </div>
        <p className="text-xs text-muted-foreground truncate">{conversation.lastMessage}</p>
        <div className="flex items-center gap-1.5 mt-1.5">
          <StatusIcon className={cn("w-3 h-3", config.color)} />
          <span className={cn("text-[10px] font-medium px-1.5 py-0.5 rounded-full border", config.badge)}>{config.label}</span>
          {conversation.unreadCount > 0 && (
            <span className="ml-auto text-[10px] bg-accent text-accent-foreground rounded-full px-1.5 py-0.5 font-semibold">
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
    <div className={cn("flex mb-2", inbound ? "justify-start" : "justify-end")}>
      {inbound && (
        <div className="w-6 h-6 rounded-full bg-primary/15 text-primary text-[9px] font-bold flex items-center justify-center mr-2 mt-auto flex-shrink-0">C</div>
      )}
      <div className={cn(
        "max-w-[75%] rounded-2xl px-3 py-2 text-sm leading-relaxed",
        inbound && "bg-muted text-foreground rounded-tl-sm",
        !inbound && message.senderType === "ai" && "bg-[#0F766E]/15 text-foreground rounded-tr-sm",
        !inbound && message.senderType !== "ai" && "bg-[#15253D] text-white rounded-tr-sm",
      )}>
        {!inbound && <p className="text-[10px] font-semibold opacity-70 mb-0.5">{messageLabel(message)}</p>}
        <p>{body}</p>
        <div className="flex items-center justify-end gap-1 mt-1">
          <span className="text-[10px] opacity-50">
            {new Date(message.timestamp).toISOString().slice(11, 16)} UTC
          </span>
          {!inbound && <span className="text-[9px] opacity-60 capitalize">{message.deliveryStatus}</span>}
        </div>
      </div>
    </div>
  )
}

function CustomerPanel({ conversation }: { conversation: InboxConversation }) {
  return (
    <div className="w-72 xl:w-80 flex-shrink-0 border-l border-border bg-card overflow-y-auto">
      <div className="p-4 border-b border-border">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-full bg-primary/15 text-primary text-sm font-bold flex items-center justify-center flex-shrink-0">
            {conversation.contactName.slice(0, 2).toUpperCase()}
          </div>
          <div className="min-w-0">
            <p className="font-semibold text-sm truncate">{conversation.contactName}</p>
            <p className="text-xs text-muted-foreground">{conversation.phoneNumber ?? "No phone number"}</p>
          </div>
        </div>
      </div>
      <div className="p-4 space-y-4 text-xs">
        <div>
          <p className="text-muted-foreground font-medium mb-1">Contact type</p>
          <p className="font-medium capitalize">{conversation.contactType}</p>
        </div>
        <div>
          <p className="text-muted-foreground font-medium mb-1">Conversation status</p>
          <p className="font-medium capitalize">{statusFor(conversation).replace("_", " ")}</p>
        </div>
        <div>
          <p className="text-muted-foreground font-medium mb-1">Messages</p>
          <p>{conversation.messages.length} stored</p>
        </div>
        <div>
          <p className="text-muted-foreground font-medium mb-1">AI analysis</p>
          <p>{conversation.aiAnalysisAllowed ? "Allowed" : "Not allowed"}</p>
        </div>
        <div>
          <p className="text-muted-foreground font-medium mb-1">Assignment</p>
          <p>{conversation.assignedUserId ? "Assigned to an organization member" : "Unassigned"}</p>
        </div>
      </div>
    </div>
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
  const validFilter = FILTERS.includes(initialFilter as Filter) ? initialFilter as Filter : "all"
  const [filter, setFilter] = useState<Filter>(validFilter)
  const [search, setSearch] = useState("")
  const [activeId, setActiveId] = useState<string>(
    data.conversations.some((conversation) => conversation.id === initialConversationId)
      ? initialConversationId!
      : data.conversations[0]?.id ?? "",
  )
  const [showCustomerPanel, setShowCustomerPanel] = useState(true)

  const filtered = useMemo(() => data.conversations.filter((conversation) => {
    const status = statusFor(conversation)
    const matchesFilter = filter === "all"
      || (filter === "unread" ? conversation.unreadCount > 0 : status === filter)
    const term = search.trim().toLowerCase()
    const matchesSearch = !term
      || conversation.contactName.toLowerCase().includes(term)
      || conversation.lastMessage.toLowerCase().includes(term)
      || conversation.phoneNumber?.toLowerCase().includes(term)
    return matchesFilter && matchesSearch
  }), [data.conversations, filter, search])

  const active = data.conversations.find((conversation) => conversation.id === activeId) ?? filtered[0] ?? null

  if (data.conversations.length === 0) {
    return (
      <div className="min-h-[calc(100vh-5rem)] rounded-xl border border-border bg-card flex items-center justify-center p-8">
        <div className="text-center max-w-md">
          <MessageSquare className="w-9 h-9 text-muted-foreground mx-auto mb-3" />
          <h1 className="text-lg font-semibold text-foreground">No conversations yet</h1>
          <p className="text-sm text-muted-foreground mt-1">
            {data.whatsappConnected
              ? "This organization has no stored conversations yet."
              : "WhatsApp is not connected. Conversations will appear here after a real channel connection receives messages."}
          </p>
          {!data.whatsappConnected && (
            <Button variant="outline" size="sm" className="mt-4" asChild>
              <Link href="/settings">View channel settings</Link>
            </Button>
          )}
        </div>
      </div>
    )
  }

  return (
    <div className="flex h-[calc(100vh-5rem)] rounded-xl border border-border bg-card overflow-hidden -mx-0">
      <div className="w-72 xl:w-80 flex-shrink-0 flex flex-col border-r border-border">
        <div className="p-3 border-b border-border space-y-2">
          <div className="relative">
            <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-muted-foreground" />
            <Input
              placeholder={t("inbox_search_conversations")}
              className="pl-8 h-8 text-xs"
              value={search}
              onChange={(event) => setSearch(event.target.value)}
            />
          </div>
          <div className="flex gap-1 overflow-x-auto pb-0.5 no-scrollbar">
            {FILTERS.map((item) => (
              <button
                key={item}
                onClick={() => setFilter(item)}
                className={cn(
                  "text-[10px] font-medium px-2.5 py-1 rounded-full whitespace-nowrap transition-colors flex-shrink-0 capitalize",
                  filter === item ? "bg-[#15253D] text-white" : "bg-muted text-muted-foreground hover:bg-muted/80",
                )}
              >
                {item.replace("_", " ")}
              </button>
            ))}
          </div>
        </div>
        <ScrollArea className="flex-1">
          {filtered.length === 0 ? (
            <div className="p-6 text-center text-xs text-muted-foreground">No conversations match this filter.</div>
          ) : filtered.map((conversation) => (
            <ConvRow key={conversation.id} conversation={conversation} active={conversation.id === active?.id} onClick={() => setActiveId(conversation.id)} />
          ))}
        </ScrollArea>
      </div>

      {active ? (
        <>
          <div className="flex-1 flex flex-col min-w-0">
            <div className="flex items-center justify-between gap-3 px-4 py-3 border-b border-border flex-shrink-0">
              <div className="flex items-center gap-3 min-w-0">
                <div className="w-8 h-8 rounded-full bg-primary/15 text-primary text-xs font-bold flex items-center justify-center flex-shrink-0">
                  {active.contactName.slice(0, 2).toUpperCase()}
                </div>
                <div className="min-w-0">
                  <p className="font-semibold text-sm truncate">{active.contactName}</p>
                  <p className="text-[10px] text-muted-foreground capitalize">{statusFor(active).replace("_", " ")}</p>
                </div>
              </div>
              <Button size="sm" variant="ghost" className="h-7 w-7 p-0" onClick={() => setShowCustomerPanel((value) => !value)}>
                <Users className="w-4 h-4" />
              </Button>
            </div>

            <ScrollArea className="flex-1 px-4 py-3">
              {active.messages.length === 0 ? (
                <div className="h-full min-h-40 flex items-center justify-center text-xs text-muted-foreground">No stored messages in this conversation.</div>
              ) : (
                <div className="space-y-1">
                  {active.messages.map((message) => <MessageBubble key={message.id} message={message} />)}
                </div>
              )}
            </ScrollArea>

            {!data.whatsappConnected && (
              <div className="px-4 pb-2">
                <Alert className="border-amber-200 bg-amber-50 py-2">
                  <AlertCircle className="h-3.5 w-3.5 text-amber-600" />
                  <AlertDescription className="text-xs text-amber-800 ml-1">
                    WhatsApp is not connected. <Link href="/settings" className="underline font-medium">View Settings</Link>
                  </AlertDescription>
                </Alert>
              </div>
            )}

            <div className="border-t border-border p-3 flex-shrink-0">
              <div className="flex items-center gap-1.5 text-xs text-muted-foreground mb-2">
                <Info className="w-3.5 h-3.5" />Sending is not enabled in this integration phase.
              </div>
              <div className="relative">
                <Textarea placeholder="Message sending will be enabled with the provider integration." className="min-h-[72px] resize-none text-sm pr-14" disabled />
                <Button size="sm" className="absolute bottom-2 right-2 h-7 w-7 p-0" disabled>
                  <Send className="w-3.5 h-3.5" />
                </Button>
              </div>
            </div>
          </div>
          {showCustomerPanel && <CustomerPanel conversation={active} />}
        </>
      ) : (
        <div className="flex-1 flex items-center justify-center text-sm text-muted-foreground">Select a conversation.</div>
      )}
    </div>
  )
}
