"use client"

import { useEffect, useRef, useState, useTransition } from "react"
import { useRouter } from "next/navigation"
import { Zap, Loader2, Mail, RotateCcw } from "lucide-react"
import { Button } from "@/components/ui/button"
import { cn } from "@/lib/utils"
import { createClient } from "@/lib/supabase/client"
import Link from "next/link"

const CODE_LENGTH = 6
const RESEND_COOLDOWN = 60

function maskEmail(email: string): string {
  const [local, domain] = email.split("@")
  if (!domain) return email
  const visible = local.slice(0, 2)
  return `${visible}${"*".repeat(Math.max(local.length - 2, 3))}@${domain}`
}

export default function VerifyEmailPage() {
  const router = useRouter()
  const [email, setEmail] = useState<string>("")
  const [digits, setDigits] = useState<string[]>(Array(CODE_LENGTH).fill(""))
  const [error, setError] = useState<string>("")
  const [isExpired, setIsExpired] = useState(false)
  const [cooldown, setCooldown] = useState(0)
  const [isPending, startTransition] = useTransition()
  const [isResending, startResend] = useTransition()
  const inputRefs = useRef<(HTMLInputElement | null)[]>([])

  // Read the pending email written by the signup page (never contains password)
  useEffect(() => {
    const stored = sessionStorage.getItem("pending_verification_email") ?? ""
    setEmail(stored)
  }, [])

  // Resend cooldown ticker
  useEffect(() => {
    if (cooldown <= 0) return
    const id = setInterval(() => setCooldown((c) => Math.max(0, c - 1)), 1000)
    return () => clearInterval(id)
  }, [cooldown])

  function focusInput(index: number) {
    inputRefs.current[index]?.focus()
  }

  function handleDigitChange(index: number, value: string) {
    // Accept only digits
    const digit = value.replace(/\D/g, "").slice(-1)
    const next = [...digits]
    next[index] = digit
    setDigits(next)
    setError("")
    setIsExpired(false)
    if (digit && index < CODE_LENGTH - 1) focusInput(index + 1)
  }

  function handleKeyDown(index: number, e: React.KeyboardEvent<HTMLInputElement>) {
    if (e.key === "Backspace" && !digits[index] && index > 0) {
      focusInput(index - 1)
    }
    if (e.key === "ArrowLeft" && index > 0) focusInput(index - 1)
    if (e.key === "ArrowRight" && index < CODE_LENGTH - 1) focusInput(index + 1)
  }

  function handlePaste(e: React.ClipboardEvent) {
    e.preventDefault()
    const pasted = e.clipboardData.getData("text").replace(/\D/g, "").slice(0, CODE_LENGTH)
    if (!pasted) return
    const next = Array(CODE_LENGTH).fill("")
    pasted.split("").forEach((d, i) => { next[i] = d })
    setDigits(next)
    setError("")
    setIsExpired(false)
    focusInput(Math.min(pasted.length, CODE_LENGTH - 1))
  }

  const code = digits.join("")
  const isComplete = code.length === CODE_LENGTH

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    if (!isComplete || !email) return
    setError("")
    setIsExpired(false)

    startTransition(async () => {
      const supabase = createClient()
      const { data, error } = await supabase.auth.verifyOtp({
        email,
        token: code,
        type: "email",
      })
      if (error) {
        if (
          error.message.toLowerCase().includes("expired") ||
          error.message.toLowerCase().includes("otp has expired")
        ) {
          setIsExpired(true)
        } else {
          setError(error.message)
        }
        return
      }
      if (data.session) {
        sessionStorage.removeItem("pending_verification_email")
        router.push("/")
        router.refresh()
      }
    })
  }

  function handleResend() {
    if (!email || cooldown > 0) return
    setError("")
    setIsExpired(false)

    startResend(async () => {
      const supabase = createClient()
      const { error } = await supabase.auth.resend({
        type: "signup",
        email,
      })
      if (error) {
        setError(error.message)
        return
      }
      setCooldown(RESEND_COOLDOWN)
    })
  }

  return (
    <div className="min-h-screen bg-background flex items-center justify-center p-6">
      <div className="w-full max-w-sm">
        {/* Logo */}
        <div className="flex items-center gap-2 mb-8">
          <div className="w-8 h-8 rounded-lg bg-[#0F766E] flex items-center justify-center">
            <Zap className="w-4 h-4 text-white" />
          </div>
          <span className="font-bold text-xl text-[#15253D]">AIT</span>
        </div>

        {/* Icon */}
        <div className="w-14 h-14 rounded-full bg-primary/10 flex items-center justify-center mb-4">
          <Mail className="w-7 h-7 text-primary" />
        </div>

        <h1 className="text-2xl font-bold mb-1">Check your email</h1>
        <p className="text-sm text-muted-foreground mb-6">
          We sent a 6-digit verification code to{" "}
          <span className="font-medium text-foreground">
            {email ? maskEmail(email) : "your email address"}
          </span>
          . Enter it below to activate your account.
        </p>

        <form onSubmit={handleSubmit} className="space-y-5">
          {/* 6-digit input boxes */}
          <div className="flex gap-2 justify-between" onPaste={handlePaste}>
            {digits.map((digit, i) => (
              <input
                key={i}
                ref={(el) => { inputRefs.current[i] = el }}
                type="text"
                inputMode="numeric"
                autoComplete={i === 0 ? "one-time-code" : "off"}
                maxLength={1}
                value={digit}
                onChange={(e) => handleDigitChange(i, e.target.value)}
                onKeyDown={(e) => handleKeyDown(i, e)}
                className={cn(
                  "w-12 h-14 text-center text-xl font-bold rounded-lg border bg-background text-foreground",
                  "focus:outline-none focus:ring-2 focus:ring-[#0F766E]/50 focus:border-[#0F766E]",
                  "transition-all",
                  (error || isExpired) && "border-destructive"
                )}
              />
            ))}
          </div>

          {/* Error / expired states */}
          {isExpired && (
            <p className="text-sm text-destructive">
              This code has expired.{" "}
              <button
                type="button"
                onClick={handleResend}
                className="underline font-medium"
                disabled={cooldown > 0 || isResending}
              >
                Send a new one
              </button>
            </p>
          )}
          {error && !isExpired && (
            <p className="text-sm text-destructive">{error}</p>
          )}

          <Button
            type="submit"
            className="w-full bg-[#0F766E] hover:bg-[#0F766E]/90 text-white"
            disabled={!isComplete || isPending}
          >
            {isPending && <Loader2 className="w-4 h-4 animate-spin mr-1" />}
            {isPending ? "Verifying…" : "Verify email"}
          </Button>
        </form>

        {/* Resend */}
        <div className="mt-4 text-center text-sm text-muted-foreground">
          Didn&apos;t receive it?{" "}
          <button
            type="button"
            onClick={handleResend}
            disabled={cooldown > 0 || isResending || !email}
            className={cn(
              "font-medium",
              cooldown > 0 || isResending || !email
                ? "text-muted-foreground cursor-not-allowed"
                : "text-primary hover:underline cursor-pointer"
            )}
          >
            {isResending ? (
              <span className="inline-flex items-center gap-1">
                <Loader2 className="w-3 h-3 animate-spin" /> Sending…
              </span>
            ) : cooldown > 0 ? (
              <span className="inline-flex items-center gap-1">
                <RotateCcw className="w-3 h-3" /> Resend in {cooldown}s
              </span>
            ) : (
              "Resend code"
            )}
          </button>
        </div>

        {/* Back to signup */}
        <p className="mt-3 text-center text-sm text-muted-foreground">
          Wrong email?{" "}
          <Link href="/signup" className="text-primary font-medium hover:underline">
            Back to sign up
          </Link>
        </p>
      </div>
    </div>
  )
}
