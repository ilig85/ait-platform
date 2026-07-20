import "server-only"

import type {
  MessagingConnectionContext,
  MessagingProviderAdapter,
  ProviderTextSendRequest,
  ProviderTextSendResult,
} from "../provider"
import { requiredServerEnv, verifyHmacSha256Signature } from "../security"
import { parseMetaWhatsAppWebhook } from "./webhook-parser"

export type MetaWhatsAppCredentials = {
  graphApiVersion: string
  accessToken: string
  phoneNumberId: string
  businessAccountId: string
}

export interface MetaWhatsAppCredentialResolver {
  resolve(connection: MessagingConnectionContext): Promise<MetaWhatsAppCredentials>
}

type MetaWhatsAppAdapterOptions = {
  appSecret?: string
  credentialResolver?: MetaWhatsAppCredentialResolver
  fetchImplementation?: typeof fetch
}

export class EnvironmentMetaWhatsAppCredentialResolver implements MetaWhatsAppCredentialResolver {
  async resolve(connection: MessagingConnectionContext): Promise<MetaWhatsAppCredentials> {
    const credentials = {
      graphApiVersion: requiredServerEnv("META_GRAPH_API_VERSION"),
      accessToken: requiredServerEnv("META_WHATSAPP_ACCESS_TOKEN"),
      phoneNumberId: requiredServerEnv("META_WHATSAPP_PHONE_NUMBER_ID"),
      businessAccountId: requiredServerEnv("META_WHATSAPP_BUSINESS_ACCOUNT_ID"),
    }

    if (!/^v\d+\.\d+$/.test(credentials.graphApiVersion)) {
      throw new Error("META_GRAPH_API_VERSION must use a value such as v23.0")
    }

    if (
      credentials.phoneNumberId !== connection.externalAddressId
      || credentials.businessAccountId !== connection.externalBusinessAccountId
    ) {
      throw new Error("Sandbox Meta credentials do not match the trusted channel mapping")
    }

    return credentials
  }
}

export class MetaWhatsAppAdapter implements MessagingProviderAdapter {
  readonly provider = "meta_cloud"
  private readonly options: MetaWhatsAppAdapterOptions

  constructor(options: MetaWhatsAppAdapterOptions) {
    this.options = options
  }

  verifyWebhookSignature(rawBody: Uint8Array, signature: string | null): boolean {
    return verifyHmacSha256Signature(rawBody, signature, this.options.appSecret ?? "")
  }

  parseWebhook(payload: unknown) {
    return parseMetaWhatsAppWebhook(payload)
  }

  async sendText(request: ProviderTextSendRequest): Promise<ProviderTextSendResult> {
    if (!this.options.credentialResolver) {
      throw new Error("Meta credential resolver is not configured")
    }

    const credentials = await this.options.credentialResolver.resolve(request.connection)
    const fetchImplementation = this.options.fetchImplementation ?? fetch
    const response = await fetchImplementation(
      `https://graph.facebook.com/${credentials.graphApiVersion}/${encodeURIComponent(credentials.phoneNumberId)}/messages`,
      {
        method: "POST",
        headers: {
          Authorization: `Bearer ${credentials.accessToken}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          messaging_product: "whatsapp",
          recipient_type: "individual",
          to: request.recipientExternalId,
          type: "text",
          text: { preview_url: false, body: request.text },
        }),
      },
    )

    if (!response.ok) {
      throw new Error(`Meta Graph API rejected the message with HTTP ${response.status}`)
    }

    const responseBody = await response.json() as { messages?: { id?: unknown }[] }
    const externalMessageId = typeof responseBody.messages?.[0]?.id === "string"
      ? responseBody.messages[0].id
      : null
    if (!externalMessageId) throw new Error("Meta Graph API did not return a message ID")

    return { externalMessageId, acceptedAt: new Date() }
  }
}

export function createMetaWebhookAdapter(): MetaWhatsAppAdapter {
  return new MetaWhatsAppAdapter({
    appSecret: requiredServerEnv("META_WHATSAPP_APP_SECRET"),
  })
}

export function createMetaOutboundAdapter(
  credentialResolver: MetaWhatsAppCredentialResolver = new EnvironmentMetaWhatsAppCredentialResolver(),
): MetaWhatsAppAdapter {
  return new MetaWhatsAppAdapter({
    credentialResolver,
  })
}
