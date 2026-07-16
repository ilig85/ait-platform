import { User, MessageCircle, Tag, Clock, TrendingUp, CheckCircle2 } from "lucide-react"
import { SectionWrapper } from "./section-wrapper"

export function RecordsSection() {
  return (
    <SectionWrapper dark>
      <div className="flex flex-col lg:flex-row items-center gap-12 lg:gap-20">
        {/* Visual — customer record card */}
        <div className="flex-1 w-full max-w-md">
          <div
            className="rounded-2xl p-5"
            style={{
              backgroundColor: "#0D292A",
              border: "1px solid rgba(45,226,177,0.1)",
              boxShadow: "0 24px 64px rgba(0,0,0,0.4)",
            }}
          >
            {/* Profile header */}
            <div className="flex items-start gap-3 mb-5">
              <div
                className="w-12 h-12 rounded-full flex items-center justify-center text-lg font-bold flex-shrink-0"
                style={{ backgroundColor: "rgba(45,226,177,0.12)", color: "#2DE2B1" }}
                aria-hidden="true"
              >
                S
              </div>
              <div>
                <p className="text-base font-semibold" style={{ color: "#F6F5EF" }}>Sara Mendes</p>
                <p className="text-sm" style={{ color: "rgba(246,245,239,0.5)" }}>+55 11 9 8765-4321 · WhatsApp</p>
                <div className="flex items-center gap-1.5 mt-1">
                  <span
                    className="text-xs px-2 py-0.5 rounded-full"
                    style={{ backgroundColor: "rgba(45,226,177,0.1)", color: "#2DE2B1", border: "1px solid rgba(45,226,177,0.2)" }}
                  >
                    Warm lead
                  </span>
                  <span
                    className="text-xs px-2 py-0.5 rounded-full"
                    style={{ backgroundColor: "rgba(246,245,239,0.06)", color: "rgba(246,245,239,0.5)" }}
                  >
                    Furniture
                  </span>
                </div>
              </div>
            </div>

            {/* Stats row */}
            <div
              className="grid grid-cols-3 gap-3 mb-4 pt-4"
              style={{ borderTop: "1px solid rgba(255,255,255,0.06)" }}
            >
              {[
                { icon: MessageCircle, label: "Conversations", value: "7" },
                { icon: Clock, label: "Avg response", value: "41s" },
                { icon: TrendingUp, label: "Engagement", value: "High" },
              ].map(({ icon: Icon, label, value }) => (
                <div key={label} className="text-center">
                  <Icon className="w-3.5 h-3.5 mx-auto mb-1" style={{ color: "rgba(246,245,239,0.3)" }} aria-hidden="true" />
                  <p className="text-base font-bold" style={{ color: "#F6F5EF" }}>{value}</p>
                  <p className="text-xs" style={{ color: "rgba(246,245,239,0.35)" }}>{label}</p>
                </div>
              ))}
            </div>

            {/* Timeline */}
            <div className="flex flex-col gap-2">
              <p className="text-xs font-semibold uppercase tracking-wider mb-1" style={{ color: "rgba(246,245,239,0.3)" }}>
                Recent activity
              </p>
              {[
                { color: "#2DE2B1", text: "Asked about beige sofa — purchase intent detected", time: "2m" },
                { color: "#67D9FF", text: "Viewed product catalog link (opened 3×)", time: "1h" },
                { color: "rgba(246,245,239,0.3)", text: "Previous order: Grey armchair — delivered", time: "3d" },
              ].map((item) => (
                <div key={item.text} className="flex items-start gap-2.5">
                  <div
                    className="w-1.5 h-1.5 rounded-full flex-shrink-0 mt-1.5"
                    style={{ backgroundColor: item.color }}
                    aria-hidden="true"
                  />
                  <div className="flex-1 flex items-start justify-between gap-2">
                    <p className="text-xs leading-relaxed" style={{ color: "rgba(246,245,239,0.6)" }}>{item.text}</p>
                    <span className="text-xs flex-shrink-0" style={{ color: "rgba(246,245,239,0.3)" }}>{item.time}</span>
                  </div>
                </div>
              ))}
            </div>

            {/* Auto-tag */}
            <div
              className="flex items-center gap-2 mt-4 pt-4"
              style={{ borderTop: "1px solid rgba(255,255,255,0.06)" }}
            >
              <Tag className="w-3.5 h-3.5" style={{ color: "#2DE2B1" }} aria-hidden="true" />
              <p className="text-xs" style={{ color: "rgba(246,245,239,0.45)" }}>
                Tags updated automatically by AIT
              </p>
            </div>
          </div>
        </div>

        {/* Copy */}
        <div className="flex-1 max-w-lg">
          <p
            className="text-xs font-semibold tracking-widest uppercase mb-4"
            style={{ color: "#2DE2B1" }}
          >
            Automatic Customer Records
          </p>
          <h2
            className="text-3xl md:text-4xl font-bold leading-tight text-balance"
            style={{ color: "#F6F5EF" }}
          >
            Every customer gets a living record — built automatically.
          </h2>
          <p
            className="mt-5 text-lg leading-relaxed text-pretty"
            style={{ color: "rgba(246,245,239,0.6)" }}
          >
            AIT builds customer profiles from every conversation — purchase intent, preferences, history, and sentiment. No manual data entry. Profiles stay current without your team lifting a finger.
          </p>

          <ul className="mt-8 flex flex-col gap-4" role="list">
            {[
              "Auto-detected purchase intent and topic tagging",
              "Full conversation timeline per customer",
              "Engagement signals to prioritize follow-ups",
            ].map((text) => (
              <li key={text} className="flex items-start gap-3" role="listitem">
                <span
                  className="w-5 h-5 rounded-full flex items-center justify-center flex-shrink-0 mt-0.5"
                  style={{ backgroundColor: "rgba(45,226,177,0.12)", color: "#2DE2B1" }}
                  aria-hidden="true"
                >
                  <CheckCircle2 className="w-3 h-3" />
                </span>
                <span className="text-sm leading-relaxed" style={{ color: "rgba(246,245,239,0.7)" }}>
                  {text}
                </span>
              </li>
            ))}
          </ul>
        </div>
      </div>
    </SectionWrapper>
  )
}
