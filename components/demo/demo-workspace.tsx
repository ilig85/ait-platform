"use client"

import { useMemo, useState } from "react"
import Link from "next/link"
import {
  AlertCircle,
  BarChart3,
  BookOpen,
  Bot,
  CheckCircle2,
  Clock3,
  GraduationCap,
  LayoutDashboard,
  LogOut,
  MessageSquare,
  Play,
  RefreshCw,
  Search,
  Send,
  Settings,
  ShieldCheck,
  Sparkles,
  Users,
} from "lucide-react"
import { AitLogo } from "@/components/brand/ait-logo"
import { cn } from "@/lib/utils"

type Section = "overview" | "inbox" | "tasks" | "customers" | "knowledge" | "insights" | "settings"
type DemoStatus = "open" | "resolved" | "needs_human"

type DemoMessage = {
  id: string
  sender: "customer" | "ai" | "manager"
  text: string
  time: string
}

type DemoConversation = {
  id: string
  name: string
  initials: string
  phone: string
  interest: string
  language: "RU" | "KY"
  status: DemoStatus
  unread: number
  messages: DemoMessage[]
}

const INITIAL_CONVERSATIONS: DemoConversation[] = [
  {
    id: "timur",
    name: "Тимур Асанов",
    initials: "ТА",
    phone: "+996 555 218 440",
    interest: "IELTS · two students",
    language: "RU",
    status: "needs_human",
    unread: 1,
    messages: [
      { id: "t1", sender: "customer", text: "Здравствуйте! Когда начинается следующая группа IELTS и сколько стоит обучение?", time: "10:02" },
      { id: "t2", sender: "ai", text: "Здравствуйте! Следующая группа начинается 5 сентября. Стоимость — 8 000 сом в месяц. Могу также рассказать о расписании.", time: "10:02" },
      { id: "t3", sender: "customer", text: "Если я запишу двоих детей, можете сделать скидку?", time: "10:04" },
    ],
  },
  {
    id: "aizada",
    name: "Айзада Токтосунова",
    initials: "АТ",
    phone: "+996 700 492 112",
    interest: "English Beginner",
    language: "KY",
    status: "open",
    unread: 0,
    messages: [
      { id: "a1", sender: "customer", text: "Саламатсызбы, англис тилин башынан үйрөнгөн топ барбы?", time: "09:41" },
      { id: "a2", sender: "ai", text: "Саламатсызбы! Ооба, Beginner тобу дүйшөмбү, шаршемби жана жума күндөрү саат 18:30да өтөт. Биринчи сабак акысыз.", time: "09:41" },
      { id: "a3", sender: "customer", text: "Рахмат, бүгүн сыноо сабагына келсем болобу?", time: "09:43" },
      { id: "a4", sender: "ai", text: "Ооба, бүгүн 18:30да орун бар. Атыңызды жазып коёюнбу?", time: "09:43" },
    ],
  },
  {
    id: "nurzada",
    name: "Нурзада Мамбетова",
    initials: "НМ",
    phone: "+996 777 316 985",
    interest: "SAT Weekend",
    language: "RU",
    status: "resolved",
    unread: 0,
    messages: [
      { id: "n1", sender: "customer", text: "Есть ли подготовка к SAT по выходным?", time: "Вчера" },
      { id: "n2", sender: "ai", text: "Да. Группа SAT Weekend занимается по субботам и воскресеньям с 11:00 до 13:00. Стоимость — 9 500 сом в месяц.", time: "Вчера" },
      { id: "n3", sender: "customer", text: "Отлично, спасибо!", time: "Вчера" },
    ],
  },
  {
    id: "bek",
    name: "Бек Сыдыков",
    initials: "БС",
    phone: "+996 502 884 731",
    interest: "Trial lesson",
    language: "RU",
    status: "resolved",
    unread: 0,
    messages: [
      { id: "b1", sender: "customer", text: "Где вы находитесь?", time: "Вчера" },
      { id: "b2", sender: "ai", text: "Мы находимся в центре Бишкека: ул. Киевская, 95, рядом с Филармонией. Отправить точку на карте?", time: "Вчера" },
    ],
  },
]

const NAV_ITEMS: Array<{ id: Section; label: string; icon: typeof LayoutDashboard }> = [
  { id: "overview", label: "Overview", icon: LayoutDashboard },
  { id: "inbox", label: "Inbox", icon: MessageSquare },
  { id: "tasks", label: "AI Tasks", icon: Sparkles },
  { id: "customers", label: "Customers", icon: Users },
  { id: "knowledge", label: "Knowledge Base", icon: BookOpen },
  { id: "insights", label: "Insights", icon: BarChart3 },
  { id: "settings", label: "Settings", icon: Settings },
]

const KNOWLEDGE = [
  { title: "IELTS September group", detail: "Starts 5 September · Mon/Wed/Fri · 18:30", type: "Schedule", uses: 34 },
  { title: "IELTS monthly price", detail: "8 000 KGS per month · course materials included", type: "Price", uses: 47 },
  { title: "Beginner trial lesson", detail: "First lesson is free · reservation required", type: "Policy", uses: 29 },
  { title: "SAT Weekend", detail: "Sat/Sun · 11:00–13:00 · 9 500 KGS/month", type: "Course", uses: 18 },
  { title: "Location", detail: "Kievskaya 95, Bishkek · near the Philharmonia", type: "Location", uses: 21 },
]

const TASKS = [
  { title: "Ask manager about sibling discount", customer: "Тимур Асанов", status: "Needs approval", color: "amber" },
  { title: "Reserve today’s Beginner trial lesson", customer: "Айзада Токтосунова", status: "Ready", color: "teal" },
  { title: "Follow up after SAT consultation", customer: "Нурзада Мамбетова", status: "Tomorrow", color: "navy" },
]

const INSIGHT_BARS = [
  { day: "Mon", value: 58 },
  { day: "Tue", value: 76 },
  { day: "Wed", value: 66 },
  { day: "Thu", value: 88 },
  { day: "Fri", value: 72 },
  { day: "Sat", value: 96 },
  { day: "Sun", value: 44 },
]

function statusLabel(status: DemoStatus) {
  if (status === "needs_human") return "Manager needed"
  return status === "resolved" ? "Resolved" : "Open"
}

function StatusBadge({ status }: { status: DemoStatus }) {
  return (
    <span
      className={cn(
        "inline-flex items-center gap-1.5 rounded-full border px-2 py-1 text-[11px] font-semibold",
        status === "needs_human" && "border-amber-300 bg-amber-50 text-amber-800",
        status === "open" && "border-sky-200 bg-sky-50 text-sky-700",
        status === "resolved" && "border-emerald-200 bg-emerald-50 text-emerald-700",
      )}
    >
      <span
        className={cn(
          "h-1.5 w-1.5 rounded-full",
          status === "needs_human" && "bg-amber-500",
          status === "open" && "bg-sky-500",
          status === "resolved" && "bg-emerald-500",
        )}
      />
      {statusLabel(status)}
    </span>
  )
}

function PageHeading({ title, subtitle }: { title: string; subtitle: string }) {
  return (
    <div className="mb-5">
      <h1 className="text-2xl font-bold tracking-tight text-[#14233A]">{title}</h1>
      <p className="mt-1 text-sm text-[#667085]">{subtitle}</p>
    </div>
  )
}

export function DemoWorkspace() {
  const [section, setSection] = useState<Section>("overview")
  const [conversations, setConversations] = useState<DemoConversation[]>(INITIAL_CONVERSATIONS)
  const [activeId, setActiveId] = useState(INITIAL_CONVERSATIONS[0].id)
  const [draft, setDraft] = useState("")
  const [search, setSearch] = useState("")
  const [autoReplies, setAutoReplies] = useState(true)
  const [styleLearning, setStyleLearning] = useState(true)

  const active = conversations.find((conversation) => conversation.id === activeId) ?? conversations[0]
  const needsHuman = conversations.filter((conversation) => conversation.status === "needs_human").length
  const filteredConversations = useMemo(() => {
    const term = search.trim().toLowerCase()
    if (!term) return conversations
    return conversations.filter((conversation) =>
      `${conversation.name} ${conversation.interest}`.toLowerCase().includes(term),
    )
  }, [conversations, search])

  function resetDemo() {
    setConversations(INITIAL_CONVERSATIONS)
    setActiveId(INITIAL_CONVERSATIONS[0].id)
    setDraft("")
    setSection("overview")
  }

  function openConversation(id: string) {
    setActiveId(id)
    setSection("inbox")
    setConversations((current) =>
      current.map((conversation) =>
        conversation.id === id ? { ...conversation, unread: 0 } : conversation,
      ),
    )
  }

  function markHandled() {
    setConversations((current) =>
      current.map((conversation) =>
        conversation.id === active.id
          ? { ...conversation, status: "open", unread: 0 }
          : conversation,
      ),
    )
  }

  function clearDemoThread() {
    if (!window.confirm("Clear the selected demo conversation? You can restore all sample data with Reset demo.")) return
    setConversations((current) =>
      current.map((conversation) =>
        conversation.id === active.id ? { ...conversation, messages: [], unread: 0, status: "open" } : conversation,
      ),
    )
  }

  function addDemoReply() {
    const text = draft.trim()
    if (!text) return
    setConversations((current) =>
      current.map((conversation) =>
        conversation.id === active.id
          ? {
              ...conversation,
              messages: [
                ...conversation.messages,
                { id: `demo-${Date.now()}`, sender: "manager", text, time: "Now" },
              ],
            }
          : conversation,
      ),
    )
    setDraft("")
  }

  function simulateIncoming() {
    const targetId = "aizada"
    setConversations((current) =>
      current.map((conversation) =>
        conversation.id === targetId
          ? {
              ...conversation,
              status: "open",
              unread: conversation.id === activeId && section === "inbox" ? 0 : 1,
              messages: [
                ...conversation.messages,
                {
                  id: `incoming-${Date.now()}`,
                  sender: "customer",
                  text: "Можно забронировать пробный урок на сегодня для двух человек?",
                  time: "Now",
                },
                {
                  id: `reply-${Date.now()}`,
                  sender: "ai",
                  text: "Да, сегодня есть два места на 18:30. Подскажите, пожалуйста, имена учеников — я подготовлю бронь.",
                  time: "Now",
                },
              ],
            }
          : conversation,
      ),
    )
    openConversation(targetId)
  }

  return (
    <div className="min-h-screen bg-[#F7F3EA] text-[#14233A]">
      <div className="fixed inset-y-0 left-0 z-30 hidden w-60 flex-col bg-[#14233A] text-white lg:flex">
        <div className="flex h-16 items-center gap-3 border-b border-white/10 px-5">
          <AitLogo variant="symbol" theme="sidebar" size="sm" label="AIT" />
          <div>
            <p className="font-bold leading-none">AIT</p>
            <p className="mt-1 text-[10px] text-white/45">Ala-Too Learning Center</p>
          </div>
        </div>
        <div className="mx-3 mt-3 rounded-lg border border-[#63A98C]/30 bg-[#63A98C]/10 px-3 py-2.5">
          <div className="flex items-center gap-2 text-xs font-semibold text-[#9ED8BE]">
            <Play className="h-3.5 w-3.5" />
            Interactive demo
          </div>
          <p className="mt-1 text-[10px] leading-relaxed text-white/45">Sample data only. No WhatsApp messages are sent.</p>
        </div>
        <nav className="flex-1 space-y-1 px-3 py-4">
          {NAV_ITEMS.map((item) => {
            const Icon = item.icon
            const badge = item.id === "inbox" ? conversations.reduce((sum, c) => sum + c.unread, 0) : 0
            return (
              <button
                key={item.id}
                type="button"
                onClick={() => setSection(item.id)}
                className={cn(
                  "flex w-full items-center gap-3 rounded-lg px-3 py-2.5 text-left text-sm font-medium transition",
                  section === item.id
                    ? "bg-white/10 text-[#82D4B2]"
                    : "text-white/55 hover:bg-white/5 hover:text-white",
                )}
              >
                <Icon className="h-4 w-4" />
                <span>{item.label}</span>
                {badge > 0 && <span className="ml-auto rounded-full bg-[#C9823B] px-1.5 py-0.5 text-[10px] text-white">{badge}</span>}
              </button>
            )
          })}
        </nav>
        <div className="space-y-1 border-t border-white/10 p-3">
          <button type="button" onClick={resetDemo} className="flex w-full items-center gap-3 rounded-lg px-3 py-2 text-sm text-white/50 hover:bg-white/5 hover:text-white">
            <RefreshCw className="h-4 w-4" />
            Reset demo
          </button>
          <Link href="/login" className="flex items-center gap-3 rounded-lg px-3 py-2 text-sm text-white/50 hover:bg-white/5 hover:text-white">
            <LogOut className="h-4 w-4" />
            Exit demo
          </Link>
        </div>
      </div>

      <main className="min-h-screen lg:pl-60">
        <div className="sticky top-0 z-20 flex items-center justify-between border-b border-[#14233A]/10 bg-[#F7F3EA]/95 px-5 py-3 backdrop-blur lg:px-8">
          <div className="flex items-center gap-2 text-xs font-medium text-[#667085]">
            <span className="inline-flex h-2 w-2 rounded-full bg-[#63A98C]" />
            Demo data · No external actions
          </div>
          <div className="flex items-center gap-2">
            <button type="button" onClick={simulateIncoming} className="inline-flex items-center gap-2 rounded-lg bg-[#2F6F68] px-3 py-2 text-xs font-semibold text-white shadow-sm hover:bg-[#285f59]">
              <Play className="h-3.5 w-3.5" />
              Simulate inquiry
            </button>
            <Link href="/login" className="rounded-lg border border-[#14233A]/15 bg-white/50 px-3 py-2 text-xs font-semibold hover:bg-white">
              Exit
            </Link>
          </div>
        </div>

        <div className="mx-auto max-w-[1400px] p-5 lg:p-8">
          <div className="mb-5 flex gap-2 overflow-x-auto lg:hidden">
            {NAV_ITEMS.map((item) => (
              <button key={item.id} type="button" onClick={() => setSection(item.id)} className={cn("whitespace-nowrap rounded-full px-3 py-1.5 text-xs font-semibold", section === item.id ? "bg-[#14233A] text-white" : "border border-[#14233A]/10 bg-white/60")}>
                {item.label}
              </button>
            ))}
          </div>

          {section === "overview" && (
            <>
              <PageHeading title="Good morning, Aigerim" subtitle="Here is what AIT handled for your education center today." />
              <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
                {[
                  { label: "Customer conversations", value: "184", note: "+12% this week", icon: MessageSquare, color: "text-[#2F6F68]" },
                  { label: "Resolved automatically", value: "76%", note: "140 conversations", icon: Bot, color: "text-[#2F6F68]" },
                  { label: "Median first response", value: "1.8 min", note: "Previously 24 min", icon: Clock3, color: "text-sky-600" },
                  { label: "Manager needed", value: String(needsHuman), note: "Needs your decision", icon: AlertCircle, color: "text-[#C9823B]" },
                ].map((metric) => {
                  const Icon = metric.icon
                  return (
                    <div key={metric.label} className="rounded-2xl border border-[#14233A]/10 bg-white/70 p-5 shadow-sm">
                      <div className="flex items-center justify-between">
                        <p className="text-xs font-semibold text-[#667085]">{metric.label}</p>
                        <Icon className={cn("h-4 w-4", metric.color)} />
                      </div>
                      <p className="mt-4 text-3xl font-bold tracking-tight">{metric.value}</p>
                      <p className="mt-1 text-xs text-[#667085]">{metric.note}</p>
                    </div>
                  )
                })}
              </div>
              <div className="mt-5 grid gap-5 xl:grid-cols-[1.5fr_1fr]">
                <div className="rounded-2xl border border-[#14233A]/10 bg-white/70 p-5 shadow-sm">
                  <div className="mb-4 flex items-center justify-between">
                    <div>
                      <h2 className="font-bold">Recent conversations</h2>
                      <p className="text-xs text-[#667085]">Open any conversation to see AIT’s response.</p>
                    </div>
                    <button type="button" onClick={() => setSection("inbox")} className="text-xs font-semibold text-[#2F6F68] hover:underline">View inbox</button>
                  </div>
                  <div className="divide-y divide-[#14233A]/8">
                    {conversations.slice(0, 4).map((conversation) => (
                      <button key={conversation.id} type="button" onClick={() => openConversation(conversation.id)} className="flex w-full items-center gap-3 py-3 text-left">
                        <div className="flex h-9 w-9 items-center justify-center rounded-full bg-[#DCE9E5] text-xs font-bold">{conversation.initials}</div>
                        <div className="min-w-0 flex-1">
                          <p className="truncate text-sm font-semibold">{conversation.name}</p>
                          <p className="truncate text-xs text-[#667085]">{conversation.messages.at(-1)?.text ?? "Conversation cleared"}</p>
                        </div>
                        <StatusBadge status={conversation.status} />
                      </button>
                    ))}
                  </div>
                </div>
                <div className="rounded-2xl border border-[#14233A]/10 bg-[#14233A] p-5 text-white shadow-sm">
                  <div className="flex items-center gap-2 text-[#9ED8BE]">
                    <Sparkles className="h-4 w-4" />
                    <p className="text-xs font-bold uppercase tracking-wider">Today’s AIT summary</p>
                  </div>
                  <h2 className="mt-5 text-xl font-bold">Customers mostly asked about IELTS pricing and September schedules.</h2>
                  <ul className="mt-5 space-y-3 text-sm text-white/65">
                    <li className="flex gap-2"><CheckCircle2 className="mt-0.5 h-4 w-4 shrink-0 text-[#82D4B2]" />32 routine questions answered instantly</li>
                    <li className="flex gap-2"><CheckCircle2 className="mt-0.5 h-4 w-4 shrink-0 text-[#82D4B2]" />11 trial-lesson requests captured</li>
                    <li className="flex gap-2"><AlertCircle className="mt-0.5 h-4 w-4 shrink-0 text-[#E7B071]" />{needsHuman} pricing decisions waiting</li>
                  </ul>
                </div>
              </div>
            </>
          )}

          {section === "inbox" && (
            <>
              <PageHeading title="Inbox" subtitle="Demo conversations with automatic answers and human handoff." />
              <div className="grid min-h-[650px] overflow-hidden rounded-2xl border border-[#14233A]/10 bg-white/70 shadow-sm xl:grid-cols-[300px_1fr_260px]">
                <div className="border-r border-[#14233A]/10">
                  <div className="border-b border-[#14233A]/10 p-3">
                    <div className="relative">
                      <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-[#667085]" />
                      <input value={search} onChange={(event) => setSearch(event.target.value)} placeholder="Search conversations" className="w-full rounded-lg border border-[#14233A]/10 bg-[#F7F3EA]/70 py-2 pl-9 pr-3 text-xs outline-none focus:border-[#63A98C]" />
                    </div>
                  </div>
                  <div>
                    {filteredConversations.map((conversation) => (
                      <button key={conversation.id} type="button" onClick={() => openConversation(conversation.id)} className={cn("flex w-full gap-3 border-b border-[#14233A]/8 p-3 text-left transition", active.id === conversation.id ? "bg-[#DCE9E5]/70" : "hover:bg-[#F7F3EA]")}>
                        <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-[#DCE9E5] text-xs font-bold">{conversation.initials}</div>
                        <div className="min-w-0 flex-1">
                          <div className="flex items-center gap-2">
                            <p className="truncate text-sm font-semibold">{conversation.name}</p>
                            {conversation.unread > 0 && <span className="ml-auto rounded-full bg-[#2F6F68] px-1.5 py-0.5 text-[9px] text-white">{conversation.unread}</span>}
                          </div>
                          <p className="mt-0.5 truncate text-xs text-[#667085]">{conversation.messages.at(-1)?.text ?? "No visible messages"}</p>
                          <div className="mt-2"><StatusBadge status={conversation.status} /></div>
                        </div>
                      </button>
                    ))}
                  </div>
                </div>

                <div className="flex min-w-0 flex-col">
                  <div className="flex items-center justify-between border-b border-[#14233A]/10 px-4 py-3">
                    <div>
                      <p className="text-sm font-bold">{active.name}</p>
                      <p className="text-[11px] text-[#667085]">{active.interest} · {active.language}</p>
                    </div>
                    <div className="flex items-center gap-2">
                      {active.status === "needs_human" && (
                        <button type="button" onClick={markHandled} className="inline-flex items-center gap-1.5 rounded-lg bg-[#C9823B] px-3 py-2 text-xs font-semibold text-white hover:bg-[#ad6e31]">
                          <CheckCircle2 className="h-3.5 w-3.5" />
                          Mark handled
                        </button>
                      )}
                      <button type="button" onClick={clearDemoThread} className="rounded-lg border border-[#14233A]/10 px-3 py-2 text-xs font-semibold text-[#667085] hover:bg-[#F7F3EA]">Clear demo chat</button>
                    </div>
                  </div>
                  {active.status === "needs_human" && (
                    <div className="flex items-start gap-2 border-b border-amber-200 bg-amber-50 px-4 py-3 text-xs text-amber-900">
                      <AlertCircle className="mt-0.5 h-4 w-4 shrink-0" />
                      AIT found no approved sibling-discount policy. The customer is waiting for a manager’s decision.
                    </div>
                  )}
                  <div className="flex-1 space-y-3 overflow-y-auto bg-[#F7F3EA]/45 p-5">
                    {active.messages.length === 0 ? (
                      <div className="flex h-full min-h-52 items-center justify-center text-center text-sm text-[#667085]">This demo conversation is clear.<br />Use “Simulate inquiry” to add a new example.</div>
                    ) : active.messages.map((message) => (
                      <div key={message.id} className={cn("flex", message.sender === "customer" ? "justify-start" : "justify-end")}>
                        <div className={cn("max-w-[75%] rounded-2xl px-4 py-3 text-sm shadow-sm", message.sender === "customer" ? "rounded-tl-sm border border-[#14233A]/8 bg-white" : message.sender === "ai" ? "rounded-tr-sm bg-[#DCE9E5]" : "rounded-tr-sm bg-[#14233A] text-white")}>
                          {message.sender !== "customer" && <p className="mb-1 text-[10px] font-bold uppercase tracking-wide opacity-55">{message.sender === "ai" ? "AIT · automatic" : "Manager · demo"}</p>}
                          <p className="leading-relaxed">{message.text}</p>
                          <p className="mt-1.5 text-right text-[9px] opacity-40">{message.time}</p>
                        </div>
                      </div>
                    ))}
                  </div>
                  <div className="border-t border-[#14233A]/10 p-3">
                    <p className="mb-2 text-[10px] text-[#667085]">Demo only — this adds a local message and does not contact WhatsApp.</p>
                    <div className="flex gap-2">
                      <input value={draft} onChange={(event) => setDraft(event.target.value)} onKeyDown={(event) => { if (event.key === "Enter") addDemoReply() }} placeholder="Write a demo manager reply…" className="min-w-0 flex-1 rounded-lg border border-[#14233A]/10 bg-white px-3 py-2 text-sm outline-none focus:border-[#63A98C]" />
                      <button type="button" onClick={addDemoReply} disabled={!draft.trim()} className="inline-flex h-10 w-10 items-center justify-center rounded-lg bg-[#2F6F68] text-white disabled:opacity-35"><Send className="h-4 w-4" /></button>
                    </div>
                  </div>
                </div>

                <aside className="hidden border-l border-[#14233A]/10 p-4 xl:block">
                  <div className="flex h-12 w-12 items-center justify-center rounded-full bg-[#DCE9E5] text-sm font-bold">{active.initials}</div>
                  <h3 className="mt-3 font-bold">{active.name}</h3>
                  <p className="text-xs text-[#667085]">{active.phone}</p>
                  <div className="mt-6 space-y-4 text-xs">
                    <div><p className="text-[#667085]">Interest</p><p className="mt-1 font-semibold">{active.interest}</p></div>
                    <div><p className="text-[#667085]">Preferred language</p><p className="mt-1 font-semibold">{active.language}</p></div>
                    <div><p className="text-[#667085]">AI analysis</p><p className="mt-1 inline-flex items-center gap-1.5 font-semibold text-[#2F6F68]"><ShieldCheck className="h-3.5 w-3.5" />Consent recorded</p></div>
                    <div><p className="text-[#667085]">Conversation status</p><div className="mt-2"><StatusBadge status={active.status} /></div></div>
                  </div>
                </aside>
              </div>
            </>
          )}

          {section === "tasks" && (
            <>
              <PageHeading title="AI Tasks" subtitle="Review the work AIT prepared and keep humans in control of business decisions." />
              <div className="grid gap-4 lg:grid-cols-3">
                {TASKS.map((task) => (
                  <div key={task.title} className="rounded-2xl border border-[#14233A]/10 bg-white/70 p-5 shadow-sm">
                    <div className="flex items-center justify-between">
                      <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-[#DCE9E5]"><Sparkles className="h-4 w-4 text-[#2F6F68]" /></div>
                      <span className={cn("rounded-full px-2 py-1 text-[10px] font-bold", task.color === "amber" ? "bg-amber-100 text-amber-800" : task.color === "teal" ? "bg-emerald-100 text-emerald-700" : "bg-slate-100 text-slate-700")}>{task.status}</span>
                    </div>
                    <h2 className="mt-5 font-bold">{task.title}</h2>
                    <p className="mt-1 text-xs text-[#667085]">{task.customer}</p>
                    <button type="button" onClick={() => openConversation(task.customer.startsWith("Тимур") ? "timur" : task.customer.startsWith("Айзада") ? "aizada" : "nurzada")} className="mt-5 text-xs font-bold text-[#2F6F68] hover:underline">Open conversation →</button>
                  </div>
                ))}
              </div>
              <div className="mt-5 rounded-2xl border border-[#14233A]/10 bg-[#14233A] p-6 text-white">
                <div className="flex items-start gap-4">
                  <Bot className="mt-1 h-6 w-6 text-[#82D4B2]" />
                  <div>
                    <h2 className="text-lg font-bold">AIT can act, but your rules decide when.</h2>
                    <p className="mt-2 max-w-3xl text-sm leading-relaxed text-white/60">Routine facts can be answered automatically. Discounts, promises, complaints, refunds, and unsupported questions stay with a manager.</p>
                  </div>
                </div>
              </div>
            </>
          )}

          {section === "customers" && (
            <>
              <PageHeading title="Customers" subtitle="Interests, language, history, and next steps from every conversation." />
              <div className="overflow-hidden rounded-2xl border border-[#14233A]/10 bg-white/70 shadow-sm">
                <div className="grid grid-cols-[1.2fr_1fr_100px_130px] gap-4 border-b border-[#14233A]/10 bg-[#14233A]/[0.03] px-5 py-3 text-[10px] font-bold uppercase tracking-wider text-[#667085]">
                  <span>Customer</span><span>Interest</span><span>Language</span><span>Status</span>
                </div>
                {conversations.map((conversation) => (
                  <button key={conversation.id} type="button" onClick={() => openConversation(conversation.id)} className="grid w-full grid-cols-[1.2fr_1fr_100px_130px] items-center gap-4 border-b border-[#14233A]/8 px-5 py-4 text-left last:border-0 hover:bg-[#F7F3EA]/60">
                    <div className="flex items-center gap-3">
                      <div className="flex h-9 w-9 items-center justify-center rounded-full bg-[#DCE9E5] text-xs font-bold">{conversation.initials}</div>
                      <div><p className="text-sm font-bold">{conversation.name}</p><p className="text-[11px] text-[#667085]">{conversation.phone}</p></div>
                    </div>
                    <p className="text-sm">{conversation.interest}</p>
                    <p className="text-xs font-bold">{conversation.language}</p>
                    <StatusBadge status={conversation.status} />
                  </button>
                ))}
              </div>
            </>
          )}

          {section === "knowledge" && (
            <>
              <PageHeading title="Knowledge Base" subtitle="Manager-approved facts AIT is allowed to use in automatic replies." />
              <div className="mb-5 rounded-2xl border border-[#63A98C]/30 bg-[#DCE9E5]/70 p-5">
                <div className="flex items-start gap-3">
                  <ShieldCheck className="mt-0.5 h-5 w-5 text-[#2F6F68]" />
                  <div><h2 className="font-bold">Verified information only</h2><p className="mt-1 text-sm text-[#667085]">If AIT cannot find a supported answer here, it asks a manager instead of inventing one.</p></div>
                </div>
              </div>
              <div className="grid gap-4 lg:grid-cols-2">
                {KNOWLEDGE.map((item) => (
                  <div key={item.title} className="rounded-2xl border border-[#14233A]/10 bg-white/70 p-5 shadow-sm">
                    <div className="flex items-center justify-between">
                      <span className="rounded-full bg-[#DCE9E5] px-2 py-1 text-[10px] font-bold text-[#2F6F68]">{item.type}</span>
                      <span className="inline-flex items-center gap-1 text-[10px] font-semibold text-emerald-700"><CheckCircle2 className="h-3.5 w-3.5" />Verified</span>
                    </div>
                    <h2 className="mt-4 font-bold">{item.title}</h2>
                    <p className="mt-1 text-sm text-[#667085]">{item.detail}</p>
                    <p className="mt-4 text-[10px] text-[#667085]">Used in {item.uses} demo replies</p>
                  </div>
                ))}
                <div className="rounded-2xl border border-dashed border-[#2F6F68]/35 bg-transparent p-5">
                  <div className="flex h-full min-h-28 flex-col items-center justify-center text-center">
                    <BookOpen className="h-5 w-5 text-[#2F6F68]" />
                    <p className="mt-2 text-sm font-bold">Add approved information</p>
                    <p className="mt-1 text-xs text-[#667085]">Products, prices, schedules, availability, FAQs, and policies.</p>
                  </div>
                </div>
              </div>
            </>
          )}

          {section === "insights" && (
            <>
              <PageHeading title="Insights" subtitle="Turn customer conversations into simple decisions for the business." />
              <div className="grid gap-4 md:grid-cols-3">
                {[
                  ["Most requested course", "IELTS", "38% of inquiries"],
                  ["Best response period", "17:00–20:00", "Peak customer activity"],
                  ["Top customer question", "Price + start date", "47 times this month"],
                ].map(([label, value, note]) => (
                  <div key={label} className="rounded-2xl border border-[#14233A]/10 bg-white/70 p-5 shadow-sm">
                    <p className="text-xs font-semibold text-[#667085]">{label}</p>
                    <p className="mt-4 text-2xl font-bold">{value}</p>
                    <p className="mt-1 text-xs text-[#667085]">{note}</p>
                  </div>
                ))}
              </div>
              <div className="mt-5 grid gap-5 xl:grid-cols-[1.5fr_1fr]">
                <div className="rounded-2xl border border-[#14233A]/10 bg-white/70 p-5 shadow-sm">
                  <h2 className="font-bold">Customer conversations this week</h2>
                  <div className="mt-8 flex h-56 items-end gap-4">
                    {INSIGHT_BARS.map((bar) => (
                      <div key={bar.day} className="flex h-full flex-1 flex-col items-center justify-end gap-2">
                        <div className="w-full rounded-t-lg bg-[#63A98C]" style={{ height: `${bar.value}%` }} />
                        <span className="text-[10px] font-semibold text-[#667085]">{bar.day}</span>
                      </div>
                    ))}
                  </div>
                </div>
                <div className="rounded-2xl border border-[#14233A]/10 bg-white/70 p-5 shadow-sm">
                  <h2 className="font-bold">What customers ask about</h2>
                  <div className="mt-5 space-y-4">
                    {[
                      ["Prices", 82],
                      ["Schedules", 68],
                      ["Trial lessons", 51],
                      ["Location", 34],
                      ["Discounts", 21],
                    ].map(([label, value]) => (
                      <div key={label}>
                        <div className="mb-1.5 flex justify-between text-xs"><span className="font-semibold">{label}</span><span className="text-[#667085]">{value}%</span></div>
                        <div className="h-2 overflow-hidden rounded-full bg-[#14233A]/8"><div className="h-full rounded-full bg-[#2F6F68]" style={{ width: `${value}%` }} /></div>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            </>
          )}

          {section === "settings" && (
            <>
              <PageHeading title="Settings" subtitle="Choose what AIT may do automatically and how it should communicate." />
              <div className="grid gap-5 xl:grid-cols-2">
                <div className="rounded-2xl border border-[#14233A]/10 bg-white/70 p-5 shadow-sm">
                  <div className="flex items-center gap-2"><Bot className="h-4 w-4 text-[#2F6F68]" /><h2 className="font-bold">AI automation</h2></div>
                  <div className="mt-5 space-y-5">
                    <label className="flex items-center justify-between gap-4">
                      <div><p className="text-sm font-semibold">Automatic routine replies</p><p className="text-xs text-[#667085]">Answer only when approved facts clearly support the reply.</p></div>
                      <button type="button" onClick={() => setAutoReplies((value) => !value)} className={cn("relative h-6 w-11 rounded-full transition", autoReplies ? "bg-[#2F6F68]" : "bg-slate-300")}><span className={cn("absolute top-1 h-4 w-4 rounded-full bg-white transition", autoReplies ? "left-6" : "left-1")} /></button>
                    </label>
                    <label className="flex items-center justify-between gap-4">
                      <div><p className="text-sm font-semibold">Manager-style learning</p><p className="text-xs text-[#667085]">Use selected conversations to match tone, formality, and RU/KY switching.</p></div>
                      <button type="button" onClick={() => setStyleLearning((value) => !value)} className={cn("relative h-6 w-11 rounded-full transition", styleLearning ? "bg-[#2F6F68]" : "bg-slate-300")}><span className={cn("absolute top-1 h-4 w-4 rounded-full bg-white transition", styleLearning ? "left-6" : "left-1")} /></button>
                    </label>
                  </div>
                </div>
                <div className="rounded-2xl border border-[#14233A]/10 bg-white/70 p-5 shadow-sm">
                  <div className="flex items-center gap-2"><GraduationCap className="h-4 w-4 text-[#2F6F68]" /><h2 className="font-bold">Communication profile</h2></div>
                  <div className="mt-5 grid grid-cols-2 gap-3 text-xs">
                    {[
                      ["Tone", "Warm and professional"],
                      ["Primary languages", "Russian + Kyrgyz"],
                      ["Emoji use", "Light"],
                      ["Reply length", "Short and helpful"],
                    ].map(([label, value]) => (
                      <div key={label} className="rounded-xl bg-[#F7F3EA] p-3"><p className="text-[#667085]">{label}</p><p className="mt-1 font-bold">{value}</p></div>
                    ))}
                  </div>
                </div>
                <div className="rounded-2xl border border-[#14233A]/10 bg-[#14233A] p-5 text-white xl:col-span-2">
                  <div className="flex items-start gap-3">
                    <ShieldCheck className="mt-0.5 h-5 w-5 text-[#82D4B2]" />
                    <div><h2 className="font-bold">Human control is always on</h2><p className="mt-1 text-sm text-white/60">Discounts, refunds, complaints, promises, and unsupported information are automatically transferred to a manager.</p></div>
                  </div>
                </div>
              </div>
            </>
          )}
        </div>
      </main>
    </div>
  )
}
