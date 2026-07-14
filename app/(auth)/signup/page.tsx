"use client"

import { useState } from "react"
import Link from "next/link"
import { useRouter } from "next/navigation"
import { Zap } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { useI18n, LOCALES, type Locale } from "@/lib/i18n"
import { cn } from "@/lib/utils"
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from "@/components/ui/dropdown-menu"
import { ChevronDown } from "lucide-react"

export default function SignupPage() {
  const { t, locale, setLocale } = useI18n()
  const router = useRouter()
  const [name, setName] = useState("")
  const [email, setEmail] = useState("")
  const [password, setPassword] = useState("")
  const [loading, setLoading] = useState(false)

  async function handleSignup(e: React.FormEvent) {
    e.preventDefault()
    setLoading(true)
    await new Promise((r) => setTimeout(r, 800))
    router.push("/verify-email")
  }

  return (
    <div className="min-h-screen bg-background flex items-center justify-center p-6">
      <div className="w-full max-w-sm">
        <div className="flex items-center gap-2 mb-8">
          <div className="w-8 h-8 rounded-lg bg-[#0F766E] flex items-center justify-center">
            <Zap className="w-4 h-4 text-white" />
          </div>
          <span className="font-bold text-xl text-[#15253D]">AIT</span>
        </div>

        <div className="flex items-center justify-between mb-6">
          <div>
            <h1 className="text-2xl font-bold text-foreground">{t("auth_signup")}</h1>
            <p className="text-sm text-muted-foreground mt-1">{t("auth_has_account")}{" "}
              <Link href="/login" className="text-primary font-medium hover:underline">{t("auth_login")}</Link>
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

        <form onSubmit={handleSignup} className="space-y-4">
          <div className="space-y-1.5">
            <Label htmlFor="name">Full name</Label>
            <Input id="name" type="text" placeholder="Айгерим Бекова" value={name} onChange={(e) => setName(e.target.value)} required />
          </div>
          <div className="space-y-1.5">
            <Label htmlFor="email">{t("auth_email")}</Label>
            <Input id="email" type="email" placeholder="name@business.kg" value={email} onChange={(e) => setEmail(e.target.value)} required />
          </div>
          <div className="space-y-1.5">
            <Label htmlFor="password">{t("auth_password")}</Label>
            <Input id="password" type="password" placeholder="min. 8 characters" value={password} onChange={(e) => setPassword(e.target.value)} required minLength={8} />
          </div>
          <Button type="submit" className="w-full bg-[#0F766E] hover:bg-[#0F766E]/90 text-white" disabled={loading}>
            {loading ? "Creating account..." : t("auth_signup")}
          </Button>
        </form>

        <p className="text-center text-xs text-muted-foreground mt-6">
          <Link href="/terms" className="hover:underline">{t("auth_terms")}</Link>
          {" · "}
          <Link href="/privacy" className="hover:underline">{t("auth_privacy")}</Link>
        </p>
      </div>
    </div>
  )
}
