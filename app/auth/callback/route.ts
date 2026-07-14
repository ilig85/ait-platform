import { NextResponse } from "next/server"
import { createClient } from "@/lib/supabase/server"

export async function GET(request: Request) {
  const { searchParams, origin } = new URL(request.url)
  const code = searchParams.get("code")
  const tokenHash = searchParams.get("token_hash")
  const type = searchParams.get("type") as "recovery" | "signup" | "email" | null
  const next = searchParams.get("next") ?? "/"

  // Block open redirects — only allow safe internal paths
  const safeNext =
    next.startsWith("/") && !next.startsWith("//") ? next : "/"

  const supabase = await createClient()

  if (code) {
    // PKCE flow (magic link / OAuth)
    const { error } = await supabase.auth.exchangeCodeForSession(code)
    if (!error) {
      return NextResponse.redirect(`${origin}${safeNext}`)
    }
  } else if (tokenHash && type) {
    // Token-hash flow (password recovery emails, email OTP confirm links)
    const { error } = await supabase.auth.verifyOtp({ token_hash: tokenHash, type })
    if (!error) {
      return NextResponse.redirect(`${origin}${safeNext}`)
    }
  }

  return NextResponse.redirect(`${origin}/auth/error`)
}
