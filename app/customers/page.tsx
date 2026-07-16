import { AppShell } from "@/components/ait/app-shell"
import { AitHeader } from "@/components/ait/header"
import { DataUnavailable } from "@/components/ait/data-state"
import { CustomersContent } from "@/components/customers/customers-content"
import { getCustomersData } from "@/lib/data/dashboard"

export default async function CustomersPage() {
  const result = await getCustomersData()
  return (
    <AppShell>
      {result.status === "ready" ? (
        <CustomersContent data={result.data} />
      ) : (
        <>
          <AitHeader title="Customers" subtitle="Real contacts and their stored conversation history." />
          <DataUnavailable message={result.message} missingMembership={result.status === "missing_membership"} />
        </>
      )}
    </AppShell>
  )
}
