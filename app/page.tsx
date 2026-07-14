import { redirect } from "next/navigation"
import { createClient } from "@/lib/supabase/server"
import { AppShell } from "@/components/ait/app-shell"
import { AitHeader } from "@/components/ait/header"
import { MetricCards } from "@/components/overview/metric-cards"
import { ConversationsChart } from "@/components/overview/conversations-chart"
import { AiCommandCenter } from "@/components/overview/ai-command-center"
import { ChannelHealth } from "@/components/overview/channel-health"

export default async function OverviewPage() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect("/login")
  return (
    <AppShell>
      <AitHeader
        title="Overview"
        subtitle="Customer conversations, AI activity, and items that need you."
      />

      <div className="space-y-4 md:space-y-5">
        <MetricCards />

        <div className="grid grid-cols-1 xl:grid-cols-3 gap-4">
          <div className="xl:col-span-2 space-y-4">
            <ConversationsChart />
            <AiCommandCenter />
          </div>
          <div className="xl:col-span-1">
            <ChannelHealth />
          </div>
        </div>
      </div>
    </AppShell>
  )
}
