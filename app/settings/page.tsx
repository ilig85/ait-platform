import { AppShell } from "@/components/ait/app-shell"
import { AitHeader } from "@/components/ait/header"
import { DataUnavailable } from "@/components/ait/data-state"
import { AitSettingsContent } from "@/components/ait-settings/settings-content"
import { getSettingsData } from "@/lib/data/dashboard"

export default async function SettingsPage() {
  const result = await getSettingsData()
  return (
    <AppShell>
      {result.status === "ready" ? (
        <AitSettingsContent
          data={result.data}
          metaAppId={process.env.NEXT_PUBLIC_META_APP_ID ?? null}
          metaEmbeddedSignupConfigurationId={
            process.env.NEXT_PUBLIC_META_WHATSAPP_EMBEDDED_SIGNUP_CONFIG_ID ?? null
          }
        />
      ) : (
        <>
          <AitHeader title="Settings" subtitle="Current organization and channel configuration." />
          <DataUnavailable message={result.message} missingMembership={result.status === "missing_membership"} />
        </>
      )}
    </AppShell>
  )
}
