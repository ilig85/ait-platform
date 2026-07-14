"use client"

import Link from "next/link"
import { useRouter } from "next/navigation"
import { LogOut, Zap } from "lucide-react"
import { Button } from "@/components/ui/button"
import { useI18n } from "@/lib/i18n"

export default function LogoutPage() {
  const { t } = useI18n()
  const router = useRouter()

  return (
    <div className="min-h-screen bg-background flex items-center justify-center p-6">
      <div className="w-full max-w-sm text-center">
        <div className="flex items-center justify-center gap-2 mb-8">
          <div className="w-8 h-8 rounded-lg bg-[#0F766E] flex items-center justify-center">
            <Zap className="w-4 h-4 text-white" />
          </div>
          <span className="font-bold text-xl text-[#15253D]">AIT</span>
        </div>
        <div className="w-14 h-14 rounded-full bg-muted flex items-center justify-center mx-auto mb-4">
          <LogOut className="w-6 h-6 text-muted-foreground" />
        </div>
        <h1 className="text-xl font-bold mb-2">{t("auth_logout_confirm")}</h1>
        <p className="text-sm text-muted-foreground mb-6">{t("auth_logout_confirm_desc")}</p>
        <div className="flex gap-3">
          <Button variant="outline" className="flex-1" asChild>
            <Link href="/">{t("common_cancel")}</Link>
          </Button>
          <Button
            onClick={() => router.push("/login")}
            className="flex-1 bg-[#0F766E] hover:bg-[#0F766E]/90 text-white"
          >
            {t("nav_logout")}
          </Button>
        </div>
      </div>
    </div>
  )
}
