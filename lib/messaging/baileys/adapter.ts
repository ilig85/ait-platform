import "server-only"

import type {
  MessagingProviderAdapter,
  ProviderTextSendRequest,
  ProviderTextSendResult,
} from "../provider"
import { callBaileysWorker } from "./client"

type SendResponse = {
  status: "sent"
  externalMessageId: string
  acceptedAt: string
}

export class BaileysWhatsAppAdapter implements MessagingProviderAdapter {
  readonly provider = "baileys"

  verifyWebhookSignature(): boolean {
    return false
  }

  parseWebhook(): [] {
    return []
  }

  async sendText(request: ProviderTextSendRequest): Promise<ProviderTextSendResult> {
    const result = await callBaileysWorker<SendResponse>(
      `/connections/${encodeURIComponent(request.connection.id)}/messages`,
      {
        recipientExternalId: request.recipientExternalId,
        text: request.text,
      },
    )
    const acceptedAt = new Date(result.acceptedAt)
    if (!result.externalMessageId || Number.isNaN(acceptedAt.getTime())) {
      throw new Error("Baileys worker returned an invalid send receipt")
    }
    return { externalMessageId: result.externalMessageId, acceptedAt }
  }
}
