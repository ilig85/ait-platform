import Link from "next/link"
import { AlertCircle, BookOpen, ChevronRight, MessageSquare } from "lucide-react"
import { Card, CardContent, CardHeader } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import type { OverviewData } from "@/lib/data/models"
import { cn } from "@/lib/utils"

function StatusDot({ status }: { status: string }) {
  return <span className={cn(
    "inline-flex w-2 h-2 rounded-full",
    status === "connected" && "bg-[#0F766E]",
    ["disconnected", "disabled"].includes(status) && "bg-muted-foreground",
    ["connecting", "reconnecting"].includes(status) && "bg-amber-500",
    status === "error" && "bg-destructive",
  )} />
}

export function ChannelHealth({
  channels,
  recentEscalations,
}: {
  channels: OverviewData["channels"]
  recentEscalations: OverviewData["recentEscalations"]
}) {
  return (
    <div className="space-y-3">
      <Card className="border-border/60">
        <CardHeader className="pb-2">
          <div className="flex items-center justify-between">
            <h3 className="font-semibold text-sm">Channel health</h3>
            <Link href="/settings">
              <Button variant="ghost" size="sm" className="h-7 px-2 text-xs text-muted-foreground gap-1">
                Settings<ChevronRight className="w-3 h-3" />
              </Button>
            </Link>
          </div>
        </CardHeader>
        <CardContent className="space-y-2">
          {channels.length === 0 ? (
            <div className="flex items-center gap-3 p-2.5 rounded-lg border border-border bg-muted/20">
              <MessageSquare className="w-4 h-4 text-muted-foreground flex-shrink-0" />
              <div className="flex-1 min-w-0">
                <p className="text-xs font-medium">WhatsApp Business</p>
                <div className="flex items-center gap-1.5 mt-0.5">
                  <StatusDot status="disconnected" />
                  <p className="text-[10px] text-muted-foreground">Disconnected</p>
                </div>
              </div>
              <Badge variant="outline" className="text-[9px]">Not connected</Badge>
            </div>
          ) : (
            channels.map((channel) => (
              <div key={channel.id} className="flex items-center gap-3 p-2.5 rounded-lg border border-border bg-muted/20">
                <MessageSquare className="w-4 h-4 text-muted-foreground flex-shrink-0" />
                <div className="flex-1 min-w-0">
                  <p className="text-xs font-medium truncate">{channel.displayName ?? channel.channelType}</p>
                  <div className="flex items-center gap-1.5 mt-0.5">
                    <StatusDot status={channel.status} />
                    <p className="text-[10px] text-muted-foreground capitalize">{channel.status.replace("_", " ")}</p>
                  </div>
                </div>
                <Badge variant="outline" className="text-[9px]">{channel.provider}</Badge>
              </div>
            ))
          )}
          <div className="flex items-center gap-2 p-2 rounded-lg border border-dashed border-border/70 text-[10px] text-muted-foreground">
            <span className="flex-1">Additional providers</span>
            <Badge variant="outline" className="text-[9px] h-4 px-1.5">Coming later</Badge>
          </div>
        </CardContent>
      </Card>

      <Card className="border-border/60">
        <CardHeader className="pb-2">
          <div className="flex items-center justify-between">
            <h3 className="font-semibold text-sm">Recent escalations</h3>
            <Link href="/inbox?filter=needs_human">
              <Button variant="ghost" size="sm" className="h-7 px-2 text-xs text-muted-foreground gap-1">
                View all<ChevronRight className="w-3 h-3" />
              </Button>
            </Link>
          </div>
        </CardHeader>
        <CardContent className="space-y-2">
          {recentEscalations.length === 0 ? (
            <p className="text-xs text-muted-foreground text-center py-2">No conversations need human attention.</p>
          ) : (
            recentEscalations.map((conversation) => (
              <Link key={conversation.id} href={`/inbox?conversation=${conversation.id}`}>
                <div className="flex items-start gap-2 p-2.5 rounded-lg hover:bg-muted/40 transition-colors cursor-pointer">
                  <AlertCircle className="w-3.5 h-3.5 text-destructive mt-0.5 flex-shrink-0" />
                  <div className="min-w-0">
                    <p className="text-xs font-medium truncate">{conversation.contactName}</p>
                    <p className="text-[10px] text-muted-foreground truncate">
                      Last activity {new Date(conversation.lastActivityAt).toLocaleString()}
                    </p>
                  </div>
                </div>
              </Link>
            ))
          )}
        </CardContent>
      </Card>

      <Card className="border-border/60">
        <CardHeader className="pb-2">
          <div className="flex items-center gap-2">
            <BookOpen className="w-3.5 h-3.5 text-primary" />
            <h3 className="font-semibold text-sm">Knowledge suggestions</h3>
          </div>
        </CardHeader>
        <CardContent>
          <p className="text-xs text-muted-foreground">Unavailable until a production knowledge model is added.</p>
        </CardContent>
      </Card>
    </div>
  )
}
