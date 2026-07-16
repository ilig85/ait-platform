"use client"

import { useState, useTransition } from "react"
import Link from "next/link"
import { Loader2 } from "lucide-react"
import { AitLogo } from "@/components/brand/ait-logo"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { useI18n } from "@/lib/i18n"
import { createClient } from "@/lib/supabase/client"

export default function ForgotPasswordPage() {
  const { t } = useI18n()
  const [email, setEmail] = useState("")
  const [sent, setSent] = useState(false)
  const [error, setError] = useState("")
  const [isPending, startTransition] = useTransition()

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    setError("")

    startTransition(async () => {
      const supabase = createClient()
      const { error } = await supabase.auth.resetPasswordForEmail(email, {
        redirectTo: `${window.location.origin}/auth/callback?next=/update-password`,
      })
      if (error) {
        setError(error.message)
        return
      }
      setSent(true)
    })
  }

  return (
    <div className="min-h-screen bg-background flex items-center justify-center p-6">
      <div className="w-full max-w-sm">
        <div className="flex items-center gap-2 mb-8">
          <AitLogo variant="wordmark" theme="light" size="md" label="AIT" />
        </div>
        {sent ? (
          <div className="text-center">
            <h1 className="text-2xl font-bold mb-2">Check your email</h1>
            <p className="text-muted-foreground text-sm mb-6">If that email exists, we sent a password reset link.</p>
            <Button variant="outline" className="w-full" asChild>
              <Link href="/login">{t("auth_login")}</Link>
            </Button>
          </div>
        ) : (
          <>
            <h1 className="text-2xl font-bold mb-1">{t("auth_forgot_password")}</h1>
            <p className="text-muted-foreground text-sm mb-6">Enter your email and we&apos;ll send a reset link.</p>
            <form onSubmit={handleSubmit} className="space-y-4">
              <div className="space-y-1.5">
                <Label htmlFor="email">{t("auth_email")}</Label>
                <Input id="email" type="email" placeholder="name@business.kg" value={email} onChange={(e) => setEmail(e.target.value)} required />
              </div>
              {error && <p className="text-sm text-destructive">{error}</p>}
              <Button type="submit" className="w-full bg-[#2DE2B1] hover:bg-[#25c99e] text-[#071A1B] font-semibold" disabled={isPending}>
                {isPending && <Loader2 className="w-4 h-4 animate-spin mr-1" />}
                {isPending ? "Sending…" : "Send reset link"}
              </Button>
              <Button variant="ghost" className="w-full" asChild>
                <Link href="/login">{t("common_back")}</Link>
              </Button>
            </form>
          </>
        )}
      </div>
    </div>
  )
}
