import type { Enums } from "@/lib/supabase/database.types"

export type WorkspaceUser = {
  id: string
  email: string | null
  displayName: string
  avatarUrl: string | null
}

export type WorkspaceOrganization = {
  id: string
  name: string
  slug: string
  plan: string
  defaultLanguage: string
  timezone: string
}

export type WorkspaceContext =
  | {
      status: "ready"
      user: WorkspaceUser
      organization: WorkspaceOrganization
      role: Enums<"organization_member_role">
      organizationCount: number
    }
  | {
      status: "missing_membership"
      user: WorkspaceUser
      message: string
    }
  | {
      status: "unauthenticated"
      message: string
    }
  | {
      status: "error"
      user: WorkspaceUser | null
      message: string
    }

export type Loadable<T> =
  | { status: "ready"; data: T }
  | { status: "missing_membership" | "error"; message: string }

export type ShellData = {
  workspaceStatus: WorkspaceContext["status"]
  user: WorkspaceUser | null
  organizationName: string | null
  unreadConversationCount: number
  needsHumanCount: number
  message: string | null
}

export type ChannelSummary = {
  id: string
  channelType: string
  provider: string
  displayName: string | null
  status: Enums<"channel_connection_status">
  connectedPhoneNumber: string | null
  connectedAt: string | null
  lastError: string | null
}

export type OverviewData = {
  metrics: {
    contacts: number
    resolvedConversations: number
    openConversations: number
    needsHuman: number
  }
  dailyActivity: Array<{
    date: string
    label: string
    conversations: number
    messages: number
  }>
  channels: ChannelSummary[]
  recentEscalations: Array<{
    id: string
    contactName: string
    lastActivityAt: string
  }>
}

export type CustomerConversationSummary = {
  id: string
  status: Enums<"conversation_status">
  needsHuman: boolean
  lastMessageAt: string
  lastMessage: string
  messageCount: number
}

export type CustomerRecord = {
  id: string
  displayName: string
  phoneNumber: string | null
  externalContactId: string | null
  contactType: Enums<"contact_type">
  aiAnalysisAllowed: boolean
  createdAt: string
  updatedAt: string
  lastContactAt: string
  conversations: CustomerConversationSummary[]
  inboundMessageCount: number
  outboundMessageCount: number
}

export type CustomersData = {
  customers: CustomerRecord[]
}

export type InboxMessage = {
  id: string
  direction: Enums<"message_direction">
  senderType: Enums<"message_sender_type">
  messageType: Enums<"message_type">
  textBody: string | null
  deliveryStatus: Enums<"message_delivery_status">
  timestamp: string
}

export type InboxConversation = {
  id: string
  contactId: string
  contactName: string
  phoneNumber: string | null
  contactType: Enums<"contact_type">
  aiAnalysisAllowed: boolean
  status: Enums<"conversation_status">
  unreadCount: number
  needsHuman: boolean
  assignedUserId: string | null
  lastMessageAt: string
  lastMessage: string
  messages: InboxMessage[]
}

export type InboxData = {
  organizationId: string
  conversations: InboxConversation[]
  whatsappConnected: boolean
}

export type InsightsData = {
  generatedAt: string
  timezone: string
  totalContacts: number
  currentNeedsHuman: number
  conversations: Array<{
    id: string
    contactId: string
    status: Enums<"conversation_status">
    needsHuman: boolean
    createdAt: string
    updatedAt: string
  }>
  messages: Array<{
    conversationId: string
    direction: Enums<"message_direction">
    senderType: Enums<"message_sender_type">
    timestamp: string
  }>
}

export type SettingsData = {
  organization: WorkspaceOrganization
  role: Enums<"organization_member_role">
  organizationCount: number
  aiSettings: {
    available: boolean
    responseMode: "draft" | "auto"
    autoReplyMinConfidence: number
  }
  channels: Array<
    ChannelSummary & {
      metaConfigurationVisible: boolean
      metaIdentifiersConfigured: boolean
      webhookSubscriptionStatus: string | null
    }
  >
}
