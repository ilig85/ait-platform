import Link from "next/link"
import { AlertTriangle } from "lucide-react"

const RECOVERY_ERRORS: Record<string, { title: string; message: string }> = {
  recovery_code_invalid: {
    title: "Reset link could not be verified",
    message:
      "This PKCE reset link is invalid, expired, already used, or was opened in a different browser or device. Request a new link on the device where you will open it.",
  },
  recovery_token_invalid: {
    title: "Reset link invalid or expired",
    message:
      "This reset link has expired, was already used, or is invalid. Request a new link and use the newest email.",
  },
  recovery_parameters_missing: {
    title: "Reset link is incomplete",
    message:
      "This reset link is missing its verification information. Request a new link on the device where you will open it.",
  },
}

export default async function AuthErrorPage({
  searchParams,
}: {
  searchParams: Promise<{ reason?: string | string[] }>
}) {
  const reasonParam = (await searchParams).reason
  const reason = Array.isArray(reasonParam) ? reasonParam[0] : reasonParam
  const recoveryError = reason ? RECOVERY_ERRORS[reason] : undefined
  const title = recoveryError?.title ?? "Authentication error"
  const message =
    recoveryError?.message ??
    "Something went wrong during sign in. The link may have expired or already been used."
  const actionHref = recoveryError ? "/forgot-password" : "/login"
  const actionLabel = recoveryError ? "Request new reset link" : "Back to login"

  return (
    <div className="min-h-screen flex items-center justify-center bg-background px-4">
      <div className="w-full max-w-md text-center">
        <div className="flex justify-center mb-4">
          <div className="w-14 h-14 rounded-full bg-destructive/10 flex items-center justify-center">
            <AlertTriangle className="w-7 h-7 text-destructive" />
          </div>
        </div>
        <h1 className="text-2xl font-bold text-foreground mb-2">{title}</h1>
        <p className="text-muted-foreground mb-6 text-sm">
          {message}
        </p>
        <Link
          href={actionHref}
          className="inline-flex items-center justify-center px-5 py-2.5 bg-primary text-primary-foreground rounded-lg text-sm font-medium hover:bg-primary/90 transition-colors"
        >
          {actionLabel}
        </Link>
      </div>
    </div>
  )
}
