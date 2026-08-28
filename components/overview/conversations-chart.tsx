"use client"

import { Card, CardContent, CardHeader } from "@/components/ui/card"
import type { OverviewData } from "@/lib/data/models"
import {
  Area,
  AreaChart,
  CartesianGrid,
  ResponsiveContainer,
  Tooltip as RechartsTooltip,
  XAxis,
  YAxis,
} from "recharts"

export function ConversationsChart({ data }: { data: OverviewData["dailyActivity"] }) {
  const conversationTotal = data.reduce((total, day) => total + day.conversations, 0)
  const messageTotal = data.reduce((total, day) => total + day.messages, 0)
  const isEmpty = conversationTotal === 0 && messageTotal === 0

  return (
    <Card className="border-border/60 bg-card">
      <CardHeader className="pb-3">
        <div className="flex items-start justify-between gap-4 flex-wrap">
          <div>
            <h3 className="font-semibold text-foreground text-sm">Activity — last 7 days</h3>
            <p className="text-xs text-muted-foreground mt-0.5">
              New conversations and stored messages
            </p>
          </div>
          <div className="flex items-center gap-5">
            <div className="text-right">
              <p className="text-xs text-muted-foreground">Conversations</p>
              <p className="text-sm font-semibold text-foreground tabular-nums">{conversationTotal}</p>
            </div>
            <div className="text-right">
              <p className="text-xs text-muted-foreground">Messages</p>
              <p className="text-sm font-semibold tabular-nums" style={{ color: "var(--ait-green-dark)" }}>{messageTotal}</p>
            </div>
          </div>
        </div>
      </CardHeader>
      <CardContent>
        {isEmpty ? (
          <div className="h-[200px] flex flex-col items-center justify-center gap-2 text-center">
            <p className="text-sm text-muted-foreground">No conversation activity yet.</p>
            <p className="text-xs text-muted-foreground/60">Activity will appear once a channel receives messages.</p>
          </div>
        ) : (
          <ResponsiveContainer width="100%" height={200}>
            <AreaChart data={data} margin={{ top: 4, right: 4, left: -20, bottom: 0 }}>
              <defs>
                <linearGradient id="gradConversations" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="var(--ait-green)" stopOpacity={0.22} />
                  <stop offset="95%" stopColor="var(--ait-green)" stopOpacity={0} />
                </linearGradient>
                <linearGradient id="gradMessages" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="var(--ait-blue)" stopOpacity={0.16} />
                  <stop offset="95%" stopColor="var(--ait-blue)" stopOpacity={0} />
                </linearGradient>
              </defs>
              <CartesianGrid strokeDasharray="3 3" stroke="var(--border)" vertical={false} strokeOpacity={0.6} />
              <XAxis
                dataKey="label"
                tick={{ fontSize: 11, fill: "var(--muted-foreground)" }}
                axisLine={false}
                tickLine={false}
              />
              <YAxis
                allowDecimals={false}
                tick={{ fontSize: 11, fill: "var(--muted-foreground)" }}
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
              <Area
                type="monotone"
                dataKey="conversations"
                name="Conversations"
                stroke="var(--ait-green)"
                strokeWidth={2}
                fill="url(#gradConversations)"
              />
              <Area
                type="monotone"
                dataKey="messages"
                name="Messages"
                stroke="var(--ait-blue)"
                strokeWidth={1.5}
                fill="url(#gradMessages)"
              />
            </AreaChart>
          </ResponsiveContainer>
        )}
      </CardContent>
    </Card>
  )
}
