"use client"

import { useMemo, useState } from "react"
import { BarChart3, CheckCircle2, Clock, Info, MessageSquare, Users } from "lucide-react"
import { AitHeader } from "@/components/ait/header"
import { Card, CardContent, CardHeader } from "@/components/ui/card"
import type { InsightsData } from "@/lib/data/models"
import { useI18n } from "@/lib/i18n"
import { cn } from "@/lib/utils"
import { Bar, BarChart, CartesianGrid, ResponsiveContainer, Tooltip as RechartsTooltip, XAxis, YAxis } from "recharts"

const PERIODS = [7, 30, 90] as const

function localHour(timestamp: string, timezone: string) {
  try {
    const hour = new Intl.DateTimeFormat("en-US", {
      hour: "2-digit",
      hourCycle: "h23",
      timeZone: timezone,
    }).formatToParts(new Date(timestamp)).find((part) => part.type === "hour")?.value
    return Number(hour ?? 0)
  } catch {
    return new Date(timestamp).getUTCHours()
  }
}

export function InsightsContent({ data }: { data: InsightsData }) {
  const { t } = useI18n()
  const [period, setPeriod] = useState<(typeof PERIODS)[number]>(30)

  const metrics = useMemo(() => {
    const cutoff = new Date(data.generatedAt)
    cutoff.setUTCDate(cutoff.getUTCDate() - period)
    const cutoffTime = cutoff.getTime()
    const conversations = data.conversations.filter((conversation) => new Date(conversation.createdAt).getTime() >= cutoffTime)
    const messages = data.messages.filter((message) => new Date(message.timestamp).getTime() >= cutoffTime)
    const resolved = conversations.filter((conversation) => conversation.status === "resolved")
    const contactsReached = new Set(conversations.map((conversation) => conversation.contactId)).size

    const messagesByConversation = new Map<string, typeof messages>()
    for (const message of messages) {
      const current = messagesByConversation.get(message.conversationId) ?? []
      current.push(message)
      messagesByConversation.set(message.conversationId, current)
    }

    const responseMinutes: number[] = []
    for (const conversationMessages of messagesByConversation.values()) {
      const sorted = [...conversationMessages].sort((a, b) => a.timestamp.localeCompare(b.timestamp))
      const firstInbound = sorted.find((message) => message.direction === "inbound")
      if (!firstInbound) continue
      const firstOutbound = sorted.find(
        (message) => message.direction === "outbound" && message.timestamp >= firstInbound.timestamp,
      )
      if (firstOutbound) {
        responseMinutes.push(
          Math.max(0, (new Date(firstOutbound.timestamp).getTime() - new Date(firstInbound.timestamp).getTime()) / 60000),
        )
      }
    }

    let aiOnlyResolved = 0
    let managerAssisted = 0
    for (const conversation of resolved) {
      const conversationMessages = messagesByConversation.get(conversation.id) ?? []
      const hasAi = conversationMessages.some((message) => message.direction === "outbound" && message.senderType === "ai")
      const hasManager = conversationMessages.some((message) => message.direction === "outbound" && message.senderType === "manager")
      if (hasManager) managerAssisted += 1
      else if (hasAi) aiOnlyResolved += 1
    }

    const peakHours = Array.from({ length: 24 }, (_, hour) => ({
      hour: `${String(hour).padStart(2, "0")}:00`,
      count: 0,
    }))
    for (const message of messages) {
      if (message.direction === "inbound") peakHours[localHour(message.timestamp, data.timezone)].count += 1
    }

    return {
      conversations: conversations.length,
      contactsReached,
      messages: messages.length,
      resolved: resolved.length,
      aiOnlyResolved,
      managerAssisted,
      otherResolved: Math.max(0, resolved.length - aiOnlyResolved - managerAssisted),
      averageFirstResponseMinutes: responseMinutes.length
        ? responseMinutes.reduce((total, value) => total + value, 0) / responseMinutes.length
        : null,
      peakHours,
      inboundMessages: messages.filter((message) => message.direction === "inbound").length,
    }
  }, [data, period])

  const kpis = [
    { label: "Conversation volume", value: metrics.conversations, note: `Created in ${period} days` },
    { label: "Contacts reached", value: metrics.contactsReached, note: `${data.totalContacts} total stored contacts` },
    { label: "Messages", value: metrics.messages, note: `Stored in ${period} days` },
    { label: "Needs human now", value: data.currentNeedsHuman, note: "Current organization state" },
  ]

  const resolutionRows = [
    { label: "AI-only resolved", value: metrics.aiOnlyResolved, color: "bg-[#0F766E]", icon: CheckCircle2 },
    { label: "Manager assisted", value: metrics.managerAssisted, color: "bg-blue-500", icon: Users },
    { label: "Other resolved", value: metrics.otherResolved, color: "bg-muted-foreground", icon: MessageSquare },
  ]

  return (
    <>
      <AitHeader title={t("insights_title")} subtitle="Metrics calculated from real organization conversations and messages." />

      <div className="space-y-5">
        <div className="flex items-center gap-1 bg-card border border-border rounded-lg p-1 w-fit">
          {PERIODS.map((days) => (
            <button
              key={days}
              onClick={() => setPeriod(days)}
              className={cn(
                "px-3 py-1 text-xs rounded-md font-medium transition-all",
                period === days ? "bg-[#15253D] text-white" : "text-muted-foreground hover:text-foreground hover:bg-accent",
              )}
            >
              {days} days
            </button>
          ))}
        </div>

        <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
          {kpis.map((kpi) => (
            <Card key={kpi.label} className="border-border/60">
              <CardContent className="p-4">
                <p className="text-xs text-muted-foreground">{kpi.label}</p>
                <p className="text-2xl font-bold text-foreground mt-1">{kpi.value}</p>
                <p className="text-[10px] text-muted-foreground mt-1">{kpi.note}</p>
              </CardContent>
            </Card>
          ))}
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
          <Card className="border-border/60">
            <CardHeader className="pb-2">
              <div className="flex items-center gap-2">
                <BarChart3 className="w-4 h-4 text-primary" />
                <h2 className="text-sm font-semibold">Top topics</h2>
              </div>
            </CardHeader>
            <CardContent className="h-[200px] flex items-center justify-center text-center">
              <div>
                <Info className="w-6 h-6 text-muted-foreground mx-auto mb-2" />
                <p className="text-sm font-medium text-foreground">Unavailable</p>
                <p className="text-xs text-muted-foreground mt-1 max-w-xs">
                  The current schema does not store verified conversation topics, so no topic ranking is inferred.
                </p>
              </div>
            </CardContent>
          </Card>

          <Card className="border-border/60">
            <CardHeader className="pb-2">
              <div className="flex items-center gap-2">
                <Clock className="w-4 h-4 text-primary" />
                <h2 className="text-sm font-semibold">Inbound message hours</h2>
              </div>
              <p className="text-xs text-muted-foreground">Using {data.timezone}; {metrics.inboundMessages} inbound messages in this period</p>
            </CardHeader>
            <CardContent>
              {metrics.inboundMessages === 0 ? (
                <div className="h-[180px] flex items-center justify-center text-sm text-muted-foreground">No inbound messages in this period.</div>
              ) : (
                <ResponsiveContainer width="100%" height={180}>
                  <BarChart data={metrics.peakHours} margin={{ top: 5, right: 5, left: -20, bottom: 0 }}>
                    <CartesianGrid strokeDasharray="3 3" stroke="var(--border)" vertical={false} />
                    <XAxis dataKey="hour" tick={{ fontSize: 10, fill: "var(--muted-foreground)" }} axisLine={false} tickLine={false} interval={2} />
                    <YAxis allowDecimals={false} tick={{ fontSize: 10, fill: "var(--muted-foreground)" }} axisLine={false} tickLine={false} />
                    <RechartsTooltip />
                    <Bar dataKey="count" name="Inbound messages" fill="var(--color-accent)" radius={[3, 3, 0, 0]} />
                  </BarChart>
                </ResponsiveContainer>
              )}
            </CardContent>
          </Card>
        </div>

        <Card className="border-border/60">
          <CardHeader className="pb-2">
            <div className="flex items-center gap-2">
              <MessageSquare className="w-4 h-4 text-primary" />
              <h2 className="text-sm font-semibold">Response &amp; resolution</h2>
            </div>
            <p className="text-xs text-muted-foreground">
              Average first response: {metrics.averageFirstResponseMinutes === null
                ? "Unavailable — no complete inbound/outbound pair"
                : `${metrics.averageFirstResponseMinutes.toFixed(1)} minutes`}
            </p>
          </CardHeader>
          <CardContent className="space-y-4">
            {resolutionRows.map((row) => {
              const percentage = metrics.resolved === 0 ? 0 : Math.round((row.value / metrics.resolved) * 100)
              const Icon = row.icon
              return (
                <div key={row.label}>
                  <div className="flex items-center justify-between mb-1.5">
                    <div className="flex items-center gap-2">
                      <Icon className="w-3.5 h-3.5 text-muted-foreground" />
                      <span className="text-sm text-foreground">{row.label}</span>
                    </div>
                    <span className="text-sm font-semibold text-foreground">
                      {row.value} <span className="text-xs text-muted-foreground font-normal">({percentage}%)</span>
                    </span>
                  </div>
                  <div className="w-full h-2 bg-border rounded-full overflow-hidden">
                    <div className={cn("h-full rounded-full", row.color)} style={{ width: `${percentage}%` }} />
                  </div>
                </div>
              )
            })}
            {metrics.resolved === 0 && <p className="text-xs text-muted-foreground">No conversations were resolved in this period.</p>}
          </CardContent>
        </Card>

        <Card className="border-border/60">
          <CardContent className="p-5 flex items-start gap-3">
            <Info className="w-4 h-4 text-muted-foreground mt-0.5" />
            <div>
              <p className="text-sm font-medium text-foreground">Historical trends and opportunities are unavailable</p>
              <p className="text-xs text-muted-foreground mt-1">
                This phase does not invent comparison periods, sentiment, topics, or AI recommendations that are absent from the production schema.
              </p>
            </div>
          </CardContent>
        </Card>
      </div>
    </>
  )
}
