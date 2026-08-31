"use client"

import { useState, useTransition } from "react"
import Link from "next/link"
import { useRouter } from "next/navigation"
import { CheckCircle2, ChevronDown, Loader2 } from "lucide-react"
import { AitLogo } from "@/components/brand/ait-logo"
import { Button } from "@/components/ui/button"
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from "@/components/ui/dropdown-menu"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { getAuthErrorMessage } from "@/lib/auth/client-error"
import { useI18n, LOCALES, type Locale } from "@/lib/i18n"
import { createClient } from "@/lib/supabase/client"
import { cn } from "@/lib/utils"

export default function SignupPage() {
  const { t, locale, setLocale } = useI18n()
  const router = useRouter()
  const [name, setName] = useState("")
  const [email, setEmail] = useState("")
  const [password, setPassword] = useState("")
  const [error, setError] = useState("")
  const [isPending, startTransition] = useTransition()

  function handleSignup(e: React.FormEvent) {
    e.preventDefault()
    setError("")

    startTransition(async () => {
      try {
        const supabase = createClient()
        const { data, error: authError } = await supabase.auth.signUp({
          email,
          password,
          options: { data: { full_name: name }, emailRedirectTo: `${window.location.origin}/login?confirmed=1` },
        })
        if (authError) {
          setError(authError.status === 429 ? "Too many signup emails were requested. Please wait about one hour and try again." : getAuthErrorMessage(authError))
          return
        }
        if (!data.user?.identities?.length) {
          setError("An account with this email already exists. Please log in instead.")
          return
        }
        sessionStorage.setItem("pending_verification_email", email)
        router.push("/verify-email")
      } catch (authError) {
        setError(getAuthErrorMessage(authError))
      }
    })
  }

  return (
    <main id="main-content" className="relative min-h-screen overflow-hidden bg-[#F6F1E7] px-5 py-8 lg:grid lg:place-items-center">
      <div aria-hidden="true" className="absolute -left-24 -top-20 h-64 w-64 rounded-full bg-[#C8DECF]" />
      <div aria-hidden="true" className="absolute -bottom-32 -right-20 h-80 w-80 rounded-full bg-[#F0A35B]/35" />

      <div className="relative mx-auto grid w-full max-w-5xl overflow-hidden rounded-[2rem] border border-[#173E3C]/10 bg-[#FFFDF8] shadow-[0_30px_90px_rgba(23,62,60,.13)] lg:grid-cols-[.9fr_1.1fr]">
        <section className="relative hidden min-h-[680px] flex-col justify-between overflow-hidden bg-[#F0A35B] p-10 text-[#3F2D1D] lg:flex">
          <AitLogo variant="wordmark" theme="light" size="md" />
          <div className="relative z-10">
            <p className="text-sm font-extrabold uppercase tracking-[.15em]">Start simple</p>
            <h2 className="mt-4 text-5xl font-semibold leading-[.98] tracking-[-.055em]">Give every customer a fast, useful answer.</h2>
            <div className="mt-8 space-y-3 text-sm font-bold">
              {["Connect your WhatsApp Business account", "Add prices, products, and common questions", "Choose which replies AIT can send automatically"].map((benefit) => <div key={benefit} className="flex items-start gap-2.5"><CheckCircle2 className="mt-0.5 h-4 w-4 shrink-0" />{benefit}</div>)}
            </div>
          </div>
          <div aria-hidden="true" className="absolute -bottom-24 -right-24 h-72 w-72 rounded-full bg-[#F6D18D]" />
          <img src="/ait-logo-icon.svg" alt="AIT frog mascot" className="absolute -bottom-10 -right-1 h-48 w-60 rotate-[4deg] object-contain" />
        </section>

        <section className="flex min-h-[680px] items-center p-6 sm:p-10 lg:p-14">
          <div className="mx-auto w-full max-w-sm">
            <div className="mb-10 lg:hidden"><AitLogo variant="wordmark" theme="light" size="md" /></div>
            <div className="mb-8 flex items-start justify-between gap-4">
              <div><h1 className="text-4xl font-extrabold tracking-[-.045em]">{t("auth_signup")}</h1><p className="mt-2 text-sm text-[#6A817B]">{t("auth_has_account")} <Link href="/login" className="font-bold text-[#4F8B70] hover:underline">{t("auth_login")}</Link></p></div>
              <DropdownMenu>
                <DropdownMenuTrigger asChild><Button variant="outline" size="sm" className="h-9 rounded-full px-3 text-xs font-bold">{locale.toUpperCase()}<ChevronDown className="h-3 w-3" /></Button></DropdownMenuTrigger>
                <DropdownMenuContent align="end" className="w-36">{LOCALES.map((language) => <DropdownMenuItem key={language.value} onClick={() => setLocale(language.value as Locale)} className={cn("cursor-pointer gap-2", locale === language.value && "font-bold")}><span>{language.flag}</span>{language.label}</DropdownMenuItem>)}</DropdownMenuContent>
              </DropdownMenu>
            </div>

            <form onSubmit={handleSignup} className="space-y-5">
              <div className="space-y-2"><Label htmlFor="name">Full name</Label><Input id="name" type="text" autoComplete="name" placeholder="Айгерим Бекова" value={name} onChange={(e) => setName(e.target.value)} className="h-12" required /></div>
              <div className="space-y-2"><Label htmlFor="email">{t("auth_email")}</Label><Input id="email" type="email" autoComplete="email" placeholder="name@business.kg" value={email} onChange={(e) => setEmail(e.target.value)} className="h-12" required /></div>
              <div className="space-y-2"><Label htmlFor="password">{t("auth_password")}</Label><Input id="password" type="password" autoComplete="new-password" placeholder="min. 8 characters" value={password} onChange={(e) => setPassword(e.target.value)} className="h-12" required minLength={8} /></div>
              {error && <p className="rounded-xl bg-[#F8E1DE] px-3 py-2.5 text-sm leading-5 text-[#A3443D]">{error}</p>}
              <Button type="submit" className="h-12 w-full rounded-full bg-[#173E3C] font-bold text-white hover:bg-[#245451]" disabled={isPending}>{isPending && <Loader2 className="mr-1 h-4 w-4 animate-spin" />}{isPending ? "Creating account…" : t("auth_signup")}</Button>
            </form>

            <p className="mt-7 text-center text-xs text-[#78908A]"><Link href="/terms" className="hover:underline">{t("auth_terms")}</Link>{" · "}<Link href="/privacy" className="hover:underline">{t("auth_privacy")}</Link></p>
          </div>
        </section>
      </div>
    </main>
  )
}
