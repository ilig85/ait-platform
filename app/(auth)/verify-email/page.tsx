"use client"

import Link from "next/link"
import { Mail, Zap } from "lucide-react"
import { Button } from "@/components/ui/button"
import { useI18n } from "@/lib/i18n"

export default function VerifyEmailPage() {
  const { t } = useI18n()
  return (
    <div className="min-h-screen bg-background flex items-center justify-center p-6">
      <div className="w-full max-w-sm text-center">
        <div className="flex items-center justify-center gap-2 mb-8">
          <div className="w-8 h-8 rounded-lg bg-[#0F766E] flex items-center justify-center">
            <Zap className="w-4 h-4 text-white" />
          </div>
          <span className="font-bold text-xl text-[#15253D]">AIT</span>
        </div>
        <div className="w-16 h-16 rounded-full bg-primary/10 flex items-center justify-center mx-auto mb-4">
          <Mail className="w-8 h-8 text-primary" />
        </div>
        <h1 className="text-2xl font-bold mb-2">{t("auth_verify_email")}</h1>
        <p className="text-muted-foreground text-sm mb-6">
          We sent a verification link to your email address. Click it to activate your account.
        </p>
        <Button variant="outline" className="w-full" asChild>
          <Link href="/login">{t("auth_login")}</Link>
        </Button>
      </div>
    </div>
  )
}
