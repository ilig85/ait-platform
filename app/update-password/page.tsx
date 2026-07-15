import { UpdatePasswordForm } from "@/components/auth/update-password-form"
import { RECOVERY_COOKIE_NAME } from "@/lib/supabase/recovery"
import { createClient } from "@/lib/supabase/server"
import { cookies } from "next/headers"

export default async function UpdatePasswordPage() {
  const supabase = await createClient()
  const {
    data: { user },
    error,
  } = await supabase.auth.getUser()
  const cookieStore = await cookies()
  const recoveryUserId = cookieStore.get(RECOVERY_COOKIE_NAME)?.value
  const hasValidRecoverySession =
    Boolean(user) && !error && recoveryUserId === user?.id

  return (
    <UpdatePasswordForm hasValidSession={hasValidRecoverySession} />
  )
}
