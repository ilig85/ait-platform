import { MessageSquare, Clock, Filter, CheckCircle2 } from "lucide-react"
import { SectionWrapper } from "./section-wrapper"

const conversations = [
  { name: "Sara M.", preview: "Do you have the beige sofa?", time: "2m", unread: true, status: "new" },
  { name: "Joao P.", preview: "When will my order arrive?", time: "14m", unread: true, status: "waiting" },
  { name: "Ana R.", preview: "Thanks! That was perfect.", time: "1h", unread: false, status: "resolved" },
  { name: "Carlos T.", preview: "Can I get a custom quote?", time: "2h", unread: false, status: "ai-handled" },
]

const statusColors: Record<string, { bg: string; text: string; label: string }> = {
  new: { bg: "rgba(45,226,177,0.12)", text: "#2DE2B1", label: "New" },
  waiting: { bg: "rgba(255,107,107,0.12)", text: "#FF6B6B", label: "Waiting" },
  resolved: { bg: "rgba(246,245,239,0.08)", text: "rgba(246,245,239,0.5)", label: "Resolved" },
  "ai-handled": { bg: "rgba(103,217,255,0.12)", text: "#67D9FF", label: "AI" },
}

export function InboxSection() {
  return (
    <SectionWrapper id="product" dark>
      <div className="flex flex-col lg:flex-row items-center gap-12 lg:gap-20">
        {/* Visual */}
        <div className="flex-1 w-full max-w-md">
          <div
            className="rounded-2xl overflow-hidden"
            style={{
              backgroundColor: "#0D292A",
              border: "1px solid rgba(45,226,177,0.1)",
              boxShadow: "0 24px 64px rgba(0,0,0,0.4)",
            }}
          >
            {/* Window chrome */}
            <div
              className="flex items-center justify-between px-4 py-3"
              style={{ borderBottom: "1px solid rgba(255,255,255,0.06)" }}
            >
              <div className="flex items-center gap-2">
                <MessageSquare className="w-4 h-4" style={{ color: "#2DE2B1" }} aria-hidden="true" />
                <span className="text-sm font-semibold" style={{ color: "#F6F5EF" }}>Inbox</span>
                <span
                  className="text-xs px-1.5 py-0.5 rounded-full font-medium"
                  style={{ backgroundColor: "rgba(255,107,107,0.15)", color: "#FF6B6B" }}
                >
                  2 new
                </span>
              </div>
              <div className="flex items-center gap-1.5">
                <Filter className="w-3.5 h-3.5" style={{ color: "rgba(246,245,239,0.35)" }} aria-hidden="true" />
                <span className="text-xs" style={{ color: "rgba(246,245,239,0.35)" }}>Filter</span>
              </div>
            </div>

            {/* Conversation list */}
            <ul role="list" className="divide-y" style={{ borderColor: "rgba(255,255,255,0.04)" }}>
              {conversations.map((c) => {
                const s = statusColors[c.status]
                return (
                  <li
                    key={c.name}
                    className="flex items-start gap-3 px-4 py-3"
                    style={{
                      backgroundColor: c.unread ? "rgba(45,226,177,0.03)" : "transparent",
                    }}
                  >
                    {/* Avatar */}
                    <div
                      className="w-8 h-8 rounded-full flex items-center justify-center text-xs font-bold flex-shrink-0"
                      style={{ backgroundColor: "rgba(246,245,239,0.08)", color: "#F6F5EF" }}
                      aria-hidden="true"
                    >
                      {c.name[0]}
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center justify-between gap-2">
                        <span
                          className="text-sm font-medium truncate"
                          style={{ color: c.unread ? "#F6F5EF" : "rgba(246,245,239,0.65)" }}
                        >
                          {c.name}
                        </span>
                        <div className="flex items-center gap-2 flex-shrink-0">
                          <span
                            className="text-xs px-1.5 py-0.5 rounded-full"
                            style={{ backgroundColor: s.bg, color: s.text }}
                          >
                            {s.label}
                          </span>
                          <span className="text-xs" style={{ color: "rgba(246,245,239,0.3)" }}>
                            {c.time}
                          </span>
                        </div>
                      </div>
                      <p
                        className="text-xs truncate mt-0.5"
                        style={{ color: "rgba(246,245,239,0.45)" }}
                      >
                        {c.preview}
                      </p>
                    </div>
                  </li>
                )
              })}
            </ul>

            {/* Bottom bar */}
            <div
              className="flex items-center justify-between px-4 py-2.5"
              style={{ borderTop: "1px solid rgba(255,255,255,0.06)" }}
            >
              <div className="flex items-center gap-1.5">
                <Clock className="w-3 h-3" style={{ color: "rgba(246,245,239,0.3)" }} aria-hidden="true" />
                <span className="text-xs" style={{ color: "rgba(246,245,239,0.3)" }}>
                  Avg response: 38 seconds
                </span>
              </div>
              <CheckCircle2 className="w-3.5 h-3.5" style={{ color: "#2DE2B1" }} aria-hidden="true" />
            </div>
          </div>
        </div>

        {/* Copy */}
        <div className="flex-1 max-w-lg">
          <p
            className="text-xs font-semibold tracking-widest uppercase mb-4"
            style={{ color: "#2DE2B1" }}
          >
            Unified Inbox
          </p>
          <h2
            className="text-3xl md:text-4xl font-bold leading-tight text-balance"
            style={{ color: "#F6F5EF" }}
          >
            Every conversation in one place. Nothing slips through.
          </h2>
          <p
            className="mt-5 text-lg leading-relaxed text-pretty"
            style={{ color: "rgba(246,245,239,0.6)" }}
          >
            All your WhatsApp Business messages land in a single organized inbox. Priority flags, AI status tags, and filters keep your team focused on what needs attention now.
          </p>

          <ul className="mt-8 flex flex-col gap-4" role="list">
            {[
              { icon: "·", text: "Unified view across all WhatsApp numbers" },
              { icon: "·", text: "Smart filters: new, waiting, AI-handled, resolved" },
              { icon: "·", text: "Real-time status — no page refresh needed" },
            ].map((item) => (
              <li key={item.text} className="flex items-start gap-3" role="listitem">
                <span
                  className="w-5 h-5 rounded-full flex items-center justify-center flex-shrink-0 mt-0.5"
                  style={{ backgroundColor: "rgba(45,226,177,0.12)", color: "#2DE2B1" }}
                  aria-hidden="true"
                >
                  <CheckCircle2 className="w-3 h-3" />
                </span>
                <span className="text-sm leading-relaxed" style={{ color: "rgba(246,245,239,0.7)" }}>
                  {item.text}
                </span>
              </li>
            ))}
          </ul>
        </div>
      </div>
    </SectionWrapper>
  )
}
