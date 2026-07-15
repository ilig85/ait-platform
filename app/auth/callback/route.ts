import type { EmailOtpType } from "@supabase/supabase-js"
import { type NextRequest, NextResponse } from "next/server"
import { createClient } from "@/lib/supabase/server"
import {
  RECOVERY_COOKIE_MAX_AGE_SECONDS,
  RECOVERY_COOKIE_NAME,
} from "@/lib/supabase/recovery"
import { sanitizeRedirectPath } from "@/lib/site-url"

const EMAIL_OTP_TYPES = [
  "signup",
  "invite",
  "magiclink",
  "recovery",
  "email_change",
  "email",
] as const

function parseEmailOtpType(value: string | null): EmailOtpType | null {
  return value && EMAIL_OTP_TYPES.some((type) => type === value)
    ? (value as EmailOtpType)
    : null
}

function redirectToPath(request: NextRequest, path: string) {
  const safePath = sanitizeRedirectPath(path, "/")
  const destination = new URL(safePath, request.nextUrl.origin)

  return NextResponse.redirect(destination)
}

function redirectToAuthError(request: NextRequest, reason: string) {
  const destination = new URL("/auth/error", request.nextUrl.origin)
  destination.searchParams.set("reason", reason)

  return NextResponse.redirect(destination)
}

function redirectToRecovery(request: NextRequest, userId: string) {
  const response = redirectToPath(request, "/update-password")

  response.cookies.set(RECOVERY_COOKIE_NAME, userId, {
    httpOnly: true,
    maxAge: RECOVERY_COOKIE_MAX_AGE_SECONDS,
    path: "/update-password",
    sameSite: "lax",
    secure: request.nextUrl.protocol === "https:",
  })

  return response
}

export async function GET(request: NextRequest) {
  const { searchParams } = request.nextUrl
  const code = searchParams.get("code")
  const tokenHash = searchParams.get("token_hash")
  const type = parseEmailOtpType(searchParams.get("type"))
  const isRecovery =
    searchParams.get("flow") === "recovery" || type === "recovery"
  const safeNext = sanitizeRedirectPath(searchParams.get("next"), "/")
  const supabase = await createClient()

  if (code) {
    const { data, error } = await supabase.auth.exchangeCodeForSession(code)

    if (!error) {
      if (isRecovery && data.user) {
        return redirectToRecovery(request, data.user.id)
      }

      return redirectToPath(request, safeNext)
    }

    return redirectToAuthError(
      request,
      isRecovery ? "recovery_code_invalid" : "auth_code_invalid"
    )
  }

  if (tokenHash && type) {
    const { data, error } = await supabase.auth.verifyOtp({
      token_hash: tokenHash,
      type,
    })

    if (!error) {
      if (isRecovery && data.user) {
        return redirectToRecovery(request, data.user.id)
      }

      return redirectToPath(request, safeNext)
    }

    if (type === "signup" || type === "email") {
      return redirectToPath(
        request,
        "/login?message=email_confirmation_failed"
      )
    }

    return redirectToAuthError(
      request,
      isRecovery ? "recovery_token_invalid" : "auth_token_invalid"
    )
  }

  return redirectToAuthError(
    request,
    isRecovery ? "recovery_parameters_missing" : "auth_parameters_missing"
  )
}
