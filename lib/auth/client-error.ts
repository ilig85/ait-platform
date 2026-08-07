export function getAuthErrorMessage(error: unknown) {
  const message = error instanceof Error
    ? error.message
    : typeof error === "object" && error && "message" in error
      ? String(error.message)
      : ""

  if (/load failed|failed to fetch|network.*request|fetch.*failed/i.test(message)) {
    return "Authentication could not reach Supabase from this preview. Add NEXT_PUBLIC_SUPABASE_URL and NEXT_PUBLIC_SUPABASE_ANON_KEY to the Preview environment in Vercel, then redeploy."
  }

  if (/supabaseurl|supabase.*key|environment variable|invalid api key/i.test(message)) {
    return "Authentication is not configured for this deployment. Add the Supabase URL and anon key to the Vercel Preview environment, then redeploy."
  }

  return message || "Authentication is temporarily unavailable. Please try again."
}
