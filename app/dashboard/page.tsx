import { AppShell } from "@/components/ait/app-shell"
import { AitHeader } from "@/components/ait/header"
import { DataUnavailable } from "@/components/ait/data-state"
import { MetricCards } from "@/components/overview/metric-cards"
import { ConversationsChart } from "@/components/overview/conversations-chart"
import { AiCommandCenter } from "@/components/overview/ai-command-center"
import { ChannelHealth } from "@/components/overview/channel-health"
import { getOverviewData } from "@/lib/data/dashboard"

export default async function OverviewPage() {
  const result = await getOverviewData()
  return (
    <AppShell>
      <AitHeader
        title="Overview"
        subtitle="Customer conversations, AI activity, and items that need you."
      />

      {result.status !== "ready" ? (
        <DataUnavailable
          message={result.message}
          missingMembership={result.status === "missing_membership"}
        />
      ) : (
        <div className="space-y-4 md:space-y-5">
          <MetricCards metrics={result.data.metrics} />

          <div className="grid grid-cols-1 xl:grid-cols-3 gap-4">
            <div className="xl:col-span-2 space-y-4">
              <ConversationsChart data={result.data.dailyActivity} />
              <AiCommandCenter />
            </div>
            <div className="xl:col-span-1">
              <ChannelHealth
                channels={result.data.channels}
                recentEscalations={result.data.recentEscalations}
              />
            </div>
          </div>
        </div>
      )}
    </AppShell>
  )
}
