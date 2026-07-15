"use client"

import { useEffect, useState, useTransition } from "react"
import { Zap, Loader2, Mail, RotateCcw } from "lucide-react"
import { cn } from "@/lib/utils"
import { createClient } from "@/lib/supabase/client"
import Link from "next/link"

const RESEND_COOLDOWN = 60

export default function VerifyEmailPage() {
  const [email, setEmail] = useState<string>("")
  const [error, setError] = useState<string>("")
  const [resent, setResent] = useState(false)
  const [cooldown, setCooldown] = useState(0)
  const [isResending, startResend] = useTransition()

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

  function handleResend() {
    if (!email || cooldown > 0) return
    setError("")
    setResent(false)

    startResend(async () => {
      const supabase = createClient()
      const { error } = await supabase.auth.resend({
        type: "signup",
        email,
      })
      if (error) {
        if (error.status === 429) {
          setError("Too many resend requests. Please wait a while before trying again.")
        } else {
          setError(error.message)
        }
        return
      }
      setResent(true)
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
          We sent a confirmation link to{" "}
          <span className="font-medium text-foreground">
            {email || "your email address"}
          </span>
          . Click the link in the email to activate your account.
        </p>

        {/* Error state */}
        {error && <p className="text-sm text-destructive mb-4">{error}</p>}

        {/* Resent confirmation */}
        {resent && !error && (
          <p className="text-sm text-primary mb-4">Confirmation email resent.</p>
        )}

        {/* Resend */}
        <div className="text-sm text-muted-foreground">
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
              "Resend email"
            )}
          </button>
        </div>

        {/* Back to sign in */}
        <p className="mt-4 text-sm text-muted-foreground">
          <Link href="/login" className="text-primary font-medium hover:underline">
            Back to sign in
          </Link>
        </p>
      </div>
    </div>
  )
}
