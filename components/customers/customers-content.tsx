"use client"

import { useMemo, useState } from "react"
import Link from "next/link"
import { Clock, MessageCircle, Phone, Search, ShieldCheck, Tag } from "lucide-react"
import { AitHeader } from "@/components/ait/header"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import type { CustomerRecord, CustomersData } from "@/lib/data/models"
import { useI18n } from "@/lib/i18n"
import { cn } from "@/lib/utils"

type DisplayStatus = "needs_human" | "open" | "pending" | "resolved" | "archived" | "none"

const STATUS_DOT: Record<DisplayStatus, string> = {
  needs_human: "bg-destructive",
  open: "bg-sky-500",
  pending: "bg-amber-400",
  resolved: "bg-primary",
  archived: "bg-muted-foreground/40",
  none: "bg-muted-foreground/20",
}

const STATUS_BADGE: Record<DisplayStatus, string> = {
  needs_human: "bg-destructive/10 text-destructive border-destructive/20",
  open: "bg-sky-500/10 text-sky-600 dark:text-sky-400 border-sky-500/20",
  pending: "bg-amber-400/10 text-amber-400 border-amber-400/20",
  resolved: "bg-primary/10 text-primary border-primary/20",
  archived: "bg-muted text-muted-foreground border-border",
  none: "bg-muted text-muted-foreground border-border",
}

function displayStatus(customer: CustomerRecord): DisplayStatus {
  const latest = customer.conversations[0]
  if (!latest) return "none"
  return latest.needsHuman ? "needs_human" : latest.status
}

function formatTimestamp(iso: string) {
  return `${new Date(iso).toISOString().slice(0, 16).replace("T", " ")} UTC`
}

export function CustomersContent({ data }: { data: CustomersData }) {
  const { t } = useI18n()
  const [selectedId, setSelectedId] = useState<string | null>(data.customers[0]?.id ?? null)
  const [search, setSearch] = useState("")

  const filtered = useMemo(() => {
    const term = search.trim().toLowerCase()
    if (!term) return data.customers
    return data.customers.filter(
      (customer) =>
        customer.displayName.toLowerCase().includes(term) ||
        customer.phoneNumber?.toLowerCase().includes(term) ||
        customer.externalContactId?.toLowerCase().includes(term),
    )
  }, [data.customers, search])

  const selected = data.customers.find((c) => c.id === selectedId) ?? filtered[0] ?? null

  return (
    <>
      <AitHeader title={t("customers_title")} subtitle="Real contacts and their stored conversation history." />

      {data.customers.length === 0 ? (
        <div className="min-h-[360px] rounded-xl border border-dashed border-border/60 bg-card flex flex-col items-center justify-center text-center p-8">
          <div className="w-12 h-12 rounded-full bg-primary/10 flex items-center justify-center mb-4">
            <MessageCircle className="w-6 h-6 text-primary" />
          </div>
          <h2 className="text-sm font-semibold text-foreground">No contacts yet</h2>
          <p className="text-sm text-muted-foreground mt-1.5 max-w-md leading-relaxed">
            Contacts will appear here after a real channel is connected and customer conversations are received.
          </p>
        </div>
      ) : (
        <div className="flex gap-4 h-[calc(100vh-10rem)]">
          {/* Customer list */}
          <div className="w-72 xl:w-80 flex-shrink-0 flex flex-col gap-2">
            <div className="relative">
              <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-muted-foreground" />
              <input
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                placeholder={t("customers_search")}
                className="w-full pl-8 pr-4 py-2 text-sm bg-card border border-border/60 rounded-lg text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-primary/30"
              />
            </div>
            <div className="flex flex-col gap-1 overflow-y-auto flex-1 pr-0.5">
              {filtered.length === 0 ? (
                <p className="text-xs text-muted-foreground text-center py-8">No contacts match your search.</p>
              ) : (
                filtered.map((customer) => {
                  const status = displayStatus(customer)
                  return (
                    <button
                      key={customer.id}
                      onClick={() => setSelectedId(customer.id)}
                      className={cn(
                        "flex items-center gap-3 px-3 py-2.5 rounded-xl text-left transition-all border",
                        selected?.id === customer.id
                          ? "bg-primary/8 border-primary/30"
                          : "bg-card border-border/60 hover:bg-muted/30",
                      )}
                    >
                      <div className="w-8 h-8 rounded-full bg-primary/15 flex items-center justify-center text-sm font-bold text-primary-foreground flex-shrink-0">
                        {customer.displayName.charAt(0).toUpperCase()}
                      </div>
                      <div className="flex-1 min-w-0">
                        <span className="text-sm font-medium text-foreground truncate block">
                          {customer.displayName}
                        </span>
                        <div className="flex items-center gap-1.5 mt-0.5">
                          <span className={cn("w-1.5 h-1.5 rounded-full flex-shrink-0", STATUS_DOT[status])} />
                          <span className="text-[10px] text-muted-foreground capitalize">
                            {status === "none" ? "No conversation" : status.replace("_", " ")}
                          </span>
                        </div>
                      </div>
                    </button>
                  )
                })
              )}
            </div>
          </div>

          {/* Contact detail */}
          {selected ? (
            <div className="flex-1 bg-card border border-border/60 rounded-xl overflow-y-auto">
              <div className="p-5 border-b border-border/60">
                <div className="flex items-start gap-4">
                  <div className="w-14 h-14 rounded-full bg-primary/15 flex items-center justify-center text-xl font-bold text-primary-foreground flex-shrink-0">
                    {selected.displayName.charAt(0).toUpperCase()}
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 flex-wrap">
                      <h2 className="text-lg font-semibold text-foreground">{selected.displayName}</h2>
                      <Badge variant="outline" className="capitalize text-xs border-border/60">
                        {selected.contactType}
                      </Badge>
                    </div>
                    <div className="flex flex-wrap gap-3 mt-1">
                      <span className="flex items-center gap-1.5 text-xs text-muted-foreground">
                        <Phone className="w-3.5 h-3.5" />
                        {selected.phoneNumber ?? "No phone number"}
                      </span>
                      <span className="flex items-center gap-1.5 text-xs text-muted-foreground">
                        <Clock className="w-3.5 h-3.5" />
                        Last activity: {formatTimestamp(selected.lastContactAt)}
                      </span>
                    </div>
                    {selected.externalContactId && (
                      <p className="text-[10px] text-muted-foreground mt-2 font-mono truncate">
                        External contact: {selected.externalContactId}
                      </p>
                    )}
                  </div>
                </div>
              </div>

              <div className="grid grid-cols-3 divide-x divide-border/60 border-b border-border/60">
                {[
                  { label: "Conversations", value: selected.conversations.length },
                  { label: "Inbound messages", value: selected.inboundMessageCount },
                  { label: "Outbound messages", value: selected.outboundMessageCount },
                ].map((stat) => (
                  <div key={stat.label} className="px-5 py-4 text-center">
                    <p className="text-2xl font-semibold text-foreground tabular-nums">{stat.value}</p>
                    <p className="text-xs text-muted-foreground mt-0.5">{stat.label}</p>
                  </div>
                ))}
              </div>

              <div className="px-5 py-4 border-b border-border/60">
                <div className="flex items-center gap-2">
                  <ShieldCheck className="w-4 h-4 text-primary" />
                  <div>
                    <p className="text-xs font-semibold text-foreground">AI analysis consent</p>
                    <p className="text-xs text-muted-foreground">
                      {selected.aiAnalysisAllowed
                        ? "Allowed for this contact"
                        : "Not allowed for this contact"}
                    </p>
                  </div>
                </div>
              </div>

              <div className="px-5 py-4 border-b border-border/60">
                <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wide mb-3">
                  Recent conversations
                </p>
                {selected.conversations.length === 0 ? (
                  <p className="text-xs text-muted-foreground">No conversations for this contact.</p>
                ) : (
                  <div className="space-y-2">
                    {selected.conversations.map((conversation) => {
                      const status: DisplayStatus = conversation.needsHuman
                        ? "needs_human"
                        : conversation.status
                      return (
                        <Link key={conversation.id} href={`/inbox?conversation=${conversation.id}`}>
                          <div className="flex items-center gap-3 p-3 rounded-lg hover:bg-muted/30 transition-colors cursor-pointer border border-border/60">
                            <MessageCircle className="w-4 h-4 text-muted-foreground flex-shrink-0" />
                            <div className="flex-1 min-w-0">
                              <p className="text-sm text-foreground truncate">{conversation.lastMessage}</p>
                              <p className="text-[10px] text-muted-foreground mt-0.5">
                                {formatTimestamp(conversation.lastMessageAt)} · {conversation.messageCount} messages
                              </p>
                            </div>
                            <span
                              className={cn(
                                "text-[10px] font-medium px-1.5 py-0.5 rounded-full border capitalize flex-shrink-0",
                                STATUS_BADGE[status],
                              )}
                            >
                              {status.replace("_", " ")}
                            </span>
                          </div>
                        </Link>
                      )
                    })}
                  </div>
                )}
              </div>

              <div className="px-5 py-4 flex gap-2 flex-wrap">
                {selected.conversations[0] ? (
                  <Button size="sm" variant="outline" className="gap-2 h-8 text-xs border-border/60" asChild>
                    <Link href={`/inbox?conversation=${selected.conversations[0].id}`}>
                      <MessageCircle className="w-3.5 h-3.5" />
                      {t("customers_open_conversation")}
                    </Link>
                  </Button>
                ) : null}
                <Button
                  size="sm"
                  variant="outline"
                  className="gap-2 h-8 text-xs border-border/60"
                  disabled
                  title="Contact editing is not implemented in this phase"
                >
                  <Tag className="w-3.5 h-3.5" />
                  Contact editing coming later
                </Button>
              </div>
            </div>
          ) : (
            <div className="flex-1 flex items-center justify-center text-sm text-muted-foreground">
              Select a contact to view its details.
            </div>
          )}
        </div>
      )}
    </>
  )
}
