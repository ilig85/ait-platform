"use client"

import { Card, CardContent, CardHeader } from "@/components/ui/card"
import type { OverviewData } from "@/lib/data/models"
import {
  Area,
  AreaChart,
  CartesianGrid,
  Legend,
  ResponsiveContainer,
  Tooltip as RechartsTooltip,
  XAxis,
  YAxis,
} from "recharts"

export function ConversationsChart({ data }: { data: OverviewData["dailyActivity"] }) {
  const conversationTotal = data.reduce((total, day) => total + day.conversations, 0)
  const messageTotal = data.reduce((total, day) => total + day.messages, 0)

  return (
    <Card className="border-border/60">
      <CardHeader className="pb-2">
        <div>
          <h3 className="font-semibold text-foreground">Activity by day</h3>
          <p className="text-xs text-muted-foreground mt-0.5">New conversations and stored messages over the last seven days</p>
        </div>
        <div className="flex gap-6 mt-3 flex-wrap">
          <div>
            <p className="text-xs text-muted-foreground">New conversations</p>
            <p className="text-sm font-semibold text-foreground">{conversationTotal}</p>
          </div>
          <div>
            <p className="text-xs text-muted-foreground">Messages</p>
            <p className="text-sm font-semibold text-[#0F766E]">{messageTotal}</p>
          </div>
          <div>
            <p className="text-xs text-muted-foreground">Estimated time saved</p>
            <p className="text-sm font-semibold text-muted-foreground">Unavailable</p>
          </div>
        </div>
      </CardHeader>
      <CardContent>
        {conversationTotal === 0 && messageTotal === 0 ? (
          <div className="h-[220px] flex items-center justify-center text-sm text-muted-foreground">
            No conversation activity yet.
          </div>
        ) : (
          <ResponsiveContainer width="100%" height={220}>
            <AreaChart data={data} margin={{ top: 5, right: 5, left: -20, bottom: 0 }}>
              <defs>
                <linearGradient id="gradConversations" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="#0F766E" stopOpacity={0.15} />
                  <stop offset="95%" stopColor="#0F766E" stopOpacity={0} />
                </linearGradient>
              </defs>
              <CartesianGrid strokeDasharray="3 3" stroke="var(--border)" vertical={false} />
              <XAxis dataKey="label" tick={{ fontSize: 11, fill: "var(--muted-foreground)" }} axisLine={false} tickLine={false} />
              <YAxis allowDecimals={false} tick={{ fontSize: 11, fill: "var(--muted-foreground)" }} axisLine={false} tickLine={false} />
              <RechartsTooltip />
              <Legend wrapperStyle={{ fontSize: 11 }} />
              <Area type="monotone" dataKey="conversations" name="Conversations" stroke="#0F766E" strokeWidth={2} fill="url(#gradConversations)" />
              <Area type="monotone" dataKey="messages" name="Messages" stroke="#6BA3A0" strokeWidth={1.5} fill="none" />
            </AreaChart>
          </ResponsiveContainer>
        )}
      </CardContent>
    </Card>
  )
}
