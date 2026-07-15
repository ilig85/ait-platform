const LOCAL_SITE_URL = "http://localhost:3000"

function normalizeHttpOrigin(value: string): string {
  try {
    const url = new URL(value)

    if (url.protocol !== "http:" && url.protocol !== "https:") {
      throw new Error("unsupported protocol")
    }

    if (
      url.username ||
      url.password ||
      (url.pathname !== "/" && url.pathname !== "") ||
      url.search ||
      url.hash
    ) {
      throw new Error("site URL must contain only an origin")
    }

    return url.origin
  } catch {
    throw new Error(
      "NEXT_PUBLIC_SITE_URL must be a valid absolute HTTP(S) URL."
    )
  }
}

function isLocalOrPreviewOrigin(origin: string): boolean {
  const { hostname } = new URL(origin)

  return (
    hostname === "localhost" ||
    hostname === "127.0.0.1" ||
    hostname === "[::1]" ||
    hostname.endsWith(".vercel.app")
  )
}

export function getSiteUrl(): string {
  const configuredSiteUrl = process.env.NEXT_PUBLIC_SITE_URL?.trim()
  const configuredOrigin = configuredSiteUrl
    ? normalizeHttpOrigin(configuredSiteUrl)
    : null

  if (typeof window !== "undefined") {
    const browserOrigin = normalizeHttpOrigin(window.location.origin)

    if (isLocalOrPreviewOrigin(browserOrigin)) {
      return browserOrigin
    }

    return configuredOrigin ?? browserOrigin
  }

  return configuredOrigin ?? LOCAL_SITE_URL
}

export function getAuthCallbackUrl(options?: {
  flow?: "recovery"
  next?: string
}): string {
  const callbackUrl = new URL("/auth/callback", getSiteUrl())

  if (options?.flow) {
    callbackUrl.searchParams.set("flow", options.flow)
  }

  if (options?.next) {
    callbackUrl.searchParams.set(
      "next",
      sanitizeRedirectPath(options.next, "/")
    )
  }

  return callbackUrl.toString()
}

export function sanitizeRedirectPath(
  value: string | null | undefined,
  fallback = "/"
): string {
  if (
    !value ||
    !value.startsWith("/") ||
    value.startsWith("//") ||
    value.includes("\\")
  ) {
    return fallback
  }

  try {
    const parsed = new URL(value, LOCAL_SITE_URL)

    if (parsed.origin !== LOCAL_SITE_URL) {
      return fallback
    }

    return `${parsed.pathname}${parsed.search}${parsed.hash}`
  } catch {
    return fallback
  }
}
