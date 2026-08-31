"use client"

import { Suspense, useState, useTransition } from "react"
import Link from "next/link"
import { useRouter, useSearchParams } from "next/navigation"
import { CheckCircle2, ChevronDown, Loader2 } from "lucide-react"
import { AitLogo } from "@/components/brand/ait-logo"
import { Button } from "@/components/ui/button"
import { Checkbox } from "@/components/ui/checkbox"
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from "@/components/ui/dropdown-menu"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { getAuthErrorMessage } from "@/lib/auth/client-error"
import { getSafeInternalRedirect } from "@/lib/auth/redirect"
import { useI18n, LOCALES, type Locale } from "@/lib/i18n"
import { createClient } from "@/lib/supabase/client"
import { cn } from "@/lib/utils"

function LoginForm() {
  const { t, locale, setLocale } = useI18n()
  const router = useRouter()
  const searchParams = useSearchParams()
  const redirectTo = getSafeInternalRedirect(searchParams.get("redirectTo"), "/dashboard")
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
      try {
        const supabase = createClient()
        const { error: authError } = await supabase.auth.signInWithPassword({ email, password })
        if (authError) {
          setError(getAuthErrorMessage(authError))
          return
        }
        router.push(redirectTo)
        router.refresh()
      } catch (authError) {
        setError(getAuthErrorMessage(authError))
      }
    })
  }

  return (
    <main id="main-content" className="relative min-h-screen overflow-hidden bg-[#F6F1E7] px-5 py-8 lg:grid lg:place-items-center">
      <div aria-hidden="true" className="absolute -left-24 -top-20 h-64 w-64 rounded-full bg-[#F0A35B]/30" />
      <div aria-hidden="true" className="absolute -bottom-32 -right-20 h-80 w-80 rounded-full bg-[#C8DECF]" />

      <div className="relative mx-auto grid w-full max-w-5xl overflow-hidden rounded-[2rem] border border-[#173E3C]/10 bg-[#FFFDF8] shadow-[0_30px_90px_rgba(23,62,60,.13)] lg:grid-cols-[.9fr_1.1fr]">
        <section className="relative hidden min-h-[650px] flex-col justify-between overflow-hidden bg-[#DDE9DD] p-10 lg:flex">
          <AitLogo variant="wordmark" theme="light" size="md" />
          <div className="relative z-10">
            <p className="text-sm font-extrabold uppercase tracking-[.15em] text-[#D17E3A]">Welcome back</p>
            <h2 className="mt-4 text-5xl font-semibold leading-[.98] tracking-[-.055em] text-[#173E3C]">Your customers kept talking. AIT kept everything organized.</h2>
            <div className="mt-8 space-y-3 text-sm font-semibold text-[#44645D]">
              {[t("auth_benefit_1"), t("auth_benefit_2"), t("auth_benefit_3")].map((benefit) => (
                <div key={benefit} className="flex items-start gap-2.5"><CheckCircle2 className="mt-0.5 h-4 w-4 shrink-0 text-[#5E9C7E]" />{benefit}</div>
              ))}
            </div>
          </div>
          <img src="/ait-logo-icon.svg" alt="AIT frog mascot" className="absolute -bottom-12 -right-6 h-48 w-60 rotate-[-5deg] object-contain" />
        </section>

        <section className="flex min-h-[650px] items-center p-6 sm:p-10 lg:p-14">
          <div className="mx-auto w-full max-w-sm">
            <div className="mb-10 flex items-center justify-between lg:hidden"><AitLogo variant="wordmark" theme="light" size="md" /></div>

            <div className="mb-8 flex items-start justify-between gap-4">
              <div>
                <h1 className="text-4xl font-extrabold tracking-[-.045em]">{t("auth_login")}</h1>
                <p className="mt-2 text-sm text-[#6A817B]">{t("auth_no_account")} <Link href="/signup" className="font-bold text-[#4F8B70] hover:underline">{t("auth_signup")}</Link></p>
              </div>
              <DropdownMenu>
                <DropdownMenuTrigger asChild><Button variant="outline" size="sm" className="h-9 rounded-full px-3 text-xs font-bold">{locale.toUpperCase()}<ChevronDown className="h-3 w-3" /></Button></DropdownMenuTrigger>
                <DropdownMenuContent align="end" className="w-36">
                  {LOCALES.map((language) => <DropdownMenuItem key={language.value} onClick={() => setLocale(language.value as Locale)} className={cn("cursor-pointer gap-2", locale === language.value && "font-bold")}><span>{language.flag}</span>{language.label}</DropdownMenuItem>)}
                </DropdownMenuContent>
              </DropdownMenu>
            </div>

            <form onSubmit={handleLogin} className="space-y-5">
              <div className="space-y-2"><Label htmlFor="email">{t("auth_email")}</Label><Input id="email" type="email" autoComplete="email" placeholder="name@business.kg" value={email} onChange={(e) => setEmail(e.target.value)} className={cn("h-12", error && "border-destructive")} required /></div>
              <div className="space-y-2">
                <div className="flex items-center justify-between"><Label htmlFor="password">{t("auth_password")}</Label><Link href="/forgot-password" className="text-xs font-bold text-[#4F8B70] hover:underline">{t("auth_forgot_password")}</Link></div>
                <Input id="password" type="password" autoComplete="current-password" placeholder="••••••••" value={password} onChange={(e) => setPassword(e.target.value)} className={cn("h-12", error && "border-destructive")} required />
              </div>
              <div className="flex items-center gap-2"><Checkbox id="remember" checked={remember} onCheckedChange={(value) => setRemember(Boolean(value))} /><Label htmlFor="remember" className="cursor-pointer text-sm font-normal">{t("auth_remember_me")}</Label></div>
              {confirmed && <p className="rounded-xl bg-[#DDE9DD] px-3 py-2.5 text-sm text-[#365D4A]">Email confirmed successfully. Sign in to continue.</p>}
              {confirmFailed && <p className="rounded-xl border border-[#E7B86B] bg-[#F9E7C9] px-3 py-2.5 text-sm text-[#76501D]">Your email may already be confirmed. Try signing in or request a new confirmation email.</p>}
              {error && <p className="rounded-xl bg-[#F8E1DE] px-3 py-2.5 text-sm leading-5 text-[#A3443D]">{error}</p>}
              <Button type="submit" className="h-12 w-full rounded-full bg-[#173E3C] font-bold text-white hover:bg-[#245451]" disabled={isPending}>{isPending && <Loader2 className="mr-1 h-4 w-4 animate-spin" />}{isPending ? t("auth_logging_in") : t("auth_login")}</Button>
            </form>

            <div className="relative my-6"><div className="absolute inset-0 flex items-center"><div className="w-full border-t" /></div><div className="relative flex justify-center"><span className="bg-[#FFFDF8] px-3 text-xs text-[#78908A]">or</span></div></div>
            <Button variant="outline" className="h-12 w-full rounded-full text-sm font-bold" onClick={() => router.push("/demo")}>{t("auth_demo_explore")}</Button>
            <p className="mt-7 text-center text-xs text-[#78908A]"><Link href="/terms" className="hover:underline">{t("auth_terms")}</Link>{" · "}<Link href="/privacy" className="hover:underline">{t("auth_privacy")}</Link></p>
          </div>
        </section>
      </div>
    </main>
  )
}

export default function LoginPage() {
  return <Suspense><LoginForm /></Suspense>
}
