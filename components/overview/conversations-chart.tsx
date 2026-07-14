"use client"

import { Card, CardContent, CardHeader } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { useI18n } from "@/lib/i18n"
import { DEMO_DAILY_DATA, DEMO_METRICS } from "@/lib/mock-data"
import {
  AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip as RechartsTooltip,
  ResponsiveContainer, Legend,
} from "recharts"

const CustomTooltip = ({ active, payload, label }: any) => {
  if (active && payload && payload.length) {
    return (
      <div className="bg-card border border-border rounded-lg px-3 py-2 shadow-md text-xs">
        <p className="font-semibold mb-1">{label}</p>
        {payload.map((p: any) => (
          <div key={p.dataKey} className="flex items-center gap-2">
            <span className="w-2 h-2 rounded-full" style={{ background: p.color }} />
            <span className="text-muted-foreground">{p.name}:</span>
            <span className="font-medium">{p.value}</span>
          </div>
        ))}
      </div>
    )
  }
  return null
}

export function ConversationsChart() {
  const { t } = useI18n()

  return (
    <Card className="border-border/60">
      <CardHeader className="pb-2">
        <div className="flex items-start justify-between gap-4 flex-wrap">
          <div>
            <h3 className="font-semibold text-foreground">{t("overview_conversations_by_day")}</h3>
            <p className="text-xs text-muted-foreground mt-0.5">Customers contacted per day this week</p>
          </div>
          <Badge variant="outline" className="text-xs text-muted-foreground shrink-0">
            {t("common_demo_data")}
          </Badge>
        </div>
        <div className="flex gap-6 mt-3 flex-wrap">
          <div>
            <p className="text-xs text-muted-foreground">{t("overview_avg_first_response")}</p>
            <p className="text-sm font-semibold text-foreground">{DEMO_METRICS.avgFirstResponseMin} min <span className="text-[10px] font-normal text-muted-foreground">(est.)</span></p>
          </div>
          <div>
            <p className="text-xs text-muted-foreground">{t("overview_ai_resolution_rate")}</p>
            <p className="text-sm font-semibold text-[#0F766E]">{DEMO_METRICS.aiResolutionRate}%</p>
          </div>
          <div>
            <p className="text-xs text-muted-foreground">{t("overview_manager_time_saved")}</p>
            <p className="text-sm font-semibold text-foreground">{DEMO_METRICS.estimatedTimeSavedHours}h <span className="text-[10px] font-normal text-muted-foreground">(est.)</span></p>
          </div>
        </div>
      </CardHeader>
      <CardContent>
        <ResponsiveContainer width="100%" height={220}>
          <AreaChart data={DEMO_DAILY_DATA} margin={{ top: 5, right: 5, left: -20, bottom: 0 }}>
            <defs>
              <linearGradient id="gradCustomers" x1="0" y1="0" x2="0" y2="1">
                <stop offset="5%" stopColor="#0F766E" stopOpacity={0.15} />
                <stop offset="95%" stopColor="#0F766E" stopOpacity={0} />
              </linearGradient>
              <linearGradient id="gradEscalated" x1="0" y1="0" x2="0" y2="1">
                <stop offset="5%" stopColor="#DC2626" stopOpacity={0.12} />
                <stop offset="95%" stopColor="#DC2626" stopOpacity={0} />
              </linearGradient>
            </defs>
            <CartesianGrid strokeDasharray="3 3" stroke="var(--border)" vertical={false} />
            <XAxis dataKey="shortDay" tick={{ fontSize: 11, fill: "var(--muted-foreground)" }} axisLine={false} tickLine={false} />
            <YAxis tick={{ fontSize: 11, fill: "var(--muted-foreground)" }} axisLine={false} tickLine={false} />
            <RechartsTooltip content={<CustomTooltip />} />
            <Area type="monotone" dataKey="customers" name="Customers" stroke="#0F766E" strokeWidth={2} fill="url(#gradCustomers)" dot={{ fill: "#0F766E", r: 3 }} />
            <Area type="monotone" dataKey="resolved" name="Resolved" stroke="#6BA3A0" strokeWidth={1.5} fill="none" strokeDasharray="4 2" dot={false} />
            <Area type="monotone" dataKey="escalated" name="Escalated" stroke="#DC2626" strokeWidth={1.5} fill="url(#gradEscalated)" dot={false} />
          </AreaChart>
        </ResponsiveContainer>
      </CardContent>
    </Card>
  )
}
