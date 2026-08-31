import "server-only"

import type { SupabaseClient } from "@supabase/supabase-js"
import type { Database } from "@/lib/supabase/database.types"
import type {
  OutboundConnection,
  OutboundConversation,
  OutboundMessageStore,
} from "@/lib/messaging/outbound-service"
import type { MessagingConnectionContext } from "@/lib/messaging/provider"
import type {
  InboundTextWrite,
  WebhookMessageStore,
} from "@/lib/messaging/webhook-service"

type ApplicationSupabaseClient = SupabaseClient<Database>

export class SupabaseWebhookMessageStore implements WebhookMessageStore {
  constructor(private readonly admin: ApplicationSupabaseClient) {}

  async resolveConnection(externalRecipientId: string): Promise<MessagingConnectionContext | null> {
    const mappingResult = await this.admin
      .from("meta_whatsapp_connections")
      .select("channel_connection_id, phone_number_id, waba_id")
      .eq("phone_number_id", externalRecipientId)
      .maybeSingle()

    if (mappingResult.error) throw mappingResult.error
    if (!mappingResult.data) return null

    const connectionResult = await this.admin
      .from("channel_connections")
      .select("id, organization_id, provider, channel_type")
      .eq("id", mappingResult.data.channel_connection_id)
      .maybeSingle()

    if (connectionResult.error) throw connectionResult.error
    const connection = connectionResult.data
    if (!connection || connection.provider !== "meta_cloud" || connection.channel_type !== "whatsapp") {
      return null
    }

    return {
      id: connection.id,
      organizationId: connection.organization_id,
      provider: connection.provider,
      externalAddressId: mappingResult.data.phone_number_id,
      externalBusinessAccountId: mappingResult.data.waba_id,
    }
  }

  async recordInboundText(message: InboundTextWrite): Promise<{
    created: boolean
    messageId: string
    conversationId: string
  }> {
    const result = await this.admin.rpc("ait_record_inbound_text", {
      target_organization_id: message.connection.organizationId,
      target_channel_connection_id: message.connection.id,
      target_provider_message_id: message.externalMessageId,
      target_external_contact_id: message.senderExternalId,
      target_phone_number: message.senderPhoneNumber,
      target_display_name: message.senderDisplayName,
      target_text_body: message.text,
      target_provider_timestamp: message.occurredAt.toISOString(),
    })

    if (result.error) throw result.error
    const firstResult = result.data?.[0]
    if (!firstResult) throw new Error("Inbound message recorder returned no result")
    return {
      created: firstResult.created,
      messageId: firstResult.message_id,
      conversationId: firstResult.conversation_id,
    }
  }

  async advanceDeliveryStatus(input: Parameters<WebhookMessageStore["advanceDeliveryStatus"]>[0]) {
    const result = await this.admin.rpc("ait_advance_message_delivery_status", {
      target_channel_connection_id: input.connection.id,
      target_provider_message_id: input.externalMessageId,
      target_status: input.status,
    })

    if (result.error) throw result.error
    return { advanced: result.data }
  }
}

export class SupabaseOutboundMessageStore implements OutboundMessageStore {
  constructor(
    private readonly userClient: ApplicationSupabaseClient,
    private readonly admin: ApplicationSupabaseClient,
  ) {}

  async getAuthenticatedUser(): Promise<{ id: string } | null> {
    const { data, error } = await this.userClient.auth.getUser()
    if (error || !data.user) return null
    return { id: data.user.id }
  }

  async getConversationVisibleToUser(conversationId: string): Promise<OutboundConversation | null> {
    const result = await this.userClient
      .from("conversations")
      .select("id, organization_id, channel_connection_id, contact_id, service_window_expires_at")
      .eq("id", conversationId)
      .maybeSingle()

    if (result.error) throw result.error
    if (!result.data) return null

    return {
      id: result.data.id,
      organizationId: result.data.organization_id,
      channelConnectionId: result.data.channel_connection_id,
      contactId: result.data.contact_id,
      serviceWindowExpiresAt: result.data.service_window_expires_at,
    }
  }

  async getOrganizationRole(userId: string, organizationId: string) {
    const result = await this.userClient
      .from("organization_members")
      .select("role")
      .eq("user_id", userId)
      .eq("organization_id", organizationId)
      .maybeSingle()

    if (result.error) throw result.error
    return result.data?.role ?? null
  }

  async getConnectionForConversation(
    conversation: OutboundConversation,
  ): Promise<OutboundConnection | null> {
    const [connectionResult, contactResult] = await Promise.all([
      this.userClient
        .from("channel_connections")
        .select("id, organization_id, provider, channel_type, status, external_account_id, connected_phone_number")
        .eq("id", conversation.channelConnectionId)
        .eq("organization_id", conversation.organizationId)
        .maybeSingle(),
      this.userClient
        .from("contacts")
        .select("external_contact_id, phone_number")
        .eq("id", conversation.contactId)
        .eq("organization_id", conversation.organizationId)
        .eq("channel_connection_id", conversation.channelConnectionId)
        .maybeSingle(),
    ])

    if (connectionResult.error) throw connectionResult.error
    if (contactResult.error) throw contactResult.error

    const connection = connectionResult.data
    const recipientExternalId = contactResult.data?.external_contact_id ?? contactResult.data?.phone_number
    if (!connection || connection.channel_type !== "whatsapp" || !recipientExternalId) return null

    if (connection.provider === "baileys") {
      const externalAddressId = connection.external_account_id ?? connection.connected_phone_number
      if (!externalAddressId) return null
      return {
        id: connection.id,
        organizationId: connection.organization_id,
        provider: connection.provider,
        status: connection.status,
        externalAddressId,
        externalBusinessAccountId: null,
        recipientExternalId,
      }
    }

    if (connection.provider !== "meta_cloud") return null
    const mappingResult = await this.admin
      .from("meta_whatsapp_connections")
      .select("phone_number_id, waba_id")
      .eq("channel_connection_id", connection.id)
      .maybeSingle()

    if (mappingResult.error) throw mappingResult.error
    if (!mappingResult.data) return null

    return {
      id: connection.id,
      organizationId: connection.organization_id,
      provider: connection.provider,
      status: connection.status,
      externalAddressId: mappingResult.data.phone_number_id,
      externalBusinessAccountId: mappingResult.data.waba_id,
      recipientExternalId,
    }
  }

  async createPendingOutbound(input: {
    conversation: OutboundConversation
    connection: OutboundConnection
    text: string
  }): Promise<{ id: string }> {
    const result = await this.admin
      .from("messages")
      .insert({
        organization_id: input.conversation.organizationId,
        channel_connection_id: input.connection.id,
        conversation_id: input.conversation.id,
        direction: "outbound",
        sender_type: "manager",
        message_type: "text",
        text_body: input.text,
        delivery_status: "pending",
        ai_analysis_allowed: false,
      })
      .select("id")
      .single()

    if (result.error) throw result.error
    return result.data
  }

  async markOutboundSent(input: {
    messageId: string
    externalMessageId: string
    acceptedAt: Date
    conversation: OutboundConversation
  }): Promise<void> {
    const acceptedAt = input.acceptedAt.toISOString()
    const result = await this.admin.rpc("ait_mark_outbound_message_sent", {
      target_message_id: input.messageId,
      target_organization_id: input.conversation.organizationId,
      target_provider_message_id: input.externalMessageId,
      target_provider_timestamp: acceptedAt,
    })

    if (result.error) throw result.error
    if (!result.data) throw new Error("Pending outbound message could not be marked sent")
  }

  async markOutboundFailed(messageId: string): Promise<void> {
    const result = await this.admin
      .from("messages")
      .update({ delivery_status: "failed" })
      .eq("id", messageId)
      .eq("delivery_status", "pending")

    if (result.error) throw result.error
  }
}
