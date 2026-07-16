import Link from "next/link"
import { AlertCircle, BookOpen, ChevronRight, MessageSquare, Wifi, WifiOff } from "lucide-react"
import { Card, CardContent, CardHeader } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import type { OverviewData } from "@/lib/data/models"
import { cn } from "@/lib/utils"

function StatusIndicator({ status }: { status: string }) {
  const isConnected = status === "connected"
  const isWarning = ["connecting", "reconnecting"].includes(status)
  const isError = status === "error"

  return (
    <span
      className={cn(
        "inline-flex w-2 h-2 rounded-full flex-shrink-0",
        isConnected && "bg-[#2DE2B1]",
        isWarning && "bg-amber-400",
        isError && "bg-[#FF6B6B]",
        !isConnected && !isWarning && !isError && "bg-muted-foreground/40",
      )}
    />
  )
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
      {/* Channel status */}
      <Card className="border-border/60 bg-card">
        <CardHeader className="pb-2">
          <div className="flex items-center justify-between">
            <h3 className="font-semibold text-sm text-foreground">Channel health</h3>
            <Button variant="ghost" size="sm" className="h-7 px-2 text-xs text-muted-foreground gap-1 hover:text-foreground" asChild>
              <Link href="/settings">
                Settings
                <ChevronRight className="w-3 h-3" />
              </Link>
            </Button>
          </div>
        </CardHeader>
        <CardContent className="space-y-2">
          {channels.length === 0 ? (
            <div className="flex items-center gap-3 p-3 rounded-lg border border-border/60 bg-muted/20">
              <WifiOff className="w-4 h-4 text-muted-foreground/50 flex-shrink-0" />
              <div className="flex-1 min-w-0">
                <p className="text-xs font-medium text-foreground">WhatsApp Business</p>
                <div className="flex items-center gap-1.5 mt-0.5">
                  <StatusIndicator status="disconnected" />
                  <p className="text-[10px] text-muted-foreground">Not connected</p>
                </div>
              </div>
              <Badge variant="outline" className="text-[9px] text-muted-foreground border-border/60">
                Disconnected
              </Badge>
            </div>
          ) : (
            channels.map((channel) => (
              <div key={channel.id} className="flex items-center gap-3 p-3 rounded-lg border border-border/60 bg-muted/20">
                <MessageSquare className="w-4 h-4 text-muted-foreground flex-shrink-0" />
                <div className="flex-1 min-w-0">
                  <p className="text-xs font-medium text-foreground truncate">
                    {channel.displayName ?? channel.channelType}
                  </p>
                  <div className="flex items-center gap-1.5 mt-0.5">
                    <StatusIndicator status={channel.status} />
                    <p className="text-[10px] text-muted-foreground capitalize">
                      {channel.status.replace("_", " ")}
                    </p>
                  </div>
                </div>
                <Badge variant="outline" className="text-[9px] border-border/60">
                  {channel.provider}
                </Badge>
              </div>
            ))
          )}
          <div className="flex items-center gap-2 px-3 py-2 rounded-lg border border-dashed border-border/50">
            <Wifi className="w-3.5 h-3.5 text-muted-foreground/40 flex-shrink-0" />
            <span className="text-[10px] text-muted-foreground flex-1">Additional providers</span>
            <Badge variant="outline" className="text-[9px] h-4 px-1.5 text-muted-foreground border-border/40">
              Coming later
            </Badge>
          </div>
        </CardContent>
      </Card>

      {/* Recent escalations */}
      <Card className="border-border/60 bg-card">
        <CardHeader className="pb-2">
          <div className="flex items-center justify-between">
            <h3 className="font-semibold text-sm text-foreground">Recent escalations</h3>
            <Button variant="ghost" size="sm" className="h-7 px-2 text-xs text-muted-foreground gap-1 hover:text-foreground" asChild>
              <Link href="/inbox?filter=needs_human">
                View all
                <ChevronRight className="w-3 h-3" />
              </Link>
            </Button>
          </div>
        </CardHeader>
        <CardContent>
          {recentEscalations.length === 0 ? (
            <p className="text-xs text-muted-foreground text-center py-3">
              No conversations need human attention.
            </p>
          ) : (
            <div className="space-y-1">
              {recentEscalations.map((conversation) => (
                <Link key={conversation.id} href={`/inbox?conversation=${conversation.id}`}>
                  <div className="flex items-start gap-2.5 p-2.5 rounded-lg hover:bg-muted/40 transition-colors cursor-pointer">
                    <AlertCircle className="w-3.5 h-3.5 text-[#FF6B6B] mt-0.5 flex-shrink-0" />
                    <div className="min-w-0">
                      <p className="text-xs font-medium text-foreground truncate">
                        {conversation.contactName}
                      </p>
                      <p className="text-[10px] text-muted-foreground truncate">
                        {new Date(conversation.lastActivityAt).toLocaleString()}
                      </p>
                    </div>
                  </div>
                </Link>
              ))}
            </div>
          )}
        </CardContent>
      </Card>

      {/* Knowledge */}
      <Card className="border-border/60 bg-card">
        <CardHeader className="pb-2">
          <div className="flex items-center gap-2">
            <BookOpen className="w-3.5 h-3.5 text-[#2DE2B1]" />
            <h3 className="font-semibold text-sm text-foreground">Knowledge suggestions</h3>
          </div>
        </CardHeader>
        <CardContent>
          <p className="text-xs text-muted-foreground leading-relaxed">
            Unavailable until a production knowledge model is added.
          </p>
        </CardContent>
      </Card>
    </div>
  )
}
