"use client"

import { useTransition } from "react"
import Link from "next/link"
import { useRouter } from "next/navigation"
import { Loader2 } from "lucide-react"
import { Button } from "@/components/ui/button"
import { AitLogo } from "@/components/brand/ait-logo"
import { Mascot } from "@/components/brand/mascot"
import { useI18n } from "@/lib/i18n"
import { createClient } from "@/lib/supabase/client"

export default function LogoutPage() {
  const { t } = useI18n()
  const router = useRouter()
  const [isPending, startTransition] = useTransition()

  function handleLogout() {
    startTransition(async () => {
      const supabase = createClient()
      await supabase.auth.signOut()
      router.push("/login")
      router.refresh()
    })
  }

  return (
    <div className="min-h-screen bg-background flex items-center justify-center p-6">
      <div className="w-full max-w-sm text-center">
        <div className="flex items-center justify-center gap-2 mb-8">
          <AitLogo variant="wordmark" theme="light" size="md" label="AIT" />
        </div>
        <Mascot pose="stretching" width={96} height={96} className="mx-auto mb-4" />
        <h1 className="text-xl font-bold mb-2">{t("auth_logout_confirm")}</h1>
        <p className="text-sm text-muted-foreground mb-6">{t("auth_logout_confirm_desc")}</p>
        <div className="flex gap-3">
          <Button variant="outline" className="flex-1" asChild>
            <Link href="/dashboard">{t("common_cancel")}</Link>
          </Button>
          <Button
            onClick={handleLogout}
            disabled={isPending}
            className="flex-1 bg-primary hover:bg-primary/90 text-primary-foreground"
          >
            {isPending && <Loader2 className="w-4 h-4 animate-spin mr-1" />}
            {isPending ? "Signing out…" : t("nav_logout")}
          </Button>
        </div>
      </div>
    </div>
  )
}
