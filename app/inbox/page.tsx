import { AppShell } from "@/components/ait/app-shell"
import { AitHeader } from "@/components/ait/header"
import { DataUnavailable } from "@/components/ait/data-state"
import { InboxContent } from "@/components/inbox/inbox-content"
import { getInboxData } from "@/lib/data/dashboard"

export default async function InboxPage({
  searchParams,
}: {
  searchParams: Promise<{ conversation?: string; filter?: string }>
}) {
  const [result, params] = await Promise.all([getInboxData(), searchParams])
  return (
    <AppShell>
      {result.status === "ready" ? (
        <InboxContent
          data={result.data}
          initialConversationId={params.conversation}
          initialFilter={params.filter}
        />
      ) : (
        <>
          <AitHeader title="Inbox" subtitle="Organization-scoped conversations and messages." />
          <DataUnavailable message={result.message} missingMembership={result.status === "missing_membership"} />
        </>
      )}
    </AppShell>
  )
}
