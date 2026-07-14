"use client"

import { useState } from "react"
import { TrendingUp, TrendingDown, BarChart3, MessageSquare, CheckCircle2, Clock, Lightbulb } from "lucide-react"
import { cn } from "@/lib/utils"
import { DEMO_METRICS, DEMO_TOPICS, DEMO_PEAK_HOURS } from "@/lib/mock-data"
import { AitHeader } from "@/components/ait/header"
import { useI18n } from "@/lib/i18n"
import { Badge } from "@/components/ui/badge"
import { Card, CardContent, CardHeader } from "@/components/ui/card"
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip as RechartsTooltip, ResponsiveContainer } from "recharts"

const PERIODS = ["7 days", "30 days", "90 days"] as const

const KPI_DATA = [
  {
    label: "Conversation volume",
    value: DEMO_METRICS.customersContacted,
    change: `+${DEMO_METRICS.customersContactedChange}`,
    trend: "up" as const,
    positiveIsUp: true,
  },
  {
    label: "AI resolution rate",
    value: `${DEMO_METRICS.aiResolutionRate}%`,
    change: "+4.2%",
    trend: "up" as const,
    positiveIsUp: true,
  },
  {
    label: "Avg. first response",
    value: `${DEMO_METRICS.avgFirstResponseMin} min`,
    change: "-0.8 min",
    trend: "down" as const,
    positiveIsUp: false,
  },
  {
    label: "Est. time saved",
    value: `${DEMO_METRICS.estimatedTimeSavedHours}h`,
    change: "+3h",
    trend: "up" as const,
    positiveIsUp: true,
  },
]

const OPPORTUNITIES = [
  {
    title: "Update post-construction pricing",
    evidence: "11 conversations this week mentioned post-construction — pricing FAQ missing or outdated.",
  },
  {
    title: "Add Kyrgyz language replies",
    evidence: "38% of customers prefer Kyrgyz but most AI replies are in Russian.",
  },
  {
    title: "Reduce escalation rate for bookings",
    evidence: "31 booking requests last month — 42% required manager involvement.",
  },
  {
    title: "Create Sunday FAQ",
    evidence: "18 Sunday messages about working hours — no clear policy in knowledge base.",
  },
]

const RESOLUTION = {
  total: DEMO_METRICS.aiResolved + DEMO_METRICS.needsHuman + 12,
  aiResolved: DEMO_METRICS.aiResolved,
  managerAssisted: 12,
  escalated: DEMO_METRICS.needsHuman,
}

export function InsightsContent() {
  const { t } = useI18n()
  const [period, setPeriod] = useState<string>("30 days")

  return (
    <>
      <AitHeader title={t("insights_title")} subtitle={t("insights_subtitle")} />

      <div className="space-y-5">
        {/* Period picker */}
        <div className="flex items-center gap-1 bg-card border border-border rounded-lg p-1 w-fit">
          {PERIODS.map((p) => (
            <button
              key={p}
              onClick={() => setPeriod(p)}
              className={cn(
                "px-3 py-1 text-xs rounded-md font-medium transition-all",
                period === p
                  ? "bg-[#15253D] text-white"
                  : "text-muted-foreground hover:text-foreground hover:bg-accent"
              )}
            >
              {p}
            </button>
          ))}
        </div>

        {/* Demo banner */}
        <Badge variant="outline" className="text-muted-foreground text-xs">
          {t("insights_demo_label")}
        </Badge>

        {/* KPIs */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
          {KPI_DATA.map((kpi) => {
            const goodTrend = kpi.positiveIsUp ? kpi.trend === "up" : kpi.trend === "down"
            const TrendIcon = kpi.trend === "up" ? TrendingUp : TrendingDown
            return (
              <Card key={kpi.label} className="border-border/60">
                <CardContent className="p-4">
                  <p className="text-xs text-muted-foreground">{kpi.label}</p>
                  <p className="text-2xl font-bold text-foreground mt-1">{kpi.value}</p>
                  <div className={cn(
                    "flex items-center gap-1 mt-1 text-xs font-medium",
                    goodTrend ? "text-[#0F766E]" : "text-destructive"
                  )}>
                    <TrendIcon className="w-3 h-3" />
                    <span>{kpi.change} vs prev</span>
                  </div>
                </CardContent>
              </Card>
            )
          })}
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
          {/* Top topics */}
          <Card className="border-border/60">
            <CardHeader className="pb-2">
              <div className="flex items-center gap-2">
                <BarChart3 className="w-4 h-4 text-primary" />
                <h2 className="text-sm font-semibold">{t("insights_topics")}</h2>
              </div>
            </CardHeader>
            <CardContent className="space-y-3">
              {DEMO_TOPICS.map((topic, i) => (
                <div key={topic.topic} className="flex items-center gap-3">
                  <span className="text-xs text-muted-foreground w-4 text-right flex-shrink-0">{i + 1}</span>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center justify-between mb-1">
                      <span className="text-sm text-foreground font-medium truncate">{topic.topic}</span>
                      <div className="flex items-center gap-1.5 flex-shrink-0 ml-2">
                        <Badge variant="outline" className="text-[9px] h-4 px-1 uppercase">{topic.lang}</Badge>
                        <span className="text-xs text-muted-foreground">{topic.count}</span>
                      </div>
                    </div>
                    <div className="w-full h-1.5 bg-border rounded-full overflow-hidden">
                      <div
                        className="h-full rounded-full bg-primary"
                        style={{ width: `${(topic.count / DEMO_TOPICS[0].count) * 100}%` }}
                      />
                    </div>
                  </div>
                </div>
              ))}
            </CardContent>
          </Card>

          {/* Peak hours chart */}
          <Card className="border-border/60">
            <CardHeader className="pb-2">
              <div className="flex items-center gap-2">
                <Clock className="w-4 h-4 text-primary" />
                <h2 className="text-sm font-semibold">{t("insights_peak_hours")}</h2>
              </div>
            </CardHeader>
            <CardContent>
              <ResponsiveContainer width="100%" height={180}>
                <BarChart data={DEMO_PEAK_HOURS} margin={{ top: 5, right: 5, left: -20, bottom: 0 }}>
                  <CartesianGrid strokeDasharray="3 3" stroke="var(--border)" vertical={false} />
                  <XAxis dataKey="hour" tick={{ fontSize: 10, fill: "var(--muted-foreground)" }} axisLine={false} tickLine={false} interval={1} />
                  <YAxis tick={{ fontSize: 10, fill: "var(--muted-foreground)" }} axisLine={false} tickLine={false} />
                  <RechartsTooltip
                    content={({ active, payload, label }) =>
                      active && payload?.length ? (
                        <div className="bg-card border border-border rounded-lg px-3 py-2 shadow-md text-xs">
                          <p className="font-semibold">{label}</p>
                          <p className="text-muted-foreground">{payload[0].value} conversations</p>
                        </div>
                      ) : null
                    }
                  />
                  <Bar dataKey="count" fill="var(--color-accent)" radius={[3, 3, 0, 0]} />
                </BarChart>
              </ResponsiveContainer>
            </CardContent>
          </Card>
        </div>

        {/* Resolution breakdown */}
        <Card className="border-border/60">
          <CardHeader className="pb-2">
            <div className="flex items-center gap-2">
              <MessageSquare className="w-4 h-4 text-primary" />
              <h2 className="text-sm font-semibold">Response &amp; Resolution</h2>
            </div>
          </CardHeader>
          <CardContent className="space-y-4">
            {[
              { label: "AI resolved", value: RESOLUTION.aiResolved, color: "bg-[#0F766E]", icon: CheckCircle2 },
              { label: "Manager assisted", value: RESOLUTION.managerAssisted, color: "bg-blue-500", icon: Clock },
              { label: "Escalated", value: RESOLUTION.escalated, color: "bg-amber-500", icon: Clock },
            ].map((row) => {
              const pct = Math.round((row.value / RESOLUTION.total) * 100)
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
                  <div className="w-full h-2 bg-border rounded-full overflow-hidden">
                    <div className={cn("h-full rounded-full", row.color)} style={{ width: `${pct}%` }} />
                  </div>
                </div>
              )
            })}
          </CardContent>
        </Card>

        {/* Opportunities */}
        <Card className="border-border/60">
          <CardHeader className="pb-2">
            <div className="flex items-center gap-2">
              <Lightbulb className="w-4 h-4 text-amber-500" />
              <h2 className="text-sm font-semibold">{t("insights_opportunities")}</h2>
            </div>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
              {OPPORTUNITIES.map((opp) => (
                <div key={opp.title} className="flex gap-3 p-4 rounded-xl bg-accent/20 border border-border">
                  <div className="w-7 h-7 rounded-lg bg-amber-100 flex items-center justify-center flex-shrink-0">
                    <Lightbulb className="w-3.5 h-3.5 text-amber-600" />
                  </div>
                  <div>
                    <p className="text-sm font-medium text-foreground">{opp.title}</p>
                    <p className="text-xs text-muted-foreground mt-1 leading-relaxed">{opp.evidence}</p>
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      </div>
    </>
  )
}
