"use client"

import Link from "next/link"
import { MessageSquare, AlertCircle, CheckCircle2, ChevronRight, BookOpen } from "lucide-react"
import { Card, CardContent, CardHeader } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { useI18n } from "@/lib/i18n"
import { DEMO_CHANNELS, DEMO_ALERTS, DEMO_CONVERSATIONS } from "@/lib/mock-data"
import { cn } from "@/lib/utils"

function StatusDot({ status }: { status: string }) {
  return (
    <span className={cn(
      "inline-flex w-2 h-2 rounded-full",
      status === "connected"    && "bg-[#0F766E]",
      status === "disconnected" && "bg-muted-foreground",
      status === "error"        && "bg-destructive",
      status === "configuration_required" && "bg-amber-500",
    )} />
  )
}

export function ChannelHealth() {
  const { t } = useI18n()
  const recentEscalations = DEMO_CONVERSATIONS.filter((c) => c.status === "needs_human").slice(0, 3)
  const knowledgeSuggestions = [{ title: "Post-construction pricing", link: "/knowledge" }]

  return (
    <div className="space-y-3">
      {/* Channel status */}
      <Card className="border-border/60">
        <CardHeader className="pb-2">
          <div className="flex items-center justify-between">
            <h3 className="font-semibold text-sm">{t("overview_channel_health")}</h3>
            <Link href="/settings">
              <Button variant="ghost" size="sm" className="h-7 px-2 text-xs text-muted-foreground gap-1">
                {t("nav_settings")}<ChevronRight className="w-3 h-3" />
              </Button>
            </Link>
          </div>
        </CardHeader>
        <CardContent className="space-y-2">
          {DEMO_CHANNELS.map((ch) => (
            <div key={ch.id} className="flex items-center gap-3 p-2.5 rounded-lg border border-border bg-muted/20">
              <MessageSquare className="w-4 h-4 text-muted-foreground flex-shrink-0" />
              <div className="flex-1 min-w-0">
                <p className="text-xs font-medium">{ch.name}</p>
                <div className="flex items-center gap-1.5 mt-0.5">
                  <StatusDot status={ch.status} />
                  <p className="text-[10px] text-muted-foreground capitalize">
                    {ch.status === "configuration_required" ? t("common_configuration_required") : ch.status}
                  </p>
                </div>
              </div>
              <Link href="/settings">
                <Button size="sm" variant="outline" className="h-6 text-[10px] px-2">
                  {t("common_connect")}
                </Button>
              </Link>
            </div>
          ))}
          <div className="flex items-center gap-2 p-2 rounded-lg border border-dashed border-border/70 text-[10px] text-muted-foreground">
            <span className="flex-1">Instagram · Telegram</span>
            <Badge variant="outline" className="text-[9px] h-4 px-1.5">Coming later</Badge>
          </div>
        </CardContent>
      </Card>

      {/* Recent escalations */}
      <Card className="border-border/60">
        <CardHeader className="pb-2">
          <div className="flex items-center justify-between">
            <h3 className="font-semibold text-sm">{t("overview_recent_escalations")}</h3>
            <Link href="/inbox?filter=needs_human">
              <Button variant="ghost" size="sm" className="h-7 px-2 text-xs text-muted-foreground gap-1">
                {t("common_view_all")}<ChevronRight className="w-3 h-3" />
              </Button>
            </Link>
          </div>
        </CardHeader>
        <CardContent className="space-y-2">
          {recentEscalations.length === 0 ? (
            <p className="text-xs text-muted-foreground text-center py-2">{t("common_empty")}</p>
          ) : (
            recentEscalations.map((conv) => (
              <Link key={conv.id} href="/inbox">
                <div className="flex items-start gap-2 p-2.5 rounded-lg hover:bg-muted/40 transition-colors cursor-pointer">
                  <AlertCircle className="w-3.5 h-3.5 text-destructive mt-0.5 flex-shrink-0" />
                  <div className="min-w-0">
                    <p className="text-xs font-medium truncate">{conv.customerName}</p>
                    <p className="text-[10px] text-muted-foreground truncate">{conv.lastMessage}</p>
                  </div>
                </div>
              </Link>
            ))
          )}
        </CardContent>
      </Card>

      {/* Knowledge suggestions */}
      <Card className="border-border/60">
        <CardHeader className="pb-2">
          <div className="flex items-center justify-between">
            <h3 className="font-semibold text-sm">{t("overview_knowledge_suggestions")}</h3>
            <Link href="/knowledge">
              <Button variant="ghost" size="sm" className="h-7 px-2 text-xs text-muted-foreground gap-1">
                {t("common_view_all")}<ChevronRight className="w-3 h-3" />
              </Button>
            </Link>
          </div>
        </CardHeader>
        <CardContent className="space-y-2">
          {knowledgeSuggestions.map((s) => (
            <Link key={s.title} href={s.link}>
              <div className="flex items-center gap-2 p-2.5 rounded-lg hover:bg-muted/40 transition-colors cursor-pointer">
                <BookOpen className="w-3.5 h-3.5 text-primary flex-shrink-0" />
                <div className="flex-1 min-w-0">
                  <p className="text-xs font-medium truncate">{s.title}</p>
                  <p className="text-[10px] text-muted-foreground">AI suggestion · needs review</p>
                </div>
                <Badge className="bg-amber-50 text-amber-700 text-[9px] border-amber-200 border h-4 px-1.5">Review</Badge>
              </div>
            </Link>
          ))}
        </CardContent>
      </Card>
    </div>
  )
}
