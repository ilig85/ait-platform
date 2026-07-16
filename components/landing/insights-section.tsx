import { BarChart2, TrendingUp, MessageSquare, Zap, CheckCircle2 } from "lucide-react"
import { SectionWrapper } from "./section-wrapper"

const metrics = [
  {
    label: "Conversations handled",
    value: "124",
    sub: "this week",
    color: "#2DE2B1",
    bar: 78,
  },
  {
    label: "AI reply rate",
    value: "84%",
    sub: "of all messages",
    color: "#67D9FF",
    bar: 84,
  },
  {
    label: "Escalations",
    value: "3",
    sub: "required human review",
    color: "#FF6B6B",
    bar: 12,
  },
  {
    label: "Avg first response",
    value: "38s",
    sub: "vs 4.2 min before AIT",
    color: "#2DE2B1",
    bar: 91,
  },
]

export function InsightsSection() {
  return (
    <SectionWrapper dark={false}>
      <div className="flex flex-col lg:flex-row items-center gap-12 lg:gap-20">
        {/* Copy */}
        <div className="flex-1 max-w-lg">
          <p
            className="text-xs font-semibold tracking-widest uppercase mb-4"
            style={{ color: "#0D292A" }}
          >
            Conversation Insights
          </p>
          <h2
            className="text-3xl md:text-4xl font-bold leading-tight text-balance"
            style={{ color: "#102223" }}
          >
            See what is working. Catch what needs attention.
          </h2>
          <p
            className="mt-5 text-lg leading-relaxed text-pretty"
            style={{ color: "rgba(16,34,35,0.6)" }}
          >
            AIT gives you a clear view of how your team and the AI are performing — volume, response times, escalation patterns, and topic trends. All derived from your real conversation data.
          </p>

          <ul className="mt-8 flex flex-col gap-4" role="list">
            {[
              "Daily and weekly conversation volume breakdowns",
              "Topic and sentiment trend detection",
              "AI performance vs human handoff ratio",
            ].map((text) => (
              <li key={text} className="flex items-start gap-3" role="listitem">
                <span
                  className="w-5 h-5 rounded-full flex items-center justify-center flex-shrink-0 mt-0.5"
                  style={{ backgroundColor: "rgba(13,41,42,0.1)", color: "#0D292A" }}
                  aria-hidden="true"
                >
                  <CheckCircle2 className="w-3 h-3" />
                </span>
                <span className="text-sm leading-relaxed" style={{ color: "rgba(16,34,35,0.7)" }}>
                  {text}
                </span>
              </li>
            ))}
          </ul>
        </div>

        {/* Visual */}
        <div className="flex-1 w-full max-w-md">
          <div
            className="rounded-2xl p-5"
            style={{
              backgroundColor: "#0D292A",
              border: "1px solid rgba(45,226,177,0.1)",
              boxShadow: "0 24px 64px rgba(7,26,27,0.2)",
            }}
          >
            {/* Header */}
            <div className="flex items-center justify-between mb-5">
              <div className="flex items-center gap-2">
                <BarChart2 className="w-4 h-4" style={{ color: "#2DE2B1" }} aria-hidden="true" />
                <span className="text-sm font-semibold" style={{ color: "#F6F5EF" }}>This week</span>
              </div>
              <div className="flex items-center gap-1.5">
                <TrendingUp className="w-3.5 h-3.5" style={{ color: "#2DE2B1" }} aria-hidden="true" />
                <span className="text-xs font-medium" style={{ color: "#2DE2B1" }}>Your data · updated live</span>
              </div>
            </div>

            {/* Metric rows */}
            <div className="flex flex-col gap-4">
              {metrics.map((m) => (
                <div key={m.label}>
                  <div className="flex items-center justify-between mb-1.5">
                    <span className="text-xs" style={{ color: "rgba(246,245,239,0.55)" }}>{m.label}</span>
                    <div className="flex items-center gap-2">
                      <span className="text-sm font-bold" style={{ color: "#F6F5EF" }}>{m.value}</span>
                      <span className="text-xs" style={{ color: "rgba(246,245,239,0.35)" }}>{m.sub}</span>
                    </div>
                  </div>
                  <div
                    className="w-full h-1.5 rounded-full overflow-hidden"
                    style={{ backgroundColor: "rgba(246,245,239,0.06)" }}
                    role="progressbar"
                    aria-valuenow={m.bar}
                    aria-valuemin={0}
                    aria-valuemax={100}
                    aria-label={m.label}
                  >
                    <div
                      className="h-full rounded-full"
                      style={{ width: `${m.bar}%`, backgroundColor: m.color }}
                    />
                  </div>
                </div>
              ))}
            </div>

            {/* Topic tags */}
            <div
              className="mt-5 pt-4"
              style={{ borderTop: "1px solid rgba(255,255,255,0.06)" }}
            >
              <div className="flex items-center gap-2 mb-2">
                <MessageSquare className="w-3 h-3" style={{ color: "rgba(246,245,239,0.3)" }} aria-hidden="true" />
                <span className="text-xs" style={{ color: "rgba(246,245,239,0.35)" }}>Top topics this week</span>
              </div>
              <div className="flex flex-wrap gap-2">
                {["Product availability", "Delivery times", "Return policy", "Custom orders", "Pricing"].map((tag) => (
                  <span
                    key={tag}
                    className="text-xs px-2.5 py-1 rounded-full"
                    style={{ backgroundColor: "rgba(246,245,239,0.06)", color: "rgba(246,245,239,0.55)" }}
                  >
                    {tag}
                  </span>
                ))}
              </div>
            </div>

            {/* Disclaimer */}
            <p className="mt-3 text-xs" style={{ color: "rgba(246,245,239,0.2)" }}>
              Metrics shown are illustrative of how your data will appear. Real data loads after you connect WhatsApp.
            </p>
          </div>
        </div>
      </div>
    </SectionWrapper>
  )
}
