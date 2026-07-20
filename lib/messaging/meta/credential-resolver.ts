import "server-only"

import type { SupabaseClient } from "@supabase/supabase-js"
import type { Database } from "@/lib/supabase/database.types"
import type { MessagingConnectionContext } from "../provider"
import { requiredServerEnv } from "../security"
import {
  EnvironmentMetaWhatsAppCredentialResolver,
  type MetaWhatsAppCredentialResolver,
  type MetaWhatsAppCredentials,
} from "./adapter"
import { decryptMetaSecret } from "./credential-crypto"

export class SupabaseMetaWhatsAppCredentialResolver implements MetaWhatsAppCredentialResolver {
  constructor(
    private readonly admin: SupabaseClient<Database>,
    private readonly fallback: MetaWhatsAppCredentialResolver = new EnvironmentMetaWhatsAppCredentialResolver(),
  ) {}

  async resolve(connection: MessagingConnectionContext): Promise<MetaWhatsAppCredentials> {
    const { data, error } = await this.admin
      .from("channel_connection_credentials")
      .select("encrypted_access_token, access_token_expires_at")
      .eq("channel_connection_id", connection.id)
      .eq("provider", "meta_cloud")
      .maybeSingle()

    if (error?.code === "42P01" || error?.code === "PGRST205") {
      // Safe rollout path: the existing sandbox remains usable until the
      // credential migration is applied, then production rows take precedence.
      return this.fallback.resolve(connection)
    }
    if (error) throw new Error("Unable to load the WhatsApp connection credential")
    if (!data) return this.fallback.resolve(connection)
    if (data.access_token_expires_at && new Date(data.access_token_expires_at) <= new Date()) {
      throw new Error("The WhatsApp connection has expired. Reconnect it from Settings.")
    }
    if (!connection.externalBusinessAccountId) {
      throw new Error("The WhatsApp connection is missing its business account identifier")
    }

    return {
      graphApiVersion: requiredServerEnv("META_GRAPH_API_VERSION"),
      accessToken: decryptMetaSecret(data.encrypted_access_token, `${connection.externalAddressId}:access-token`),
      phoneNumberId: connection.externalAddressId,
      businessAccountId: connection.externalBusinessAccountId,
    }
  }
}
