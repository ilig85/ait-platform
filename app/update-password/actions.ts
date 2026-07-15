"use server"

import { cookies } from "next/headers"
import { RECOVERY_COOKIE_NAME } from "@/lib/supabase/recovery"
import { createClient } from "@/lib/supabase/server"

export type UpdateRecoveryPasswordResult =
  | { status: "success" }
  | { status: "error"; message: string }

export async function updateRecoveryPassword(
  password: string,
  confirmation: string
): Promise<UpdateRecoveryPasswordResult> {
  if (password.length < 8) {
    return {
      status: "error",
      message: "Password must be at least 8 characters.",
    }
  }

  if (password !== confirmation) {
    return { status: "error", message: "Passwords do not match." }
  }

  const supabase = await createClient()
  const {
    data: { user },
    error: userError,
  } = await supabase.auth.getUser()
  const cookieStore = await cookies()
  const recoveryUserId = cookieStore.get(RECOVERY_COOKIE_NAME)?.value

  if (userError || !user || recoveryUserId !== user.id) {
    return {
      status: "error",
      message:
        "Your recovery session is missing or expired. Request a new password-reset link.",
    }
  }

  const { error: updateError } = await supabase.auth.updateUser({ password })

  if (updateError) {
    return { status: "error", message: updateError.message }
  }

  cookieStore.set(RECOVERY_COOKIE_NAME, "", {
    httpOnly: true,
    maxAge: 0,
    path: "/update-password",
    sameSite: "lax",
    secure: process.env.NODE_ENV === "production",
  })

  const { error: signOutError } = await supabase.auth.signOut({ scope: "local" })

  if (signOutError) {
    return {
      status: "error",
      message: `Password updated, but the recovery session could not be cleared: ${signOutError.message}`,
    }
  }

  return { status: "success" }
}
