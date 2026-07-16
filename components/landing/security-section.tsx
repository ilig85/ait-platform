import { Shield, Eye, Lock, Users, CheckCircle2 } from "lucide-react"
import { SectionWrapper } from "./section-wrapper"

const pillars = [
  {
    icon: Shield,
    title: "End-to-end encryption",
    description:
      "Messages are encrypted in transit and at rest. Your customer data is never used to train AI models.",
    color: "#2DE2B1",
  },
  {
    icon: Eye,
    title: "Full audit trail",
    description:
      "Every AI action and human intervention is logged with timestamps. You always know what was sent and by whom.",
    color: "#67D9FF",
  },
  {
    icon: Users,
    title: "Role-based access",
    description:
      "Assign team members granular permissions. Managers see everything; agents see only their assigned conversations.",
    color: "#2DE2B1",
  },
  {
    icon: Lock,
    title: "You approve, AI suggests",
    description:
      "AI never sends a message without your explicit approval. Human control is a core architectural guarantee, not an optional setting.",
    color: "#F6F5EF",
  },
]

export function SecuritySection() {
  return (
    <SectionWrapper id="security" dark>
      {/* Section header */}
      <div className="text-center mb-14 max-w-2xl mx-auto">
        <p
          className="text-xs font-semibold tracking-widest uppercase mb-4"
          style={{ color: "#2DE2B1" }}
        >
          Security &amp; Manager Control
        </p>
        <h2
          className="text-3xl md:text-4xl font-bold leading-tight text-balance"
          style={{ color: "#F6F5EF" }}
        >
          Built for businesses that can not afford to get it wrong.
        </h2>
        <p
          className="mt-4 text-lg leading-relaxed text-pretty"
          style={{ color: "rgba(246,245,239,0.6)" }}
        >
          AIT is designed with security and manager oversight at every layer. Your team stays in control while AI handles the volume.
        </p>
      </div>

      {/* Pillars grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 lg:gap-5">
        {pillars.map(({ icon: Icon, title, description, color }) => (
          <div
            key={title}
            className="rounded-2xl p-6"
            style={{
              backgroundColor: "#0D292A",
              border: "1px solid rgba(45,226,177,0.08)",
            }}
          >
            <div
              className="w-10 h-10 rounded-xl flex items-center justify-center mb-4"
              style={{ backgroundColor: "rgba(45,226,177,0.08)" }}
            >
              <Icon className="w-5 h-5" style={{ color }} aria-hidden="true" />
            </div>
            <h3
              className="text-base font-semibold mb-2"
              style={{ color: "#F6F5EF" }}
            >
              {title}
            </h3>
            <p
              className="text-sm leading-relaxed"
              style={{ color: "rgba(246,245,239,0.55)" }}
            >
              {description}
            </p>
          </div>
        ))}
      </div>

      {/* Compliance note */}
      <div
        className="mt-10 rounded-2xl px-6 py-5 flex flex-col sm:flex-row items-start sm:items-center gap-4"
        style={{
          backgroundColor: "rgba(45,226,177,0.04)",
          border: "1px solid rgba(45,226,177,0.12)",
        }}
      >
        <CheckCircle2 className="w-5 h-5 flex-shrink-0" style={{ color: "#2DE2B1" }} aria-hidden="true" />
        <p
          className="text-sm leading-relaxed"
          style={{ color: "rgba(246,245,239,0.6)" }}
        >
          <span className="font-medium" style={{ color: "#F6F5EF" }}>Human control is architectural, not optional.</span>{" "}
          AIT&apos;s approval-first model means no message is ever sent without a human reviewing it first. AI assists, humans decide.
        </p>
      </div>
    </SectionWrapper>
  )
}
