"use client"

import { useMemo, useState } from "react"
import { BarChart3, CheckCircle2, Clock, Info, MessageSquare, Users } from "lucide-react"
import { AitHeader } from "@/components/ait/header"
import { Card, CardContent, CardHeader } from "@/components/ui/card"
import type { InsightsData } from "@/lib/data/models"
import { useI18n } from "@/lib/i18n"
import { cn } from "@/lib/utils"
import {
  Bar,
  BarChart,
  CartesianGrid,
  ResponsiveContainer,
  Tooltip as RechartsTooltip,
  XAxis,
  YAxis,
} from "recharts"

const PERIODS = [7, 30, 90] as const

function localHour(timestamp: string, timezone: string) {
  try {
    const hour = new Intl.DateTimeFormat("en-US", {
      hour: "2-digit",
      hourCycle: "h23",
      timeZone: timezone,
    })
      .formatToParts(new Date(timestamp))
      .find((p) => p.type === "hour")?.value
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
    const conversations = data.conversations.filter(
      (c) => new Date(c.createdAt).getTime() >= cutoffTime,
    )
    const messages = data.messages.filter(
      (m) => new Date(m.timestamp).getTime() >= cutoffTime,
    )
    const resolved = conversations.filter((c) => c.status === "resolved")
    const contactsReached = new Set(conversations.map((c) => c.contactId)).size

    const messagesByConversation = new Map<string, typeof messages>()
    for (const msg of messages) {
      const cur = messagesByConversation.get(msg.conversationId) ?? []
      cur.push(msg)
      messagesByConversation.set(msg.conversationId, cur)
    }

    const responseMinutes: number[] = []
    for (const convMsgs of messagesByConversation.values()) {
      const sorted = [...convMsgs].sort((a, b) => a.timestamp.localeCompare(b.timestamp))
      const firstInbound = sorted.find((m) => m.direction === "inbound")
      if (!firstInbound) continue
      const firstOutbound = sorted.find(
        (m) => m.direction === "outbound" && m.timestamp >= firstInbound.timestamp,
      )
      if (firstOutbound) {
        responseMinutes.push(
          Math.max(
            0,
            (new Date(firstOutbound.timestamp).getTime() - new Date(firstInbound.timestamp).getTime()) /
              60000,
          ),
        )
      }
    }

    let aiOnlyResolved = 0
    let managerAssisted = 0
    for (const conv of resolved) {
      const msgs = messagesByConversation.get(conv.id) ?? []
      const hasAi = msgs.some((m) => m.direction === "outbound" && m.senderType === "ai")
      const hasManager = msgs.some((m) => m.direction === "outbound" && m.senderType === "manager")
      if (hasManager) managerAssisted++
      else if (hasAi) aiOnlyResolved++
    }

    const peakHours = Array.from({ length: 24 }, (_, hour) => ({
      hour: `${String(hour).padStart(2, "0")}:00`,
      count: 0,
    }))
    for (const msg of messages) {
      if (msg.direction === "inbound")
        peakHours[localHour(msg.timestamp, data.timezone)].count++
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
        ? responseMinutes.reduce((a, b) => a + b, 0) / responseMinutes.length
        : null,
      peakHours,
      inboundMessages: messages.filter((m) => m.direction === "inbound").length,
    }
  }, [data, period])

  const kpis = [
    { label: "Conversation volume", value: metrics.conversations, note: `Created in ${period} days`, accent: "var(--primary)" },
    { label: "Contacts reached", value: metrics.contactsReached, note: `${data.totalContacts} total stored`, accent: "var(--ait-blue)" },
    { label: "Messages", value: metrics.messages, note: `Stored in ${period} days`, accent: "var(--primary)" },
    { label: "Needs human now", value: data.currentNeedsHuman, note: "Current state", accent: "var(--destructive)" },
  ]

  const resolutionRows = [
    { label: "AI-only resolved", value: metrics.aiOnlyResolved, color: "var(--primary)", icon: CheckCircle2 },
    { label: "Manager assisted", value: metrics.managerAssisted, color: "var(--ait-blue)", icon: Users },
    { label: "Other resolved", value: metrics.otherResolved, color: "var(--muted-foreground)", icon: MessageSquare },
  ]

  return (
    <>
      <AitHeader
        title={t("insights_title")}
        subtitle="Metrics calculated from real organization conversations and messages."
      />

      <div className="space-y-5">
        {/* Period picker */}
        <div className="flex items-center gap-1 bg-card border border-border/60 rounded-lg p-1 w-fit">
          {PERIODS.map((days) => (
            <button
              key={days}
              onClick={() => setPeriod(days)}
              className={cn(
                "px-3 py-1 text-xs rounded-md font-medium transition-all",
                period === days
                  ? "bg-primary text-primary-foreground"
                  : "text-muted-foreground hover:text-foreground hover:bg-muted/60",
              )}
            >
              {days} days
            </button>
          ))}
        </div>

        {/* KPI cards */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
          {kpis.map((kpi) => (
            <Card key={kpi.label} className="border-border/60 bg-card">
              <CardContent className="p-4">
                <p className="text-xs text-muted-foreground">{kpi.label}</p>
                <p className="text-2xl font-semibold text-foreground mt-1 tabular-nums">{kpi.value}</p>
                <p className="text-[10px] text-muted-foreground mt-1">{kpi.note}</p>
              </CardContent>
            </Card>
          ))}
        </div>

        {/* Charts row */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
          <Card className="border-border/60 bg-card">
            <CardHeader className="pb-2">
              <div className="flex items-center gap-2">
                <BarChart3 className="w-4 h-4 text-primary" />
                <h2 className="text-sm font-semibold text-foreground">Top topics</h2>
              </div>
            </CardHeader>
            <CardContent className="h-[200px] flex items-center justify-center text-center">
              <div>
                <Info className="w-6 h-6 text-muted-foreground mx-auto mb-2" />
                <p className="text-sm font-medium text-foreground">Unavailable</p>
                <p className="text-xs text-muted-foreground mt-1 max-w-xs leading-relaxed">
                  The current schema does not store verified conversation topics.
                </p>
              </div>
            </CardContent>
          </Card>

          <Card className="border-border/60 bg-card">
            <CardHeader className="pb-2">
              <div className="flex items-center gap-2">
                <Clock className="w-4 h-4 text-[var(--ait-blue)]" />
                <h2 className="text-sm font-semibold text-foreground">Inbound message hours</h2>
              </div>
              <p className="text-xs text-muted-foreground">
                {data.timezone} · {metrics.inboundMessages} inbound messages in period
              </p>
            </CardHeader>
            <CardContent>
              {metrics.inboundMessages === 0 ? (
                <div className="h-[180px] flex items-center justify-center text-sm text-muted-foreground">
                  No inbound messages in this period.
                </div>
              ) : (
                <ResponsiveContainer width="100%" height={180}>
                  <BarChart data={metrics.peakHours} margin={{ top: 5, right: 5, left: -20, bottom: 0 }}>
                    <CartesianGrid strokeDasharray="3 3" stroke="var(--border)" vertical={false} strokeOpacity={0.6} />
                    <XAxis
                      dataKey="hour"
                      tick={{ fontSize: 10, fill: "var(--muted-foreground)" }}
                      axisLine={false}
                      tickLine={false}
                      interval={2}
                    />
                    <YAxis
                      allowDecimals={false}
                      tick={{ fontSize: 10, fill: "var(--muted-foreground)" }}
                      axisLine={false}
                      tickLine={false}
                    />
                    <RechartsTooltip
                      contentStyle={{
                        background: "var(--card)",
                        border: "1px solid var(--border)",
                        borderRadius: "8px",
                        fontSize: 12,
                      }}
                    />
                    <Bar
                      dataKey="count"
                      name="Inbound messages"
                      fill="var(--primary)"
                      fillOpacity={0.75}
                      radius={[3, 3, 0, 0]}
                    />
                  </BarChart>
                </ResponsiveContainer>
              )}
            </CardContent>
          </Card>
        </div>

        {/* Response & resolution */}
        <Card className="border-border/60 bg-card">
          <CardHeader className="pb-2">
            <div className="flex items-center gap-2">
              <MessageSquare className="w-4 h-4 text-primary" />
              <h2 className="text-sm font-semibold text-foreground">Response &amp; resolution</h2>
            </div>
            <p className="text-xs text-muted-foreground">
              Average first response:{" "}
              {metrics.averageFirstResponseMinutes === null
                ? "Unavailable — no complete inbound/outbound pair"
                : `${metrics.averageFirstResponseMinutes.toFixed(1)} minutes`}
            </p>
          </CardHeader>
          <CardContent className="space-y-4">
            {resolutionRows.map((row) => {
              const pct = metrics.resolved === 0 ? 0 : Math.round((row.value / metrics.resolved) * 100)
              const Icon = row.icon
              return (
                <div key={row.label}>
                  <div className="flex items-center justify-between mb-1.5">
                    <div className="flex items-center gap-2">
                      <Icon className="w-3.5 h-3.5 text-muted-foreground" />
                      <span className="text-sm text-foreground">{row.label}</span>
                    </div>
                    <span className="text-sm font-semibold text-foreground">
                      {row.value}{" "}
                      <span className="text-xs text-muted-foreground font-normal">({pct}%)</span>
                    </span>
                  </div>
                  <div className="w-full h-1.5 bg-muted rounded-full overflow-hidden">
                    <div
                      className="h-full rounded-full transition-all duration-500"
                      style={{ width: `${pct}%`, backgroundColor: row.color }}
                    />
                  </div>
                </div>
              )
            })}
            {metrics.resolved === 0 && (
              <p className="text-xs text-muted-foreground">
                No conversations were resolved in this period.
              </p>
            )}
          </CardContent>
        </Card>

        {/* Disclaimer */}
        <Card className="border-border/60 bg-card">
          <CardContent className="p-4 flex items-start gap-3">
            <Info className="w-4 h-4 text-muted-foreground mt-0.5 flex-shrink-0" />
            <div>
              <p className="text-sm font-medium text-foreground">
                Historical trends and opportunities are unavailable
              </p>
              <p className="text-xs text-muted-foreground mt-0.5 leading-relaxed">
                This phase does not invent comparison periods, sentiment, topics, or AI recommendations
                that are absent from the production schema.
              </p>
            </div>
          </CardContent>
        </Card>
      </div>
    </>
  )
}
