"use client"

import { useState, useTransition, Suspense } from "react"
import Link from "next/link"
import { useRouter, useSearchParams } from "next/navigation"
import { Zap, CheckCircle2, Shield, MessageSquare, Globe } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Checkbox } from "@/components/ui/checkbox"
import { useI18n, LOCALES, type Locale } from "@/lib/i18n"
import { cn } from "@/lib/utils"
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from "@/components/ui/dropdown-menu"
import { ChevronDown, Loader2 } from "lucide-react"
import { createClient } from "@/lib/supabase/client"
import { sanitizeRedirectPath } from "@/lib/site-url"

// Wrap the actual form in its own component so useSearchParams() is inside a Suspense boundary
function LoginForm() {
  const { t, locale, setLocale } = useI18n()
  const router = useRouter()
  const searchParams = useSearchParams()
  const redirectTo = sanitizeRedirectPath(searchParams.get("redirectTo"), "/")
  const confirmed = searchParams.get("confirmed") === "1"
  const confirmFailed = searchParams.get("message") === "email_confirmation_failed"
  const [email, setEmail] = useState("")
  const [password, setPassword] = useState("")
  const [remember, setRemember] = useState(false)
  const [error, setError] = useState("")
  const [isPending, startTransition] = useTransition()

  function handleLogin(e: React.FormEvent) {
    e.preventDefault()
    setError("")

    startTransition(async () => {
      const supabase = createClient()
      const { error } = await supabase.auth.signInWithPassword({ email, password })
      if (error) {
        setError(error.message)
        return
      }
      router.push(redirectTo)
      router.refresh()
    })
  }

  function handleDemo() {
    router.push("/")
  }

  return (
    <div className="min-h-screen bg-background flex">
      {/* Left panel */}
      <div className="hidden lg:flex lg:w-1/2 bg-[#15253D] flex-col justify-between p-12">
        <div>
          <div className="flex items-center gap-3 mb-12">
            <div className="w-10 h-10 rounded-xl bg-[#0F766E] flex items-center justify-center">
              <Zap className="w-5 h-5 text-white" />
            </div>
            <span className="text-white font-bold text-2xl tracking-tight">AIT</span>
          </div>
          <h2 className="text-white text-3xl font-bold leading-snug text-balance mb-4">
            {t("auth_tagline")}
          </h2>
          <p className="text-white/60 text-base mb-10">
            {t("auth_trust")}
          </p>
          <div className="space-y-4">
            {[t("auth_benefit_1"), t("auth_benefit_2"), t("auth_benefit_3")].map((b) => (
              <div key={b} className="flex items-start gap-3">
                <CheckCircle2 className="w-5 h-5 text-[#0F766E] mt-0.5 flex-shrink-0" />
                <p className="text-white/80 text-sm">{b}</p>
              </div>
            ))}
          </div>
        </div>
        <div className="flex items-center gap-6 text-white/30 text-xs">
          <div className="flex items-center gap-1.5"><MessageSquare className="w-3.5 h-3.5" /> WhatsApp</div>
          <div className="flex items-center gap-1.5"><Globe className="w-3.5 h-3.5" /> KY · RU · EN</div>
          <div className="flex items-center gap-1.5"><Shield className="w-3.5 h-3.5" /> GDPR-ready</div>
        </div>
      </div>

      {/* Right panel */}
      <div className="flex-1 flex flex-col items-center justify-center p-6">
        {/* Mobile logo */}
        <div className="flex items-center gap-2 mb-8 lg:hidden">
          <div className="w-8 h-8 rounded-lg bg-[#0F766E] flex items-center justify-center">
            <Zap className="w-4 h-4 text-white" />
          </div>
          <span className="font-bold text-xl text-[#15253D]">AIT</span>
        </div>

        <div className="w-full max-w-sm">
          <div className="flex items-center justify-between mb-6">
            <div>
              <h1 className="text-2xl font-bold text-foreground">{t("auth_login")}</h1>
              <p className="text-sm text-muted-foreground mt-1">{t("auth_no_account")}{" "}
                <Link href="/signup" className="text-primary font-medium hover:underline">{t("auth_signup")}</Link>
              </p>
            </div>
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="outline" size="sm" className="h-8 px-2 text-xs font-semibold gap-1">
                  {locale.toUpperCase()}<ChevronDown className="w-3 h-3" />
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end" className="w-32">
                {LOCALES.map((l) => (
                  <DropdownMenuItem key={l.value} onClick={() => setLocale(l.value as Locale)} className={cn("gap-2 cursor-pointer", locale === l.value && "font-medium")}>
                    <span className="text-xs font-mono text-muted-foreground w-6">{l.flag}</span>{l.label}
                  </DropdownMenuItem>
                ))}
              </DropdownMenuContent>
            </DropdownMenu>
          </div>

          <form onSubmit={handleLogin} className="space-y-4">
            <div className="space-y-1.5">
              <Label htmlFor="email">{t("auth_email")}</Label>
              <Input
                id="email" type="email" autoComplete="email"
                placeholder="name@business.kg"
                value={email} onChange={(e) => setEmail(e.target.value)}
                className={cn(error && "border-destructive")}
                required
              />
            </div>
            <div className="space-y-1.5">
              <div className="flex items-center justify-between">
                <Label htmlFor="password">{t("auth_password")}</Label>
                <Link href="/forgot-password" className="text-xs text-primary hover:underline">{t("auth_forgot_password")}</Link>
              </div>
              <Input
                id="password" type="password" autoComplete="current-password"
                placeholder="••••••••"
                value={password} onChange={(e) => setPassword(e.target.value)}
                className={cn(error && "border-destructive")}
                required
              />
            </div>
            <div className="flex items-center gap-2">
              <Checkbox id="remember" checked={remember} onCheckedChange={(v) => setRemember(!!v)} />
              <Label htmlFor="remember" className="text-sm font-normal cursor-pointer">{t("auth_remember_me")}</Label>
            </div>
            {confirmed && (
              <p className="text-sm text-[#0F766E] bg-[#0F766E]/10 rounded-md px-3 py-2">
                Email confirmed successfully. Sign in with your email and password to continue.
              </p>
            )}
            {confirmFailed && (
              <p className="text-sm text-amber-700 bg-amber-50 border border-amber-200 rounded-md px-3 py-2">
                Your email may already be confirmed. Try signing in. If that does not work, request a new confirmation email.
              </p>
            )}
            {error && <p className="text-sm text-destructive">{error}</p>}
            <Button type="submit" className="w-full bg-[#0F766E] hover:bg-[#0F766E]/90 text-white" disabled={isPending}>
              {isPending && <Loader2 className="w-4 h-4 animate-spin mr-1" />}
              {isPending ? t("auth_logging_in") : t("auth_login")}
            </Button>
          </form>

          <div className="relative my-4">
            <div className="absolute inset-0 flex items-center"><div className="w-full border-t" /></div>
            <div className="relative flex justify-center"><span className="bg-background px-3 text-xs text-muted-foreground">or</span></div>
          </div>

          <Button variant="outline" className="w-full text-sm" onClick={handleDemo}>
            {t("auth_demo_explore")}
          </Button>

          <p className="text-center text-xs text-muted-foreground mt-6">
            <Link href="/terms" className="hover:underline">{t("auth_terms")}</Link>
            {" · "}
            <Link href="/privacy" className="hover:underline">{t("auth_privacy")}</Link>
          </p>
        </div>
      </div>
    </div>
  )
}

export default function LoginPage() {
  return (
    <Suspense>
      <LoginForm />
    </Suspense>
  )
}
