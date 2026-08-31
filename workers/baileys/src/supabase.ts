import { createClient } from "@supabase/supabase-js"
import { config } from "./config.js"

export const supabase = createClient(
  config.supabaseUrl,
  config.supabaseServiceRoleKey,
  {
    auth: {
      autoRefreshToken: false,
      persistSession: false,
    },
  },
)

export type BaileysConnection = {
  id: string
  organizationId: string
  phoneNumber: string
}

export async function loadBaileysConnection(connectionId: string): Promise<BaileysConnection> {
  const { data, error } = await supabase
    .from("channel_connections")
    .select("id, organization_id, provider, channel_type, external_account_id, connected_phone_number")
    .eq("id", connectionId)
    .maybeSingle()

  if (error) throw error
  if (!data || data.provider !== "baileys" || data.channel_type !== "whatsapp") {
    throw new Error("Baileys connection was not found")
  }

  const phoneNumber = String(data.external_account_id ?? data.connected_phone_number ?? "")
    .replace(/\D/g, "")
  if (!/^\d{8,15}$/.test(phoneNumber)) {
    throw new Error("Baileys connection does not have a valid phone number")
  }

  return {
    id: data.id,
    organizationId: data.organization_id,
    phoneNumber,
  }
}

export async function setConnectionState(
  connection: BaileysConnection,
  state: {
    status: "connecting" | "connected" | "reconnecting" | "error" | "disconnected"
    error?: string | null
    displayName?: string | null
    accountId?: string | null
  },
): Promise<void> {
  const now = new Date().toISOString()
  const connected = state.status === "connected"
  const { error } = await supabase
    .from("channel_connections")
    .update({
      status: state.status,
      external_account_id: state.accountId ?? connection.phoneNumber,
      connected_phone_number: `+${connection.phoneNumber}`,
      display_name: state.displayName ?? "WhatsApp",
      connected_at: connected ? now : undefined,
      disconnected_at: state.status === "disconnected" ? now : null,
      last_error: state.error ?? null,
    })
    .eq("id", connection.id)
    .eq("organization_id", connection.organizationId)
    .eq("provider", "baileys")

  if (error) throw error
}

export async function recordInboundText(input: {
  connection: BaileysConnection
  providerMessageId: string
  senderExternalId: string
  senderPhoneNumber: string
  senderDisplayName: string | null
  text: string
  occurredAt: Date
}): Promise<void> {
  const { error } = await supabase.rpc("ait_record_inbound_text", {
    target_organization_id: input.connection.organizationId,
    target_channel_connection_id: input.connection.id,
    target_provider_message_id: input.providerMessageId,
    target_external_contact_id: input.senderExternalId,
    target_phone_number: input.senderPhoneNumber,
    target_display_name: input.senderDisplayName,
    target_text_body: input.text,
    target_provider_timestamp: input.occurredAt.toISOString(),
  })

  if (error) throw error
}
