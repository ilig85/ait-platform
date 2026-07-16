const INTERNAL_ORIGIN = "https://ait.invalid"

export function getSafeInternalRedirect(
  value: string | null | undefined,
  fallback: string,
) {
  if (!value || !value.startsWith("/")) return fallback

  try {
    const url = new URL(value, INTERNAL_ORIGIN)
    if (url.origin !== INTERNAL_ORIGIN) return fallback
    return `${url.pathname}${url.search}${url.hash}`
  } catch {
    return fallback
  }
}
