"use client"

import { useEffect, useState, useTransition } from "react"
import { useRouter } from "next/navigation"
import { Eye, EyeOff, Loader2, AlertTriangle } from "lucide-react"
import { createClient } from "@/lib/supabase/client"
import { AitLogo } from "@/components/brand/ait-logo"
import { Mascot } from "@/components/brand/mascot"
import Link from "next/link"

type PageState = "loading" | "ready" | "invalid" | "success"

export default function UpdatePasswordPage() {
  const router = useRouter()
  const [pageState, setPageState] = useState<PageState>("loading")
  const [password, setPassword] = useState("")
  const [confirm, setConfirm] = useState("")
  const [showPw, setShowPw] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [isPending, startTransition] = useTransition()

  useEffect(() => {
    // Listen for the PASSWORD_RECOVERY event which fires after the recovery
    // session is established via /auth/callback
    const supabase = createClient()
    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      (event) => {
        if (event === "PASSWORD_RECOVERY") {
          setPageState("ready")
        }
      }
    )

    // Also check if a recovery session already exists (e.g. page refresh)
    supabase.auth.getSession().then(({ data: { session } }) => {
      if (session) {
        setPageState("ready")
      } else {
        // Wait briefly for the auth state change; if none arrives, show invalid
        const timeout = setTimeout(() => {
          setPageState((s) => (s === "loading" ? "invalid" : s))
        }, 2000)
        return () => clearTimeout(timeout)
      }
    })

    return () => subscription.unsubscribe()
  }, [])

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    setError(null)

    if (password.length < 8) {
      setError("Password must be at least 8 characters.")
      return
    }
    if (password !== confirm) {
      setError("Passwords do not match.")
      return
    }

    startTransition(async () => {
      const supabase = createClient()
      const { error } = await supabase.auth.updateUser({ password })
      if (error) {
        setError(error.message)
        return
      }
      setPageState("success")
      setTimeout(() => router.push("/"), 2500)
    })
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-background px-4">
      <div className="w-full max-w-sm">
        {/* Logo */}
        <div className="flex items-center gap-2 mb-8">
          <AitLogo variant="wordmark" theme="light" size="md" label="AIT" />
        </div>

        <div className="bg-card border border-border rounded-2xl p-8 shadow-sm">
          {pageState === "loading" && (
            <div className="text-center py-4">
              <Loader2 className="w-8 h-8 animate-spin text-muted-foreground mx-auto mb-3" />
              <p className="text-sm text-muted-foreground">Validating recovery link…</p>
            </div>
          )}

          {pageState === "invalid" && (
            <div className="text-center">
              <AlertTriangle className="w-10 h-10 text-destructive mx-auto mb-3" />
              <h1 className="text-xl font-semibold text-foreground mb-2">Link invalid or expired</h1>
              <p className="text-sm text-muted-foreground mb-6">
                This password-reset link has expired or has already been used. Request a new one.
              </p>
              <Link
                href="/forgot-password"
                className="inline-flex w-full items-center justify-center px-4 py-2.5 bg-primary text-primary-foreground text-sm font-medium rounded-lg hover:bg-primary/90 transition"
              >
                Request new link
              </Link>
            </div>
          )}

          {pageState === "success" && (
            <div className="text-center">
              <Mascot pose="welcome" width={96} height={96} className="mx-auto mb-3" />
              <h1 className="text-xl font-semibold text-foreground mb-2">Password updated</h1>
              <p className="text-sm text-muted-foreground">Redirecting you to the dashboard…</p>
            </div>
          )}

          {pageState === "ready" && (
            <>
              <h1 className="text-xl font-semibold text-foreground mb-1">Set new password</h1>
              <p className="text-sm text-muted-foreground mb-6">Choose a strong password for your account.</p>

              {error && (
                <div className="mb-4 px-4 py-3 bg-destructive/10 border border-destructive/20 rounded-lg text-sm text-destructive">
                  {error}
                </div>
              )}

              <form onSubmit={handleSubmit} className="flex flex-col gap-4">
                <div className="flex flex-col gap-1.5">
                  <label htmlFor="password" className="text-sm font-medium text-foreground">
                    New password
                  </label>
                  <div className="relative">
                    <input
                      id="password"
                      type={showPw ? "text" : "password"}
                      autoComplete="new-password"
                      required
                      minLength={8}
                      value={password}
                      onChange={(e) => setPassword(e.target.value)}
                      placeholder="Min. 8 characters"
                      className="w-full px-3 py-2.5 pr-10 text-sm bg-background border border-border rounded-lg text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-primary/40 transition"
                    />
                    <button
                      type="button"
                      onClick={() => setShowPw((v) => !v)}
                      className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground transition"
                      aria-label={showPw ? "Hide password" : "Show password"}
                    >
                      {showPw ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                    </button>
                  </div>
                </div>

                <div className="flex flex-col gap-1.5">
                  <label htmlFor="confirm" className="text-sm font-medium text-foreground">
                    Confirm password
                  </label>
                  <input
                    id="confirm"
                    type={showPw ? "text" : "password"}
                    autoComplete="new-password"
                    required
                    value={confirm}
                    onChange={(e) => setConfirm(e.target.value)}
                    placeholder="Repeat password"
                    className="w-full px-3 py-2.5 text-sm bg-background border border-border rounded-lg text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-primary/40 transition"
                  />
                </div>

                <button
                  type="submit"
                  disabled={isPending}
                  className="w-full flex items-center justify-center gap-2 py-2.5 bg-primary text-primary-foreground rounded-lg text-sm font-medium hover:bg-primary/90 disabled:opacity-60 transition"
                >
                  {isPending && <Loader2 className="w-4 h-4 animate-spin" />}
                  {isPending ? "Saving…" : "Update password"}
                </button>
              </form>
            </>
          )}
        </div>
      </div>
    </div>
  )
}
