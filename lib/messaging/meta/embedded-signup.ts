import "server-only"

import { requiredServerEnv } from "../security"

type GraphErrorBody = {
  error?: {
    message?: unknown
    code?: unknown
    error_subcode?: unknown
  }
}

export class MetaGraphApiError extends Error {
  readonly status: number
  readonly code: number | null
  readonly subcode: number | null

  constructor(status: number, body: GraphErrorBody, operation: string) {
    const providerMessage = typeof body.error?.message === "string"
      ? body.error.message.slice(0, 300)
      : "Meta returned an unknown error"
    super(`${operation}: ${providerMessage}`)
    this.name = "MetaGraphApiError"
    this.status = status
    this.code = typeof body.error?.code === "number" ? body.error.code : null
    this.subcode = typeof body.error?.error_subcode === "number" ? body.error.error_subcode : null
  }
}

export type EmbeddedSignupPhone = {
  id: string
  displayPhoneNumber: string | null
  verifiedName: string | null
}

export type EmbeddedSignupToken = {
  accessToken: string
  expiresAt: Date | null
}

function graphApiVersion(): string {
  const version = requiredServerEnv("META_GRAPH_API_VERSION")
  if (!/^v\d+\.\d+$/.test(version)) {
    throw new Error("META_GRAPH_API_VERSION must use a value such as v25.0")
  }
  return version
}

async function graphJson<T>(
  response: Response,
  operation: string,
): Promise<T> {
  const body = await response.json() as T & GraphErrorBody
  if (!response.ok || body.error) throw new MetaGraphApiError(response.status, body, operation)
  return body
}

export async function exchangeEmbeddedSignupCode(
  code: string,
  fetchImplementation: typeof fetch = fetch,
): Promise<EmbeddedSignupToken> {
  const params = new URLSearchParams({
    client_id: requiredServerEnv("NEXT_PUBLIC_META_APP_ID"),
    client_secret: requiredServerEnv("META_WHATSAPP_APP_SECRET"),
    code,
  })
  const response = await fetchImplementation(
    `https://graph.facebook.com/${graphApiVersion()}/oauth/access_token?${params.toString()}`,
    { method: "GET", cache: "no-store" },
  )
  const body = await graphJson<{
    access_token?: unknown
    expires_in?: unknown
  }>(response, "Meta token exchange failed")
  if (typeof body.access_token !== "string" || !body.access_token) {
    throw new Error("Meta token exchange did not return an access token")
  }

  const expiresIn = typeof body.expires_in === "number" && body.expires_in > 0
    ? body.expires_in
    : null
  return {
    accessToken: body.access_token,
    expiresAt: expiresIn ? new Date(Date.now() + expiresIn * 1000) : null,
  }
}

export async function loadEmbeddedSignupPhone(
  accessToken: string,
  wabaId: string,
  phoneNumberId: string,
  fetchImplementation: typeof fetch = fetch,
): Promise<EmbeddedSignupPhone> {
  const params = new URLSearchParams({ fields: "id,display_phone_number,verified_name" })
  const response = await fetchImplementation(
    `https://graph.facebook.com/${graphApiVersion()}/${encodeURIComponent(wabaId)}/phone_numbers?${params.toString()}`,
    {
      method: "GET",
      headers: { Authorization: `Bearer ${accessToken}` },
      cache: "no-store",
    },
  )
  const body = await graphJson<{
    data?: Array<{
      id?: unknown
      display_phone_number?: unknown
      verified_name?: unknown
    }>
  }>(response, "Unable to verify the selected WhatsApp number")
  const selected = body.data?.find((phone) => phone.id === phoneNumberId)
  if (!selected) throw new Error("The selected phone number does not belong to the selected WhatsApp Business Account")

  return {
    id: phoneNumberId,
    displayPhoneNumber: typeof selected.display_phone_number === "string"
      ? selected.display_phone_number
      : null,
    verifiedName: typeof selected.verified_name === "string" ? selected.verified_name : null,
  }
}

export async function registerEmbeddedSignupPhone(
  accessToken: string,
  phoneNumberId: string,
  pin: string,
  fetchImplementation: typeof fetch = fetch,
): Promise<void> {
  const response = await fetchImplementation(
    `https://graph.facebook.com/${graphApiVersion()}/${encodeURIComponent(phoneNumberId)}/register`,
    {
      method: "POST",
      headers: {
        Authorization: `Bearer ${accessToken}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({ messaging_product: "whatsapp", pin }),
    },
  )
  const body = await graphJson<{ success?: unknown }>(response, "Unable to register the WhatsApp number")
  if (body.success !== true) throw new Error("Meta did not confirm WhatsApp number registration")
}

export async function subscribeEmbeddedSignupWaba(
  accessToken: string,
  wabaId: string,
  fetchImplementation: typeof fetch = fetch,
): Promise<void> {
  const response = await fetchImplementation(
    `https://graph.facebook.com/${graphApiVersion()}/${encodeURIComponent(wabaId)}/subscribed_apps`,
    {
      method: "POST",
      headers: { Authorization: `Bearer ${accessToken}` },
    },
  )
  const body = await graphJson<{ success?: unknown }>(response, "Unable to subscribe AIT to WhatsApp webhooks")
  if (body.success !== true) throw new Error("Meta did not confirm the WhatsApp webhook subscription")
}
