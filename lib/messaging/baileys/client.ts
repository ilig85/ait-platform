import "server-only"

export type BaileysWorkerConfig = {
  url: string
  secret: string
}

export function baileysWorkerConfig(): BaileysWorkerConfig | null {
  const url = process.env.BAILEYS_WORKER_URL?.trim().replace(/\/$/, "")
  const secret = process.env.BAILEYS_WORKER_SECRET?.trim()
  if (!url || !secret) return null

  const parsed = new URL(url)
  if (parsed.protocol !== "https:" && parsed.protocol !== "http:") {
    throw new Error("BAILEYS_WORKER_URL must be an HTTP(S) URL")
  }
  if (secret.length < 32) {
    throw new Error("BAILEYS_WORKER_SECRET must contain at least 32 characters")
  }
  return { url, secret }
}

export async function callBaileysWorker<T>(
  path: string,
  body: Record<string, unknown>,
  fetchImplementation: typeof fetch = fetch,
): Promise<T> {
  const config = baileysWorkerConfig()
  if (!config) throw new Error("Baileys worker is not configured")

  const response = await fetchImplementation(`${config.url}${path}`, {
    method: "POST",
    headers: {
      Authorization: `Bearer ${config.secret}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify(body),
    cache: "no-store",
  })
  const payload = await response.json().catch(() => null) as ({ message?: unknown } & T) | null
  if (!response.ok) {
    const message = typeof payload?.message === "string"
      ? payload.message
      : `Baileys worker rejected the request with HTTP ${response.status}`
    throw new Error(message)
  }
  if (!payload) throw new Error("Baileys worker returned an empty response")
  return payload
}
