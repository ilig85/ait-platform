export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[]

type Relationship = {
  foreignKeyName: string
  columns: string[]
  isOneToOne: boolean
  referencedRelation: string
  referencedColumns: string[]
}

type TableDefinition<Row, Insert, Update> = {
  Row: Row
  Insert: Insert
  Update: Update
  Relationships: Relationship[]
}

export type Database = {
  public: {
    Tables: {
      profiles: TableDefinition<
        {
          id: string
          email: string | null
          full_name: string | null
          avatar_url: string | null
          created_at: string
          updated_at: string
        },
        {
          id: string
          email?: string | null
          full_name?: string | null
          avatar_url?: string | null
          created_at?: string
          updated_at?: string
        },
        {
          id?: string
          email?: string | null
          full_name?: string | null
          avatar_url?: string | null
          created_at?: string
          updated_at?: string
        }
      >
      user_preferences: TableDefinition<
        {
          user_id: string
          locale: string
          theme: string
          notifications_enabled: boolean
          created_at: string
          updated_at: string
        },
        {
          user_id: string
          locale?: string
          theme?: string
          notifications_enabled?: boolean
          created_at?: string
          updated_at?: string
        },
        {
          user_id?: string
          locale?: string
          theme?: string
          notifications_enabled?: boolean
          created_at?: string
          updated_at?: string
        }
      >
      organizations: TableDefinition<
        {
          id: string
          name: string
          slug: string
          plan: string
          created_by: string | null
          default_language: string
          timezone: string
          created_at: string
          updated_at: string
        },
        {
          id?: string
          name: string
          slug: string
          plan?: string
          created_by?: string | null
          default_language?: string
          timezone?: string
          created_at?: string
          updated_at?: string
        },
        {
          id?: string
          name?: string
          slug?: string
          plan?: string
          created_by?: string | null
          default_language?: string
          timezone?: string
          created_at?: string
          updated_at?: string
        }
      >
      organization_ai_settings: TableDefinition<
        {
          organization_id: string
          response_mode: "draft" | "auto"
          auto_reply_min_confidence: number
          created_at: string
          updated_at: string
        },
        {
          organization_id: string
          response_mode?: "draft" | "auto"
          auto_reply_min_confidence?: number
          created_at?: string
          updated_at?: string
        },
        {
          organization_id?: string
          response_mode?: "draft" | "auto"
          auto_reply_min_confidence?: number
          created_at?: string
          updated_at?: string
        }
      >
      organization_members: TableDefinition<
        {
          id: string
          organization_id: string
          user_id: string
          role: Database["public"]["Enums"]["organization_member_role"]
          joined_at: string
          created_at: string
        },
        {
          id?: string
          organization_id: string
          user_id: string
          role?: Database["public"]["Enums"]["organization_member_role"]
          joined_at?: string
          created_at?: string
        },
        {
          id?: string
          organization_id?: string
          user_id?: string
          role?: Database["public"]["Enums"]["organization_member_role"]
          joined_at?: string
          created_at?: string
        }
      >
      channel_connections: TableDefinition<
        {
          id: string
          organization_id: string
          channel_type: string
          provider: string
          status: Database["public"]["Enums"]["channel_connection_status"]
          external_account_id: string | null
          connected_phone_number: string | null
          display_name: string | null
          capabilities: Json
          connected_at: string | null
          disconnected_at: string | null
          last_error: string | null
          created_at: string
          updated_at: string
        },
        {
          id?: string
          organization_id: string
          channel_type: string
          provider: string
          status?: Database["public"]["Enums"]["channel_connection_status"]
          external_account_id?: string | null
          connected_phone_number?: string | null
          display_name?: string | null
          capabilities?: Json
          connected_at?: string | null
          disconnected_at?: string | null
          last_error?: string | null
          created_at?: string
          updated_at?: string
        },
        {
          id?: string
          organization_id?: string
          channel_type?: string
          provider?: string
          status?: Database["public"]["Enums"]["channel_connection_status"]
          external_account_id?: string | null
          connected_phone_number?: string | null
          display_name?: string | null
          capabilities?: Json
          connected_at?: string | null
          disconnected_at?: string | null
          last_error?: string | null
          created_at?: string
          updated_at?: string
        }
      >
      meta_whatsapp_connections: TableDefinition<
        {
          channel_connection_id: string
          meta_app_id: string
          business_portfolio_id: string | null
          waba_id: string
          phone_number_id: string
          webhook_subscription_status: string
          created_at: string
          updated_at: string
        },
        {
          channel_connection_id: string
          meta_app_id: string
          business_portfolio_id?: string | null
          waba_id: string
          phone_number_id: string
          webhook_subscription_status?: string
          created_at?: string
          updated_at?: string
        },
        {
          channel_connection_id?: string
          meta_app_id?: string
          business_portfolio_id?: string | null
          waba_id?: string
          phone_number_id?: string
          webhook_subscription_status?: string
          created_at?: string
          updated_at?: string
        }
      >
      channel_connection_credentials: TableDefinition<
        {
          channel_connection_id: string
          provider: string
          encrypted_access_token: string
          access_token_expires_at: string | null
          encrypted_registration_pin: string | null
          key_version: number
          created_at: string
          updated_at: string
        },
        {
          channel_connection_id: string
          provider: string
          encrypted_access_token: string
          access_token_expires_at?: string | null
          encrypted_registration_pin?: string | null
          key_version?: number
          created_at?: string
          updated_at?: string
        },
        {
          channel_connection_id?: string
          provider?: string
          encrypted_access_token?: string
          access_token_expires_at?: string | null
          encrypted_registration_pin?: string | null
          key_version?: number
          created_at?: string
          updated_at?: string
        }
      >
      contacts: TableDefinition<
        {
          id: string
          organization_id: string
          channel_connection_id: string
          external_contact_id: string | null
          phone_number: string | null
          display_name: string | null
          contact_type: Database["public"]["Enums"]["contact_type"]
          ai_analysis_allowed: boolean
          created_at: string
          updated_at: string
        },
        {
          id?: string
          organization_id: string
          channel_connection_id: string
          external_contact_id?: string | null
          phone_number?: string | null
          display_name?: string | null
          contact_type?: Database["public"]["Enums"]["contact_type"]
          ai_analysis_allowed?: boolean
          created_at?: string
          updated_at?: string
        },
        {
          id?: string
          organization_id?: string
          channel_connection_id?: string
          external_contact_id?: string | null
          phone_number?: string | null
          display_name?: string | null
          contact_type?: Database["public"]["Enums"]["contact_type"]
          ai_analysis_allowed?: boolean
          created_at?: string
          updated_at?: string
        }
      >
      conversations: TableDefinition<
        {
          id: string
          organization_id: string
          channel_connection_id: string
          contact_id: string
          status: Database["public"]["Enums"]["conversation_status"]
          unread_count: number
          needs_human: boolean
          assigned_user_id: string | null
          last_message_at: string | null
          last_customer_message_at: string | null
          service_window_expires_at: string | null
          created_at: string
          updated_at: string
        },
        {
          id?: string
          organization_id: string
          channel_connection_id: string
          contact_id: string
          status?: Database["public"]["Enums"]["conversation_status"]
          unread_count?: number
          needs_human?: boolean
          assigned_user_id?: string | null
          last_message_at?: string | null
          last_customer_message_at?: string | null
          service_window_expires_at?: string | null
          created_at?: string
          updated_at?: string
        },
        {
          id?: string
          organization_id?: string
          channel_connection_id?: string
          contact_id?: string
          status?: Database["public"]["Enums"]["conversation_status"]
          unread_count?: number
          needs_human?: boolean
          assigned_user_id?: string | null
          last_message_at?: string | null
          last_customer_message_at?: string | null
          service_window_expires_at?: string | null
          created_at?: string
          updated_at?: string
        }
      >
      messages: TableDefinition<
        {
          id: string
          organization_id: string
          channel_connection_id: string
          conversation_id: string
          provider_message_id: string | null
          direction: Database["public"]["Enums"]["message_direction"]
          sender_type: Database["public"]["Enums"]["message_sender_type"]
          message_type: Database["public"]["Enums"]["message_type"]
          text_body: string | null
          delivery_status: Database["public"]["Enums"]["message_delivery_status"]
          provider_timestamp: string | null
          reply_to_message_id: string | null
          ai_analysis_allowed: boolean
          media_metadata: Json | null
          created_at: string
          updated_at: string
        },
        {
          id?: string
          organization_id: string
          channel_connection_id: string
          conversation_id: string
          provider_message_id?: string | null
          direction: Database["public"]["Enums"]["message_direction"]
          sender_type?: Database["public"]["Enums"]["message_sender_type"]
          message_type?: Database["public"]["Enums"]["message_type"]
          text_body?: string | null
          delivery_status: Database["public"]["Enums"]["message_delivery_status"]
          provider_timestamp?: string | null
          reply_to_message_id?: string | null
          ai_analysis_allowed?: boolean
          media_metadata?: Json | null
          created_at?: string
          updated_at?: string
        },
        {
          id?: string
          organization_id?: string
          channel_connection_id?: string
          conversation_id?: string
          provider_message_id?: string | null
          direction?: Database["public"]["Enums"]["message_direction"]
          sender_type?: Database["public"]["Enums"]["message_sender_type"]
          message_type?: Database["public"]["Enums"]["message_type"]
          text_body?: string | null
          delivery_status?: Database["public"]["Enums"]["message_delivery_status"]
          provider_timestamp?: string | null
          reply_to_message_id?: string | null
          ai_analysis_allowed?: boolean
          media_metadata?: Json | null
          created_at?: string
          updated_at?: string
        }
      >
      customer_consents: TableDefinition<
        {
          id: string
          organization_id: string
          contact_id: string
          consent_type: string
          topic: string
          status: Database["public"]["Enums"]["consent_status"]
          source: string | null
          consented_at: string | null
          revoked_at: string | null
          created_at: string
          updated_at: string
        },
        {
          id?: string
          organization_id: string
          contact_id: string
          consent_type?: string
          topic: string
          status?: Database["public"]["Enums"]["consent_status"]
          source?: string | null
          consented_at?: string | null
          revoked_at?: string | null
          created_at?: string
          updated_at?: string
        },
        {
          id?: string
          organization_id?: string
          contact_id?: string
          consent_type?: string
          topic?: string
          status?: Database["public"]["Enums"]["consent_status"]
          source?: string | null
          consented_at?: string | null
          revoked_at?: string | null
          created_at?: string
          updated_at?: string
        }
      >
      channel_message_templates: TableDefinition<
        {
          id: string
          organization_id: string
          channel_connection_id: string | null
          provider: string
          provider_template_id: string | null
          name: string
          language: string
          category: Database["public"]["Enums"]["message_template_category"]
          approval_status: string
          template_definition: Json
          created_at: string
          updated_at: string
        },
        {
          id?: string
          organization_id: string
          channel_connection_id?: string | null
          provider: string
          provider_template_id?: string | null
          name: string
          language: string
          category: Database["public"]["Enums"]["message_template_category"]
          approval_status?: string
          template_definition?: Json
          created_at?: string
          updated_at?: string
        },
        {
          id?: string
          organization_id?: string
          channel_connection_id?: string | null
          provider?: string
          provider_template_id?: string | null
          name?: string
          language?: string
          category?: Database["public"]["Enums"]["message_template_category"]
          approval_status?: string
          template_definition?: Json
          created_at?: string
          updated_at?: string
        }
      >
    }
    Views: { [_ in never]: never }
    Functions: {
      ait_install_meta_whatsapp_connection: {
        Args: {
          target_organization_id: string
          target_meta_app_id: string
          target_business_portfolio_id: string
          target_waba_id: string
          target_phone_number_id: string
          target_display_phone_number: string
          target_verified_name: string
          target_encrypted_access_token: string
          target_access_token_expires_at: string | null
          target_encrypted_registration_pin: string
        }
        Returns: string
      }
      ait_advance_message_delivery_status: {
        Args: {
          target_channel_connection_id: string
          target_provider_message_id: string
          target_status: Database["public"]["Enums"]["message_delivery_status"]
        }
        Returns: boolean
      }
      ait_generate_unique_organization_slug: {
        Args: { preferred_base: string; stable_seed: string }
        Returns: string
      }
      ait_has_organization_role: {
        Args: {
          target_organization_id: string
          allowed_roles: Database["public"]["Enums"]["organization_member_role"][]
        }
        Returns: boolean
      }
      ait_is_organization_member: {
        Args: { target_organization_id: string }
        Returns: boolean
      }
      ait_mark_outbound_message_sent: {
        Args: {
          target_message_id: string
          target_organization_id: string
          target_provider_message_id: string
          target_provider_timestamp: string
        }
        Returns: boolean
      }
      ait_record_inbound_text: {
        Args: {
          target_organization_id: string
          target_channel_connection_id: string
          target_provider_message_id: string
          target_external_contact_id: string
          target_phone_number: string
          target_display_name: string | null
          target_text_body: string
          target_provider_timestamp: string
        }
        Returns: {
          message_id: string
          conversation_id: string
          created: boolean
        }[]
      }
      ait_users_share_organization: {
        Args: { target_user_id: string }
        Returns: boolean
      }
    }
    Enums: {
      organization_member_role: "owner" | "manager" | "member"
      channel_connection_status:
        | "disconnected"
        | "connecting"
        | "connected"
        | "reconnecting"
        | "error"
        | "disabled"
      contact_type: "customer" | "coworker" | "supplier" | "personal" | "unknown"
      conversation_status: "open" | "pending" | "resolved" | "archived"
      message_direction: "inbound" | "outbound"
      message_sender_type: "customer" | "manager" | "ai" | "system" | "unknown"
      message_type:
        | "text"
        | "image"
        | "audio"
        | "document"
        | "video"
        | "interactive"
        | "template"
        | "unsupported"
      message_delivery_status: "pending" | "sent" | "delivered" | "read" | "failed" | "received"
      consent_status: "granted" | "revoked" | "unknown"
      message_template_category: "marketing" | "utility" | "authentication"
    }
    CompositeTypes: { [_ in never]: never }
  }
}

export type Tables<
  TableName extends keyof Database["public"]["Tables"],
> = Database["public"]["Tables"][TableName]["Row"]

export type Enums<
  EnumName extends keyof Database["public"]["Enums"],
> = Database["public"]["Enums"][EnumName]
