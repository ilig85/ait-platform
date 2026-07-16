import { AppShell } from "@/components/ait/app-shell"
import { AitHeader } from "@/components/ait/header"
import { DataUnavailable } from "@/components/ait/data-state"
import { InsightsContent } from "@/components/insights/insights-content"
import { getInsightsData } from "@/lib/data/dashboard"

export default async function InsightsPage() {
  const result = await getInsightsData()
  return (
    <AppShell>
      {result.status === "ready" ? (
        <InsightsContent data={result.data} />
      ) : (
        <>
          <AitHeader title="Insights" subtitle="Metrics calculated from real organization data." />
          <DataUnavailable message={result.message} missingMembership={result.status === "missing_membership"} />
        </>
      )}
    </AppShell>
  )
}
