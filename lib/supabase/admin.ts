import "server-only"

import { createClient } from "@supabase/supabase-js"
import type { Database } from "@/lib/supabase/database.types"
import { requiredServerEnv } from "@/lib/messaging/security"

export function createAdminClient() {
  return createClient<Database>(
    requiredServerEnv("NEXT_PUBLIC_SUPABASE_URL"),
    requiredServerEnv("SUPABASE_SERVICE_ROLE_KEY"),
    {
      auth: {
        autoRefreshToken: false,
        detectSessionInUrl: false,
        persistSession: false,
      },
    },
  )
}
