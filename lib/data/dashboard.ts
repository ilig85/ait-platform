import "server-only"

import { createClient } from "@/lib/supabase/server"
import { getCurrentWorkspace } from "@/lib/data/workspace"
import type {
  ChannelSummary,
  CustomerRecord,
  CustomersData,
  InboxData,
  InboxMessage,
  InsightsData,
  Loadable,
  OverviewData,
  SettingsData,
} from "@/lib/data/models"

function unavailable<T>(
  workspace: Awaited<ReturnType<typeof getCurrentWorkspace>>,
): Loadable<T> | null {
  if (workspace.status === "ready") return null
  if (workspace.status === "missing_membership") {
    return { status: "missing_membership", message: workspace.message }
  }
  return {
    status: "error",
    message: workspace.status === "error"
      ? workspace.message
      : "Please sign in to view this page.",
  }
}

function queryError<T>(area: string, errors: Array<{ message: string } | null>): Loadable<T> | null {
  const error = errors.find(Boolean)
  if (!error) return null
  console.error(`[data] Unable to load ${area}`, error.message)
  return { status: "error", message: `We could not load ${area}. Please refresh and try again.` }
}

function toChannelSummary(row: {
  id: string
  channel_type: string
  provider: string
  display_name: string | null
  status: ChannelSummary["status"]
  connected_phone_number: string | null
  connected_at: string | null
  last_error: string | null
}): ChannelSummary {
  return {
    id: row.id,
    channelType: row.channel_type,
    provider: row.provider,
    displayName: row.display_name,
    status: row.status,
    connectedPhoneNumber: row.connected_phone_number,
    connectedAt: row.connected_at,
    lastError: row.last_error,
  }
}

function timestampOrCreated(providerTimestamp: string | null, createdAt: string) {
  return providerTimestamp ?? createdAt
}

function normalizeTimezone(value: string) {
  try {
    new Intl.DateTimeFormat("en-US", { timeZone: value }).format()
    return value
  } catch {
    return "UTC"
  }
}

function localDayKey(value: string | Date, timezone: string) {
  const parts = new Intl.DateTimeFormat("en-US", {
    timeZone: timezone,
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
  }).formatToParts(new Date(value))
  const values = Object.fromEntries(parts.map((part) => [part.type, part.value]))
  return `${values.year}-${values.month}-${values.day}`
}

export async function getOverviewData(): Promise<Loadable<OverviewData>> {
  const workspace = await getCurrentWorkspace()
  const blocked = unavailable<OverviewData>(workspace)
  if (blocked || workspace.status !== "ready") return blocked!

  const supabase = await createClient()
  const organizationId = workspace.organization.id
  const weekStart = new Date()
  weekStart.setUTCDate(weekStart.getUTCDate() - 8)

  const [
    contactsCount,
    resolvedCount,
    openCount,
    needsHumanCount,
    conversationsResult,
    messagesResult,
    channelsResult,
    escalationsResult,
    contactsResult,
  ] = await Promise.all([
    supabase.from("contacts").select("id", { count: "exact", head: true }).eq("organization_id", organizationId),
    supabase.from("conversations").select("id", { count: "exact", head: true }).eq("organization_id", organizationId).eq("status", "resolved"),
    supabase.from("conversations").select("id", { count: "exact", head: true }).eq("organization_id", organizationId).in("status", ["open", "pending"]),
    supabase.from("conversations").select("id", { count: "exact", head: true }).eq("organization_id", organizationId).eq("needs_human", true),
    supabase.from("conversations").select("created_at").eq("organization_id", organizationId).gte("created_at", weekStart.toISOString()),
    supabase.from("messages").select("provider_timestamp, created_at").eq("organization_id", organizationId).gte("created_at", weekStart.toISOString()),
    supabase.from("channel_connections").select("id, channel_type, provider, display_name, status, connected_phone_number, connected_at, last_error").eq("organization_id", organizationId).order("created_at", { ascending: true }),
    supabase.from("conversations").select("id, contact_id, last_message_at, created_at").eq("organization_id", organizationId).eq("needs_human", true).order("last_message_at", { ascending: false, nullsFirst: false }).limit(3),
    supabase.from("contacts").select("id, display_name, phone_number").eq("organization_id", organizationId),
  ])

  const failed = queryError<OverviewData>("the overview", [
    contactsCount.error,
    resolvedCount.error,
    openCount.error,
    needsHumanCount.error,
    conversationsResult.error,
    messagesResult.error,
    channelsResult.error,
    escalationsResult.error,
    contactsResult.error,
  ])
  if (failed) return failed

  const timezone = normalizeTimezone(workspace.organization.timezone || "UTC")
  const now = new Date()
  const days = Array.from({ length: 7 }, (_, index) => {
    const date = new Date(now)
    date.setUTCDate(date.getUTCDate() - (6 - index))
    const key = localDayKey(date, timezone)
    return {
      date: key,
      label: new Intl.DateTimeFormat("en", { weekday: "short", timeZone: timezone }).format(date),
      conversations: 0,
      messages: 0,
    }
  })
  const daily = new Map(days.map((day) => [day.date, day]))

  for (const conversation of conversationsResult.data ?? []) {
    const day = daily.get(localDayKey(conversation.created_at, timezone))
    if (day) day.conversations += 1
  }
  for (const message of messagesResult.data ?? []) {
    const day = daily.get(localDayKey(timestampOrCreated(message.provider_timestamp, message.created_at), timezone))
    if (day) day.messages += 1
  }

  const contactsById = new Map((contactsResult.data ?? []).map((contact) => [contact.id, contact]))

  return {
    status: "ready",
    data: {
      metrics: {
        contacts: contactsCount.count ?? 0,
        resolvedConversations: resolvedCount.count ?? 0,
        openConversations: openCount.count ?? 0,
        needsHuman: needsHumanCount.count ?? 0,
      },
      dailyActivity: days,
      channels: (channelsResult.data ?? []).map(toChannelSummary),
      recentEscalations: (escalationsResult.data ?? []).map((conversation) => {
        const contact = contactsById.get(conversation.contact_id)
        return {
          id: conversation.id,
          contactName: contact?.display_name ?? contact?.phone_number ?? "Unnamed contact",
          lastActivityAt: conversation.last_message_at ?? conversation.created_at,
        }
      }),
    },
  }
}

export async function getCustomersData(): Promise<Loadable<CustomersData>> {
  const workspace = await getCurrentWorkspace()
  const blocked = unavailable<CustomersData>(workspace)
  if (blocked || workspace.status !== "ready") return blocked!

  const supabase = await createClient()
  const organizationId = workspace.organization.id
  const [contactsResult, conversationsResult, messagesResult] = await Promise.all([
    supabase.from("contacts").select("id, display_name, phone_number, external_contact_id, contact_type, ai_analysis_allowed, created_at, updated_at").eq("organization_id", organizationId).order("created_at", { ascending: false }),
    supabase.from("conversations").select("id, contact_id, status, needs_human, last_message_at, created_at").eq("organization_id", organizationId),
    supabase.from("messages").select("conversation_id, direction, text_body, message_type, provider_timestamp, created_at").eq("organization_id", organizationId),
  ])

  const failed = queryError<CustomersData>("customers", [contactsResult.error, conversationsResult.error, messagesResult.error])
  if (failed) return failed

  const messagesByConversation = new Map<string, typeof messagesResult.data>()
  for (const message of messagesResult.data ?? []) {
    const current = messagesByConversation.get(message.conversation_id) ?? []
    current.push(message)
    messagesByConversation.set(message.conversation_id, current)
  }

  const conversationsByContact = new Map<string, CustomerRecord["conversations"]>()
  const messageTotalsByContact = new Map<string, { inbound: number; outbound: number }>()

  for (const conversation of conversationsResult.data ?? []) {
    const conversationMessages = (messagesByConversation.get(conversation.id) ?? []).sort((a, b) =>
      timestampOrCreated(a.provider_timestamp, a.created_at).localeCompare(timestampOrCreated(b.provider_timestamp, b.created_at)),
    )
    const lastMessage = conversationMessages.at(-1)
    const summaries = conversationsByContact.get(conversation.contact_id) ?? []
    summaries.push({
      id: conversation.id,
      status: conversation.status,
      needsHuman: conversation.needs_human,
      lastMessageAt: conversation.last_message_at
        ?? (lastMessage ? timestampOrCreated(lastMessage.provider_timestamp, lastMessage.created_at) : conversation.created_at),
      lastMessage: lastMessage?.text_body ?? (lastMessage ? `[${lastMessage.message_type}]` : "No messages yet"),
      messageCount: conversationMessages.length,
    })
    conversationsByContact.set(conversation.contact_id, summaries)

    const totals = messageTotalsByContact.get(conversation.contact_id) ?? { inbound: 0, outbound: 0 }
    for (const message of conversationMessages) totals[message.direction] += 1
    messageTotalsByContact.set(conversation.contact_id, totals)
  }

  const customers = (contactsResult.data ?? []).map<CustomerRecord>((contact) => {
    const conversations = (conversationsByContact.get(contact.id) ?? []).sort((a, b) =>
      b.lastMessageAt.localeCompare(a.lastMessageAt),
    )
    const totals = messageTotalsByContact.get(contact.id) ?? { inbound: 0, outbound: 0 }
    return {
      id: contact.id,
      displayName: contact.display_name ?? contact.phone_number ?? "Unnamed contact",
      phoneNumber: contact.phone_number,
      externalContactId: contact.external_contact_id,
      contactType: contact.contact_type,
      aiAnalysisAllowed: contact.ai_analysis_allowed,
      createdAt: contact.created_at,
      updatedAt: contact.updated_at,
      lastContactAt: conversations[0]?.lastMessageAt ?? contact.updated_at,
      conversations,
      inboundMessageCount: totals.inbound,
      outboundMessageCount: totals.outbound,
    }
  })

  customers.sort((a, b) => b.lastContactAt.localeCompare(a.lastContactAt))
  return { status: "ready", data: { customers } }
}

export async function getInboxData(): Promise<Loadable<InboxData>> {
  const workspace = await getCurrentWorkspace()
  const blocked = unavailable<InboxData>(workspace)
  if (blocked || workspace.status !== "ready") return blocked!

  const supabase = await createClient()
  const organizationId = workspace.organization.id
  const [contactsResult, conversationsResult, messagesResult, channelsResult] = await Promise.all([
    supabase.from("contacts").select("id, display_name, phone_number, contact_type, ai_analysis_allowed").eq("organization_id", organizationId),
    supabase.from("conversations").select("id, contact_id, status, unread_count, needs_human, assigned_user_id, last_message_at, created_at").eq("organization_id", organizationId),
    supabase.from("messages").select("id, conversation_id, direction, sender_type, message_type, text_body, delivery_status, provider_timestamp, created_at").eq("organization_id", organizationId),
    supabase.from("channel_connections").select("channel_type, status").eq("organization_id", organizationId),
  ])

  const failed = queryError<InboxData>("the inbox", [contactsResult.error, conversationsResult.error, messagesResult.error, channelsResult.error])
  if (failed) return failed

  const contactsById = new Map((contactsResult.data ?? []).map((contact) => [contact.id, contact]))
  const messagesByConversation = new Map<string, InboxMessage[]>()

  for (const message of messagesResult.data ?? []) {
    const current = messagesByConversation.get(message.conversation_id) ?? []
    current.push({
      id: message.id,
      direction: message.direction,
      senderType: message.sender_type,
      messageType: message.message_type,
      textBody: message.text_body,
      deliveryStatus: message.delivery_status,
      timestamp: timestampOrCreated(message.provider_timestamp, message.created_at),
    })
    messagesByConversation.set(message.conversation_id, current)
  }

  const conversations = (conversationsResult.data ?? []).map((conversation) => {
    const contact = contactsById.get(conversation.contact_id)
    const messages = (messagesByConversation.get(conversation.id) ?? []).sort((a, b) =>
      a.timestamp.localeCompare(b.timestamp),
    )
    const lastMessage = messages.at(-1)
    return {
      id: conversation.id,
      contactId: conversation.contact_id,
      contactName: contact?.display_name ?? contact?.phone_number ?? "Unnamed contact",
      phoneNumber: contact?.phone_number ?? null,
      contactType: contact?.contact_type ?? "unknown" as const,
      aiAnalysisAllowed: contact?.ai_analysis_allowed ?? false,
      status: conversation.status,
      unreadCount: conversation.unread_count,
      needsHuman: conversation.needs_human,
      assignedUserId: conversation.assigned_user_id,
      lastMessageAt: conversation.last_message_at ?? lastMessage?.timestamp ?? conversation.created_at,
      lastMessage: lastMessage?.textBody ?? (lastMessage ? `[${lastMessage.messageType}]` : "No messages yet"),
      messages,
    }
  })
  conversations.sort((a, b) => b.lastMessageAt.localeCompare(a.lastMessageAt))

  return {
    status: "ready",
    data: {
      conversations,
      whatsappConnected: (channelsResult.data ?? []).some(
        (channel) => channel.channel_type === "whatsapp" && channel.status === "connected",
      ),
    },
  }
}

export async function getInsightsData(): Promise<Loadable<InsightsData>> {
  const workspace = await getCurrentWorkspace()
  const blocked = unavailable<InsightsData>(workspace)
  if (blocked || workspace.status !== "ready") return blocked!

  const supabase = await createClient()
  const organizationId = workspace.organization.id
  const generatedAt = new Date()
  const historyStart = new Date(generatedAt)
  historyStart.setUTCDate(historyStart.getUTCDate() - 91)
  const historyStartIso = historyStart.toISOString()

  const [contactsCount, needsHumanCount, conversationsResult, messagesResult] = await Promise.all([
    supabase.from("contacts").select("id", { count: "exact", head: true }).eq("organization_id", organizationId),
    supabase.from("conversations").select("id", { count: "exact", head: true }).eq("organization_id", organizationId).eq("needs_human", true),
    supabase.from("conversations").select("id, contact_id, status, needs_human, created_at, updated_at").eq("organization_id", organizationId).or(`created_at.gte.${historyStartIso},updated_at.gte.${historyStartIso}`),
    supabase.from("messages").select("conversation_id, direction, sender_type, provider_timestamp, created_at").eq("organization_id", organizationId).gte("created_at", historyStartIso),
  ])

  const failed = queryError<InsightsData>("insights", [contactsCount.error, needsHumanCount.error, conversationsResult.error, messagesResult.error])
  if (failed) return failed

  return {
    status: "ready",
    data: {
      generatedAt: generatedAt.toISOString(),
      timezone: normalizeTimezone(workspace.organization.timezone || "UTC"),
      totalContacts: contactsCount.count ?? 0,
      currentNeedsHuman: needsHumanCount.count ?? 0,
      conversations: (conversationsResult.data ?? []).map((conversation) => ({
        id: conversation.id,
        contactId: conversation.contact_id,
        status: conversation.status,
        needsHuman: conversation.needs_human,
        createdAt: conversation.created_at,
        updatedAt: conversation.updated_at,
      })),
      messages: (messagesResult.data ?? []).map((message) => ({
        conversationId: message.conversation_id,
        direction: message.direction,
        senderType: message.sender_type,
        timestamp: timestampOrCreated(message.provider_timestamp, message.created_at),
      })),
    },
  }
}

export async function getSettingsData(): Promise<Loadable<SettingsData>> {
  const workspace = await getCurrentWorkspace()
  const blocked = unavailable<SettingsData>(workspace)
  if (blocked || workspace.status !== "ready") return blocked!

  const supabase = await createClient()
  const organizationId = workspace.organization.id
  const channelsResult = await supabase
    .from("channel_connections")
    .select("id, channel_type, provider, display_name, status, connected_phone_number, connected_at, last_error")
    .eq("organization_id", organizationId)
    .order("created_at", { ascending: true })

  const failed = queryError<SettingsData>("settings", [channelsResult.error])
  if (failed) return failed

  const selectedChannelIds = (channelsResult.data ?? []).map((channel) => channel.id)
  let metaRows: Array<{ channel_connection_id: string; webhook_subscription_status: string }> = []

  if (workspace.role === "owner" && selectedChannelIds.length > 0) {
    const metaResult = await supabase
      .from("meta_whatsapp_connections")
      .select("channel_connection_id, webhook_subscription_status")
      .in("channel_connection_id", selectedChannelIds)
    const metaFailed = queryError<SettingsData>("provider-specific channel settings", [metaResult.error])
    if (metaFailed) return metaFailed
    metaRows = metaResult.data ?? []
  }

  const metaByConnection = new Map(metaRows.map((row) => [row.channel_connection_id, row]))

  return {
    status: "ready",
    data: {
      organization: workspace.organization,
      role: workspace.role,
      organizationCount: workspace.organizationCount,
      channels: (channelsResult.data ?? []).map((channel) => {
        const meta = metaByConnection.get(channel.id)
        return {
          ...toChannelSummary(channel),
          metaConfigurationVisible: workspace.role === "owner",
          metaIdentifiersConfigured: Boolean(meta),
          webhookSubscriptionStatus: meta?.webhook_subscription_status ?? null,
        }
      }),
    },
  }
}
