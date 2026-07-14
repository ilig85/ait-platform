// AIT Mock Data — Bishkek service business demo workspace
// All names and data are fictional. Label as "Demo Data" in UI.

export type ServiceResult<T> = 
  | { status: "success"; data: T }
  | { status: "configuration_required"; reason: string }
  | { status: "failed"; error: string }

// ─── Auth ─────────────────────────────────────────────────────────────────────
export interface AuthUser {
  id: string
  name: string
  email: string
  role: "owner" | "manager" | "viewer"
  avatar: string
  language: "en" | "ru" | "ky"
  timezone: string
}

export const DEMO_USER: AuthUser = {
  id: "user-1",
  name: "Айгерим Бекова",
  email: "aigrim@bishkek-cleanpro.kg",
  role: "owner",
  avatar: "АБ",
  language: "ru",
  timezone: "Asia/Bishkek",
}

// ─── Business ─────────────────────────────────────────────────────────────────
export interface BusinessProfile {
  name: string
  category: string
  description: string
  address: string
  workingHours: string
  replyLanguages: string[]
  timezone: string
}

export const DEMO_BUSINESS: BusinessProfile = {
  name: "CleanPro Bishkek",
  category: "Cleaning & Home Services",
  description: "Professional cleaning services for homes and offices in Bishkek and nearby areas.",
  address: "ул. Киевская, 98, Бишкек, Кыргызстан",
  workingHours: "Mon–Sat 08:00–20:00",
  replyLanguages: ["ru", "ky", "en"],
  timezone: "Asia/Bishkek",
}

// ─── Customers ────────────────────────────────────────────────────────────────
export type Sentiment = "positive" | "neutral" | "negative"
export type CustomerLanguage = "ru" | "ky" | "en"

export interface Customer {
  id: string
  name: string
  phone: string
  language: CustomerLanguage
  tags: string[]
  lastContact: string
  conversationStatus: "ai_active" | "needs_human" | "resolved" | "idle"
  sentiment: Sentiment
  aiHandledCount: number
  humanEscalationCount: number
  assignedManager?: string
  notes: string[]
  interests: string[]
  totalConversations: number
}

export const DEMO_CUSTOMERS: Customer[] = [
  {
    id: "c1", name: "Нурбек Асанов", phone: "+996 700 ***123",
    language: "ky", tags: ["regular", "office"], lastContact: "2025-07-14T09:32:00Z",
    conversationStatus: "ai_active", sentiment: "positive",
    aiHandledCount: 8, humanEscalationCount: 1, assignedManager: "Айгерим Бекова",
    notes: ["Prefers morning calls", "Office on 3rd floor"], interests: ["office cleaning", "window washing"],
    totalConversations: 12,
  },
  {
    id: "c2", name: "Гүлнара Тоқомбаева", phone: "+996 555 ***456",
    language: "ru", tags: ["new", "residential"], lastContact: "2025-07-14T08:15:00Z",
    conversationStatus: "needs_human", sentiment: "neutral",
    aiHandledCount: 2, humanEscalationCount: 2, assignedManager: undefined,
    notes: ["Has two small children"], interests: ["deep clean", "move-in cleaning"],
    totalConversations: 3,
  },
  {
    id: "c3", name: "Азиз Джалилов", phone: "+996 770 ***789",
    language: "ru", tags: ["vip", "corporate"], lastContact: "2025-07-13T16:00:00Z",
    conversationStatus: "resolved", sentiment: "positive",
    aiHandledCount: 15, humanEscalationCount: 0, assignedManager: "Айгерим Бекова",
    notes: ["Corporate account — monthly billing"], interests: ["office", "post-construction"],
    totalConversations: 18,
  },
  {
    id: "c4", name: "Айжан Молдоканова", phone: "+996 500 ***321",
    language: "ky", tags: ["regular"], lastContact: "2025-07-12T11:00:00Z",
    conversationStatus: "resolved", sentiment: "positive",
    aiHandledCount: 6, humanEscalationCount: 0, assignedManager: undefined,
    notes: [], interests: ["home cleaning"],
    totalConversations: 7,
  },
  {
    id: "c5", name: "Тимур Мамытбеков", phone: "+996 312 ***654",
    language: "en", tags: ["expat"], lastContact: "2025-07-11T14:30:00Z",
    conversationStatus: "idle", sentiment: "neutral",
    aiHandledCount: 3, humanEscalationCount: 1, assignedManager: undefined,
    notes: ["English preferred"], interests: ["apartment cleaning"],
    totalConversations: 4,
  },
  {
    id: "c6", name: "Бегимай Эргешова", phone: "+996 700 ***987",
    language: "ru", tags: ["new"], lastContact: "2025-07-10T10:00:00Z",
    conversationStatus: "idle", sentiment: "negative",
    aiHandledCount: 1, humanEscalationCount: 1, assignedManager: "Бакыт Осмонов",
    notes: ["Had a complaint about timing"], interests: ["home cleaning"],
    totalConversations: 2,
  },
]

// ─── Conversations ─────────────────────────────────────────────────────────────
export type MessageSender = "customer" | "ai" | "manager"
export type ConvStatus = "ai_active" | "needs_human" | "resolved" | "idle"

export interface Message {
  id: string
  sender: MessageSender
  text: string
  timestamp: string
  isInternal?: boolean
  aiDraft?: boolean
  deliveryStatus?: "sent" | "delivered" | "read"
  knowledgeSources?: string[]
}

export interface Conversation {
  id: string
  customerId: string
  customerName: string
  customerLanguage: CustomerLanguage
  lastMessage: string
  lastMessageTime: string
  unreadCount: number
  status: ConvStatus
  priority: "high" | "medium" | "low"
  assignedManager?: string
  messages: Message[]
  channel: "whatsapp"
  sentiment: Sentiment
  tags: string[]
}

export const DEMO_CONVERSATIONS: Conversation[] = [
  {
    id: "conv1", customerId: "c2", customerName: "Гүлнара Тоқомбаева",
    customerLanguage: "ru", channel: "whatsapp",
    lastMessage: "Можете ли вы приехать в субботу утром?", lastMessageTime: "2025-07-14T08:15:00Z",
    unreadCount: 2, status: "needs_human", priority: "high",
    assignedManager: undefined, sentiment: "neutral", tags: ["move-in"],
    messages: [
      { id: "m1", sender: "customer", text: "Здравствуйте! Мне нужна уборка перед заездом.", timestamp: "2025-07-14T08:10:00Z" },
      { id: "m2", sender: "ai", text: "Добрый день! Рада помочь. Когда вам удобно, чтобы мы приехали?", timestamp: "2025-07-14T08:11:00Z", deliveryStatus: "read" },
      { id: "m3", sender: "customer", text: "Можете ли вы приехать в субботу утром?", timestamp: "2025-07-14T08:15:00Z" },
      { id: "m4", sender: "ai", text: "Суббота утром доступна. Ваш адрес?", timestamp: "2025-07-14T08:15:30Z", aiDraft: true, knowledgeSources: ["Working hours", "Service areas"] },
    ],
  },
  {
    id: "conv2", customerId: "c1", customerName: "Нурбек Асанов",
    customerLanguage: "ky", channel: "whatsapp",
    lastMessage: "Рахмат! Ушул жума жакшы болот.", lastMessageTime: "2025-07-14T09:32:00Z",
    unreadCount: 0, status: "ai_active", priority: "medium",
    assignedManager: "Айгерим Бекова", sentiment: "positive", tags: ["office", "weekly"],
    messages: [
      { id: "m5", sender: "customer", text: "Кийинки жума кеңсени тазалоого болобу?", timestamp: "2025-07-14T09:20:00Z" },
      { id: "m6", sender: "ai", text: "Ооба, кийинки жума дүйшөмбүдөн жума күнгө чейин жетүүчүбүз. Качан ыңгайлуу?", timestamp: "2025-07-14T09:21:00Z", deliveryStatus: "read" },
      { id: "m7", sender: "customer", text: "Рахмат! Ушул жума жакшы болот.", timestamp: "2025-07-14T09:32:00Z" },
    ],
  },
  {
    id: "conv3", customerId: "c3", customerName: "Азиз Джалилов",
    customerLanguage: "ru", channel: "whatsapp",
    lastMessage: "Всё прошло отлично, спасибо команде!", lastMessageTime: "2025-07-13T16:00:00Z",
    unreadCount: 0, status: "resolved", priority: "low",
    assignedManager: "Айгерим Бекова", sentiment: "positive", tags: ["corporate"],
    messages: [
      { id: "m8", sender: "customer", text: "Команда приехала вовремя, отличная работа.", timestamp: "2025-07-13T15:50:00Z" },
      { id: "m9", sender: "ai", text: "Благодарим за отзыв! Ждём вас снова.", timestamp: "2025-07-13T15:51:00Z", deliveryStatus: "read" },
      { id: "m10", sender: "customer", text: "Всё прошло отлично, спасибо команде!", timestamp: "2025-07-13T16:00:00Z" },
    ],
  },
  {
    id: "conv4", customerId: "c6", customerName: "Бегимай Эргешова",
    customerLanguage: "ru", channel: "whatsapp",
    lastMessage: "Ваша команда опоздала на два часа.", lastMessageTime: "2025-07-10T10:00:00Z",
    unreadCount: 1, status: "needs_human", priority: "high",
    assignedManager: "Бакыт Осмонов", sentiment: "negative", tags: ["complaint"],
    messages: [
      { id: "m11", sender: "customer", text: "Ваша команда опоздала на два часа. Это неприемлемо.", timestamp: "2025-07-10T10:00:00Z" },
      { id: "m12", sender: "ai", text: "Приношу искренние извинения за задержку. Передаю вас менеджеру.", timestamp: "2025-07-10T10:01:00Z", deliveryStatus: "read" },
      { id: "m12b", sender: "manager", text: "Бегимай, добрый день. Я Бакыт, менеджер. Понимаю ваше неудобство. Можем ли мы компенсировать скидкой на следующую уборку?", timestamp: "2025-07-10T10:30:00Z", isInternal: false },
    ],
  },
  {
    id: "conv5", customerId: "c5", customerName: "Тимур Мамытбеков",
    customerLanguage: "en", channel: "whatsapp",
    lastMessage: "What's the price for a 3-bedroom apartment?", lastMessageTime: "2025-07-11T14:30:00Z",
    unreadCount: 0, status: "idle", priority: "low",
    assignedManager: undefined, sentiment: "neutral", tags: [],
    messages: [
      { id: "m13", sender: "customer", text: "What's the price for a 3-bedroom apartment?", timestamp: "2025-07-11T14:30:00Z" },
      { id: "m14", sender: "ai", text: "Hi! For a 3-bedroom apartment, our standard clean starts at 2,500 KGS. Would you like a detailed quote?", timestamp: "2025-07-11T14:31:00Z", deliveryStatus: "read", knowledgeSources: ["Prices"] },
    ],
  },
]

// ─── AI Tasks ─────────────────────────────────────────────────────────────────
export type TaskStatus = "draft" | "awaiting_approval" | "scheduled" | "running" | "completed" | "failed" | "configuration_required"

export interface AITask {
  id: string
  title: string
  instruction: string
  targetDescription: string
  action: string
  creator: string
  riskLevel: "low" | "medium" | "high"
  requiresApproval: boolean
  status: TaskStatus
  scheduledAt?: string
  completedAt?: string
  resultSummary?: string
  relatedConversationIds: string[]
  createdAt: string
}

export const DEMO_AI_TASKS: AITask[] = [
  {
    id: "t1", title: "Follow up with unresolved customers",
    instruction: "Draft a polite follow-up message for customers who had unresolved queries last week.",
    targetDescription: "Customers with 'needs_human' status older than 48h",
    action: "draft_followup", creator: "Айгерим Бекова",
    riskLevel: "medium", requiresApproval: true, status: "awaiting_approval",
    relatedConversationIds: ["conv4"], createdAt: "2025-07-13T10:00:00Z",
  },
  {
    id: "t2", title: "Identify unanswered pricing questions",
    instruction: "Review inbox conversations from the last 7 days and find any unanswered pricing questions.",
    targetDescription: "All conversations — last 7 days",
    action: "identify_unanswered", creator: "Айгерим Бекова",
    riskLevel: "low", requiresApproval: false, status: "completed",
    completedAt: "2025-07-13T12:00:00Z",
    resultSummary: "Found 3 conversations with unanswered pricing queries. Knowledge base updated.",
    relatedConversationIds: ["conv5"], createdAt: "2025-07-13T08:00:00Z",
  },
  {
    id: "t3", title: "Summarize weekly conversation themes",
    instruction: "Summarize the top 5 topics customers asked about this week.",
    targetDescription: "All resolved conversations — this week",
    action: "summarize", creator: "Бакыт Осмонов",
    riskLevel: "low", requiresApproval: false, status: "scheduled",
    scheduledAt: "2025-07-14T18:00:00Z",
    relatedConversationIds: [], createdAt: "2025-07-14T09:00:00Z",
  },
  {
    id: "t4", title: "Tag corporate accounts",
    instruction: "Review customers and add the 'corporate' tag to any with business addresses.",
    targetDescription: "All customers",
    action: "tag_conversations", creator: "Айгерим Бекова",
    riskLevel: "low", requiresApproval: true, status: "configuration_required",
    relatedConversationIds: [], createdAt: "2025-07-12T11:00:00Z",
  },
]

// ─── Knowledge ────────────────────────────────────────────────────────────────
export type KnowledgeStatus = "verified" | "draft" | "needs_review" | "outdated" | "archived"
export type KnowledgeType = "faq" | "product" | "price" | "policy" | "delivery" | "hours"

export interface KnowledgeItem {
  id: string
  type: KnowledgeType
  title: string
  content: string
  languages: string[]
  status: KnowledgeStatus
  lastEditor: string
  lastVerified: string
  usageCount: number
  source: "manual" | "ai_suggestion" | "upload"
}

export const DEMO_KNOWLEDGE: KnowledgeItem[] = [
  {
    id: "k1", type: "faq", title: "What areas do you serve?",
    content: "We currently serve all districts of Bishkek city, including Pervomaysky, Oktyabrsky, Sverdlovsky, and Leninskiy.",
    languages: ["ru", "en", "ky"], status: "verified",
    lastEditor: "Айгерим Бекова", lastVerified: "2025-07-10T00:00:00Z", usageCount: 47, source: "manual",
  },
  {
    id: "k2", type: "price", title: "Prices — Home Cleaning",
    content: "1-bedroom: 1,800 KGS | 2-bedroom: 2,200 KGS | 3-bedroom: 2,500 KGS | 4+ bedroom: from 3,000 KGS. Deep clean +30%.",
    languages: ["ru", "ky"], status: "verified",
    lastEditor: "Айгерим Бекова", lastVerified: "2025-07-01T00:00:00Z", usageCount: 92, source: "manual",
  },
  {
    id: "k3", type: "hours", title: "Working hours",
    content: "Monday to Saturday, 08:00–20:00. Sunday — days off. Public holidays may vary.",
    languages: ["ru", "en", "ky"], status: "verified",
    lastEditor: "Айгерим Бекова", lastVerified: "2025-07-05T00:00:00Z", usageCount: 38, source: "manual",
  },
  {
    id: "k4", type: "delivery", title: "How do I book a cleaning?",
    content: "Send us a WhatsApp message with your address, preferred date, and apartment size. We confirm within 30 minutes during working hours.",
    languages: ["ru", "en"], status: "needs_review",
    lastEditor: "Бакыт Осмонов", lastVerified: "2025-06-15T00:00:00Z", usageCount: 55, source: "manual",
  },
  {
    id: "k5", type: "policy", title: "Cancellation policy",
    content: "You can cancel or reschedule up to 24 hours before the appointment at no charge. Late cancellations may incur a 500 KGS fee.",
    languages: ["ru"], status: "draft",
    lastEditor: "Айгерим Бекова", lastVerified: "2025-07-12T00:00:00Z", usageCount: 0, source: "manual",
  },
  {
    id: "k6", type: "faq", title: "Do you bring your own supplies?",
    content: "Yes, all cleaning equipment and supplies are provided by CleanPro at no extra charge. If you have specific product preferences, let us know.",
    languages: ["ru", "en", "ky"], status: "verified",
    lastEditor: "Айгерим Бекова", lastVerified: "2025-07-08T00:00:00Z", usageCount: 29, source: "manual",
  },
  {
    id: "k7", type: "faq", title: "Post-construction cleaning pricing",
    content: "Post-construction pricing depends on space size and degree of dust/debris. AI suggestion based on recent conversations.",
    languages: ["ru"], status: "needs_review",
    lastEditor: "AI", lastVerified: "2025-07-14T06:00:00Z", usageCount: 0, source: "ai_suggestion",
  },
]

// ─── Analytics / Insights ──────────────────────────────────────────────────────
export interface DailyConvData {
  day: string
  shortDay: string
  customers: number
  resolved: number
  escalated: number
}

export const DEMO_DAILY_DATA: DailyConvData[] = [
  { day: "Monday", shortDay: "Mon", customers: 14, resolved: 11, escalated: 2 },
  { day: "Tuesday", shortDay: "Tue", customers: 18, resolved: 15, escalated: 1 },
  { day: "Wednesday", shortDay: "Wed", customers: 22, resolved: 18, escalated: 3 },
  { day: "Thursday", shortDay: "Thu", customers: 16, resolved: 14, escalated: 1 },
  { day: "Friday", shortDay: "Fri", customers: 25, resolved: 20, escalated: 3 },
  { day: "Saturday", shortDay: "Sat", customers: 19, resolved: 16, escalated: 2 },
  { day: "Sunday", shortDay: "Sun", customers: 7, resolved: 6, escalated: 1 },
]

export const DEMO_METRICS = {
  customersContacted: 121,
  customersContactedChange: +8,
  aiResolved: 89,
  aiResolvedChange: +12,
  aiActive: 4,
  aiActiveChange: -1,
  needsHuman: 3,
  needsHumanChange: +1,
  avgFirstResponseMin: 3.2,
  aiResolutionRate: 73.6,
  estimatedTimeSavedHours: 14,
}

export const DEMO_TOPICS = [
  { topic: "Pricing", count: 38, lang: "ru" },
  { topic: "Booking", count: 31, lang: "ru" },
  { topic: "Service areas", count: 22, lang: "ky" },
  { topic: "Working hours", count: 19, lang: "ru" },
  { topic: "Post-construction", count: 11, lang: "ru" },
  { topic: "Cancellation", count: 8, lang: "en" },
]

export const DEMO_PEAK_HOURS = [
  { hour: "08:00", count: 8 }, { hour: "09:00", count: 14 }, { hour: "10:00", count: 22 },
  { hour: "11:00", count: 19 }, { hour: "12:00", count: 11 }, { hour: "13:00", count: 9 },
  { hour: "14:00", count: 16 }, { hour: "15:00", count: 21 }, { hour: "16:00", count: 18 },
  { hour: "17:00", count: 24 }, { hour: "18:00", count: 20 }, { hour: "19:00", count: 12 },
]

// ─── Team Members ─────────────────────────────────────────────────────────────
export interface TeamMember {
  id: string
  name: string
  email: string
  role: "owner" | "manager" | "viewer"
  status: "active" | "invited" | "inactive"
  avatar: string
  lastActive: string
}

export const DEMO_TEAM: TeamMember[] = [
  { id: "tm1", name: "Айгерим Бекова", email: "aigrim@bishkek-cleanpro.kg", role: "owner", status: "active", avatar: "АБ", lastActive: "Now" },
  { id: "tm2", name: "Бакыт Осмонов", email: "bakyt@bishkek-cleanpro.kg", role: "manager", status: "active", avatar: "БО", lastActive: "2h ago" },
  { id: "tm3", name: "Самира Жумабекова", email: "samira@bishkek-cleanpro.kg", role: "viewer", status: "invited", avatar: "СЖ", lastActive: "—" },
]

// ─── Channel Status ────────────────────────────────────────────────────────────
export type ChannelStatus = "connected" | "disconnected" | "error" | "configuration_required"

export interface ChannelHealth {
  id: string
  name: string
  type: "whatsapp" | "instagram" | "telegram"
  status: ChannelStatus
  phone?: string
  connectedAt?: string
  lastActivity?: string
}

export const DEMO_CHANNELS: ChannelHealth[] = [
  {
    id: "ch1", name: "WhatsApp Business", type: "whatsapp",
    status: "configuration_required",
    phone: undefined, connectedAt: undefined, lastActivity: undefined,
  },
]

// ─── Alerts ───────────────────────────────────────────────────────────────────
export interface Alert {
  id: string
  type: "escalation" | "channel" | "knowledge" | "task" | "info"
  message: string
  time: string
  read: boolean
  link?: string
}

export const DEMO_ALERTS: Alert[] = [
  { id: "a1", type: "escalation", message: "Бегимай Эргешова — complaint needs manager attention", time: "2025-07-10T10:02:00Z", read: false, link: "/inbox" },
  { id: "a2", type: "escalation", message: "Гүлнара Тоқомбаева — move-in booking, human needed", time: "2025-07-14T08:16:00Z", read: false, link: "/inbox" },
  { id: "a3", type: "knowledge", message: "Post-construction pricing suggestion needs review", time: "2025-07-14T06:01:00Z", read: false, link: "/knowledge" },
  { id: "a4", type: "channel", message: "WhatsApp channel not connected — messages cannot be sent", time: "2025-07-14T00:00:00Z", read: false, link: "/settings" },
  { id: "a5", type: "task", message: "AI task awaiting approval: Follow up with unresolved customers", time: "2025-07-13T10:01:00Z", read: true, link: "/ai-tasks" },
]
