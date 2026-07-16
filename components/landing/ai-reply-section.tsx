"use client"

import { Bot, UserCheck, AlertTriangle, ArrowRight, CheckCircle2 } from "lucide-react"
import { SectionWrapper } from "./section-wrapper"

export function AIReplySection() {
  return (
    <SectionWrapper id="how-it-works" dark={false}>
      <div className="flex flex-col-reverse lg:flex-row items-center gap-12 lg:gap-20">
        {/* Copy */}
        <div className="flex-1 max-w-lg">
          <p
            className="text-xs font-semibold tracking-widest uppercase mb-4"
            style={{ color: "#0D292A" }}
          >
            AI Reply + Human Handoff
          </p>
          <h2
            className="text-3xl md:text-4xl font-bold leading-tight text-balance"
            style={{ color: "#102223" }}
          >
            AI handles the routine. You stay in control of what matters.
          </h2>
          <p
            className="mt-5 text-lg leading-relaxed text-pretty"
            style={{ color: "rgba(16,34,35,0.6)" }}
          >
            AIT drafts replies based on your product catalog and business rules. Every draft waits for your approval before sending — you can edit, approve, or take over any conversation instantly.
          </p>

          <ul className="mt-8 flex flex-col gap-4" role="list">
            {[
              "AI drafts replies grounded in your business context",
              "One-click approve or edit before any message sends",
              "Escalation alerts with full conversation context",
              "Manager handoff preserves the entire thread",
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
            className="rounded-2xl overflow-hidden"
            style={{
              backgroundColor: "#0D292A",
              border: "1px solid rgba(45,226,177,0.12)",
              boxShadow: "0 24px 64px rgba(7,26,27,0.25)",
            }}
          >
            {/* Header */}
            <div
              className="flex items-center justify-between px-4 py-3"
              style={{ borderBottom: "1px solid rgba(255,255,255,0.06)" }}
            >
              <div className="flex items-center gap-2">
                <Bot className="w-4 h-4" style={{ color: "#2DE2B1" }} aria-hidden="true" />
                <span className="text-sm font-semibold" style={{ color: "#F6F5EF" }}>AI Draft</span>
              </div>
              <span
                className="text-xs px-2 py-0.5 rounded-full"
                style={{ backgroundColor: "rgba(255,107,107,0.12)", color: "#FF6B6B", border: "1px solid rgba(255,107,107,0.2)" }}
              >
                Awaiting approval
              </span>
            </div>

            <div className="p-4 flex flex-col gap-3">
              {/* Customer message */}
              <div
                className="rounded-xl rounded-tl-sm px-3 py-2.5 max-w-[240px]"
                style={{ backgroundColor: "rgba(103,217,255,0.08)", border: "1px solid rgba(103,217,255,0.15)" }}
              >
                <p className="text-sm" style={{ color: "#F6F5EF" }}>
                  What are your delivery times for the city centre?
                </p>
              </div>

              {/* AI draft */}
              <div className="flex flex-col gap-2 ml-auto max-w-[300px]">
                <div
                  className="rounded-xl rounded-tr-sm px-3 py-2.5"
                  style={{ backgroundColor: "rgba(45,226,177,0.08)", border: "1px solid rgba(45,226,177,0.2)" }}
                >
                  <div className="flex items-center gap-1.5 mb-1">
                    <Bot className="w-3 h-3" style={{ color: "#2DE2B1" }} aria-hidden="true" />
                    <span className="text-xs font-medium" style={{ color: "#2DE2B1" }}>AI draft</span>
                  </div>
                  <p className="text-sm leading-relaxed" style={{ color: "#F6F5EF" }}>
                    We deliver to the city centre within 2 business days. Express same-day delivery is available for orders placed before noon. Shall I check availability for your address?
                  </p>
                </div>

                {/* Action buttons */}
                <div className="flex items-center gap-2">
                  <button
                    type="button"
                    className="flex-1 flex items-center justify-center gap-1.5 py-2 rounded-lg text-xs font-semibold transition-colors"
                    style={{ backgroundColor: "#2DE2B1", color: "#071A1B" }}
                    aria-label="Approve AI draft and send"
                  >
                    <CheckCircle2 className="w-3.5 h-3.5" aria-hidden="true" />
                    Approve &amp; send
                  </button>
                  <button
                    type="button"
                    className="flex items-center justify-center gap-1.5 px-3 py-2 rounded-lg text-xs font-medium transition-colors"
                    style={{ backgroundColor: "rgba(246,245,239,0.08)", color: "rgba(246,245,239,0.7)", border: "1px solid rgba(246,245,239,0.1)" }}
                    aria-label="Edit AI draft before sending"
                  >
                    Edit
                  </button>
                </div>
              </div>

              {/* Escalation callout */}
              <div
                className="flex items-start gap-2.5 rounded-xl px-3 py-2.5 mt-1"
                style={{ backgroundColor: "rgba(255,107,107,0.07)", border: "1px solid rgba(255,107,107,0.15)" }}
              >
                <AlertTriangle className="w-3.5 h-3.5 flex-shrink-0 mt-0.5" style={{ color: "#FF6B6B" }} aria-hidden="true" />
                <div>
                  <p className="text-xs font-medium" style={{ color: "#FF6B6B" }}>Escalation detected</p>
                  <p className="text-xs" style={{ color: "rgba(246,245,239,0.5)" }}>
                    Customer tone suggests urgency — manager notified
                  </p>
                </div>
              </div>

              {/* Handoff */}
              <div
                className="flex items-center gap-2 rounded-xl px-3 py-2.5"
                style={{ backgroundColor: "rgba(246,245,239,0.04)", border: "1px solid rgba(246,245,239,0.08)" }}
              >
                <UserCheck className="w-3.5 h-3.5" style={{ color: "rgba(246,245,239,0.5)" }} aria-hidden="true" />
                <p className="text-xs" style={{ color: "rgba(246,245,239,0.5)" }}>
                  Take over this conversation
                </p>
                <ArrowRight className="w-3 h-3 ml-auto" style={{ color: "rgba(246,245,239,0.3)" }} aria-hidden="true" />
              </div>
            </div>
          </div>
        </div>
      </div>
    </SectionWrapper>
  )
}
