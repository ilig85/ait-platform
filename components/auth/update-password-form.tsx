"use client"

import { useEffect, useState, useTransition } from "react"
import { useRouter } from "next/navigation"
import {
  Eye,
  EyeOff,
  Loader2,
  CheckCircle2,
  AlertTriangle,
  Zap,
} from "lucide-react"
import Link from "next/link"
import { updateRecoveryPassword } from "@/app/update-password/actions"

type PageState = "ready" | "invalid" | "success"

export function UpdatePasswordForm({
  hasValidSession,
}: {
  hasValidSession: boolean
}) {
  const router = useRouter()
  const [pageState, setPageState] = useState<PageState>(
    hasValidSession ? "ready" : "invalid"
  )
  const [password, setPassword] = useState("")
  const [confirm, setConfirm] = useState("")
  const [showPw, setShowPw] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [isPending, startTransition] = useTransition()

  useEffect(() => {
    if (pageState !== "success") return

    const timeout = window.setTimeout(() => {
      router.replace("/login")
      router.refresh()
    }, 2500)

    return () => window.clearTimeout(timeout)
  }, [pageState, router])

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
      const result = await updateRecoveryPassword(password, confirm)

      if (result.status === "error") {
        setError(result.message)
        return
      }

      setPageState("success")
    })
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-background px-4">
      <div className="w-full max-w-sm">
        <div className="flex items-center gap-2 mb-8">
          <div className="w-8 h-8 rounded-lg bg-[#0F766E] flex items-center justify-center">
            <Zap className="w-4 h-4 text-white" />
          </div>
          <span className="font-bold text-xl text-[#15253D]">AIT</span>
        </div>

        <div className="bg-card border border-border rounded-2xl p-8 shadow-sm">
          {pageState === "invalid" && (
            <div className="text-center">
              <AlertTriangle className="w-10 h-10 text-destructive mx-auto mb-3" />
              <h1 className="text-xl font-semibold text-foreground mb-2">
                Recovery session missing or expired
              </h1>
              <p className="text-sm text-muted-foreground mb-6">
                Request a new reset link on the device where you will open it. Standard PKCE links must be opened in the same browser and device that requested them.
              </p>
              <Link
                href="/forgot-password"
                className="inline-flex w-full items-center justify-center px-4 py-2.5 bg-[#0F766E] text-white text-sm font-medium rounded-lg hover:bg-[#0F766E]/90 transition"
              >
                Request new link
              </Link>
            </div>
          )}

          {pageState === "success" && (
            <div className="text-center">
              <CheckCircle2 className="w-10 h-10 text-emerald-500 mx-auto mb-3" />
              <h1 className="text-xl font-semibold text-foreground mb-2">
                Password updated
              </h1>
              <p className="text-sm text-muted-foreground">
                Redirecting you to login…
              </p>
            </div>
          )}

          {pageState === "ready" && (
            <>
              <h1 className="text-xl font-semibold text-foreground mb-1">
                Set new password
              </h1>
              <p className="text-sm text-muted-foreground mb-6">
                Choose a strong password for your account.
              </p>

              {error && (
                <div className="mb-4 px-4 py-3 bg-destructive/10 border border-destructive/20 rounded-lg text-sm text-destructive">
                  {error}
                </div>
              )}

              <form onSubmit={handleSubmit} className="flex flex-col gap-4">
                <div className="flex flex-col gap-1.5">
                  <label
                    htmlFor="password"
                    className="text-sm font-medium text-foreground"
                  >
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
                      onClick={() => setShowPw((value) => !value)}
                      className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground transition"
                      aria-label={showPw ? "Hide password" : "Show password"}
                    >
                      {showPw ? (
                        <EyeOff className="w-4 h-4" />
                      ) : (
                        <Eye className="w-4 h-4" />
                      )}
                    </button>
                  </div>
                </div>

                <div className="flex flex-col gap-1.5">
                  <label
                    htmlFor="confirm"
                    className="text-sm font-medium text-foreground"
                  >
                    Confirm password
                  </label>
                  <input
                    id="confirm"
                    type={showPw ? "text" : "password"}
                    autoComplete="new-password"
                    required
                    minLength={8}
                    value={confirm}
                    onChange={(e) => setConfirm(e.target.value)}
                    placeholder="Repeat password"
                    className="w-full px-3 py-2.5 text-sm bg-background border border-border rounded-lg text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-primary/40 transition"
                  />
                </div>

                <button
                  type="submit"
                  disabled={isPending}
                  className="w-full flex items-center justify-center gap-2 py-2.5 bg-[#0F766E] text-white rounded-lg text-sm font-medium hover:bg-[#0F766E]/90 disabled:opacity-60 transition"
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
