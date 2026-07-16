"use client"

import { useEffect, useRef, useState } from "react"
import { Bot, User, BookOpen, BarChart2, ChevronRight } from "lucide-react"

type Step = "idle" | "message" | "reading" | "preparing" | "reply" | "record" | "summary"

const SEQUENCE: Step[] = ["message", "reading", "preparing", "reply", "record", "summary"]
const STEP_DURATION: Record<Step, number> = {
  idle: 800,
  message: 1200,
  reading: 1000,
  preparing: 1000,
  reply: 1400,
  record: 1000,
  summary: 1600,
}

export function HeroAnimation() {
  const [step, setStep] = useState<Step>("idle")
  const [typedReply, setTypedReply] = useState("")
  const timerRef = useRef<ReturnType<typeof setTimeout> | null>(null)
  const typeRef = useRef<ReturnType<typeof setInterval> | null>(null)

  const replyText = "Yes! The beige sofa is in stock in two sizes. Want me to send photos and pricing?"

  // Run the animation sequence on repeat
  useEffect(() => {
    let idx = -1

    const next = () => {
      idx = (idx + 1) % SEQUENCE.length
      const s = SEQUENCE[idx]
      setStep(s)
      if (s !== "reply") setTypedReply("")
      timerRef.current = setTimeout(next, STEP_DURATION[s])
    }

    timerRef.current = setTimeout(next, STEP_DURATION["idle"])
    return () => {
      if (timerRef.current) clearTimeout(timerRef.current)
      if (typeRef.current) clearInterval(typeRef.current)
    }
  }, [])

  // Typing effect for reply step
  useEffect(() => {
    if (step !== "reply") return
    if (typeRef.current) clearInterval(typeRef.current)
    let i = 0
    typeRef.current = setInterval(() => {
      i++
      setTypedReply(replyText.slice(0, i))
      if (i >= replyText.length && typeRef.current) clearInterval(typeRef.current)
    }, 28)
    return () => {
      if (typeRef.current) clearInterval(typeRef.current)
    }
  }, [step])

  const active = (s: Step) => {
    const idx = SEQUENCE.indexOf(step)
    const sIdx = SEQUENCE.indexOf(s)
    return idx >= sIdx
  }

  return (
    <div
      aria-label="Product preview animation"
      aria-live="polite"
      className="relative w-full max-w-md mx-auto select-none"
      style={{ minHeight: 380 }}
    >
      {/* Ambient glow */}
      <div
        aria-hidden="true"
        className="absolute inset-0 rounded-2xl pointer-events-none"
        style={{
          background: "radial-gradient(ellipse 80% 60% at 50% 40%, rgba(45,226,177,0.07) 0%, transparent 70%)",
        }}
      />

      <div className="relative flex flex-col gap-3 p-1">
        {/* Step 1 – Customer message */}
        <div
          className="flex items-start gap-3 transition-all duration-500"
          style={{
            opacity: active("message") ? 1 : 0,
            transform: active("message") ? "translateX(0)" : "translateX(-12px)",
          }}
        >
          <div
            className="w-8 h-8 rounded-full flex items-center justify-center flex-shrink-0 mt-0.5"
            style={{ backgroundColor: "rgba(103,217,255,0.15)", border: "1px solid rgba(103,217,255,0.25)" }}
          >
            <User className="w-4 h-4" style={{ color: "#67D9FF" }} aria-hidden="true" />
          </div>
          <div
            className="rounded-2xl rounded-tl-sm px-4 py-2.5 max-w-[260px]"
            style={{ backgroundColor: "rgba(103,217,255,0.1)", border: "1px solid rgba(103,217,255,0.2)" }}
          >
            <p className="text-sm leading-relaxed" style={{ color: "#F6F5EF" }}>
              Do you have the beige sofa?
            </p>
            <p className="text-xs mt-1" style={{ color: "rgba(246,245,239,0.4)" }}>via WhatsApp · just now</p>
          </div>
        </div>

        {/* Signal line */}
        <div
          className="flex items-center gap-2 px-11"
          style={{
            opacity: active("reading") ? 1 : 0,
            transition: "opacity 0.4s",
          }}
          aria-hidden="true"
        >
          <div className="flex-1 h-px" style={{ background: "linear-gradient(90deg, transparent, rgba(45,226,177,0.4), rgba(45,226,177,0.15))" }} />
          <div className="w-1.5 h-1.5 rounded-full" style={{ backgroundColor: "#2DE2B1" }} />
          <span className="text-xs font-medium" style={{ color: "#2DE2B1" }}>AIT</span>
          <div className="w-1.5 h-1.5 rounded-full" style={{ backgroundColor: "#2DE2B1" }} />
          <div className="flex-1 h-px" style={{ background: "linear-gradient(90deg, rgba(45,226,177,0.15), rgba(45,226,177,0.4), transparent)" }} />
        </div>

        {/* Step 2 – AIT reading context */}
        <div
          className="flex items-start gap-3 justify-end transition-all duration-500"
          style={{
            opacity: active("reading") ? 1 : 0,
            transform: active("reading") ? "translateX(0)" : "translateX(12px)",
          }}
        >
          <div
            className="rounded-2xl rounded-tr-sm px-4 py-2.5 max-w-[260px]"
            style={{ backgroundColor: "rgba(45,226,177,0.08)", border: "1px solid rgba(45,226,177,0.2)" }}
          >
            <div className="flex items-center gap-2 mb-1">
              <BookOpen className="w-3.5 h-3.5" style={{ color: "#2DE2B1" }} aria-hidden="true" />
              <span className="text-xs font-medium" style={{ color: "#2DE2B1" }}>Reading business context…</span>
            </div>
            <p className="text-xs" style={{ color: "rgba(246,245,239,0.5)" }}>
              Product catalog · inventory data · tone rules
            </p>
          </div>
          <div
            className="w-8 h-8 rounded-full flex items-center justify-center flex-shrink-0 mt-0.5"
            style={{ backgroundColor: "rgba(45,226,177,0.12)", border: "1px solid rgba(45,226,177,0.25)" }}
          >
            <Bot className="w-4 h-4" style={{ color: "#2DE2B1" }} aria-hidden="true" />
          </div>
        </div>

        {/* Step 3 – Preparing reply */}
        {active("preparing") && step !== "reply" && step !== "record" && step !== "summary" && (
          <div
            className="flex items-center gap-2 px-11"
            style={{ opacity: 1, transition: "opacity 0.3s" }}
            aria-hidden="true"
          >
            <div className="flex gap-1">
              {[0, 1, 2].map((i) => (
                <span
                  key={i}
                  className="w-1.5 h-1.5 rounded-full"
                  style={{
                    backgroundColor: "#2DE2B1",
                    animation: `land-typing-cursor 1s ease-in-out ${i * 0.2}s infinite`,
                  }}
                />
              ))}
            </div>
            <span className="text-xs" style={{ color: "rgba(246,245,239,0.45)" }}>
              Preparing reply…
            </span>
          </div>
        )}

        {/* Step 4 – AI reply */}
        <div
          className="flex items-start gap-3 justify-end transition-all duration-500"
          style={{
            opacity: active("reply") ? 1 : 0,
            transform: active("reply") ? "translateX(0)" : "translateX(12px)",
          }}
        >
          <div
            className="rounded-2xl rounded-tr-sm px-4 py-2.5 max-w-[280px]"
            style={{ backgroundColor: "rgba(45,226,177,0.1)", border: "1px solid rgba(45,226,177,0.25)" }}
          >
            <p className="text-sm leading-relaxed" style={{ color: "#F6F5EF" }}>
              {typedReply || "\u00A0"}
              {step === "reply" && typedReply.length < replyText.length && (
                <span
                  aria-hidden="true"
                  style={{
                    display: "inline-block",
                    width: 2,
                    height: "1em",
                    backgroundColor: "#2DE2B1",
                    marginLeft: 1,
                    verticalAlign: "text-bottom",
                    animation: "land-typing-cursor 0.8s ease-in-out infinite",
                  }}
                />
              )}
            </p>
            <p className="text-xs mt-1" style={{ color: "rgba(246,245,239,0.4)" }}>AIT · AI draft · pending your approval</p>
          </div>
          <div
            className="w-8 h-8 rounded-full flex items-center justify-center flex-shrink-0 mt-0.5"
            style={{ backgroundColor: "rgba(45,226,177,0.12)", border: "1px solid rgba(45,226,177,0.25)" }}
          >
            <Bot className="w-4 h-4" style={{ color: "#2DE2B1" }} aria-hidden="true" />
          </div>
        </div>

        {/* Step 5 – Customer record updated */}
        <div
          className="flex items-center gap-3 px-1 py-2 rounded-xl transition-all duration-500"
          style={{
            opacity: active("record") ? 1 : 0,
            transform: active("record") ? "translateY(0)" : "translateY(8px)",
            backgroundColor: "rgba(45,226,177,0.05)",
            border: "1px solid rgba(45,226,177,0.12)",
          }}
        >
          <div
            className="w-7 h-7 rounded-lg flex items-center justify-center flex-shrink-0"
            style={{ backgroundColor: "rgba(45,226,177,0.12)" }}
          >
            <User className="w-3.5 h-3.5" style={{ color: "#2DE2B1" }} aria-hidden="true" />
          </div>
          <div className="flex-1 min-w-0">
            <p className="text-xs font-medium truncate" style={{ color: "#F6F5EF" }}>Customer record updated</p>
            <p className="text-xs truncate" style={{ color: "rgba(246,245,239,0.45)" }}>
              Topic: sofa inquiry · intent: purchase
            </p>
          </div>
          <div
            className="text-xs font-medium px-2 py-0.5 rounded-full"
            style={{ backgroundColor: "rgba(45,226,177,0.15)", color: "#2DE2B1" }}
          >
            auto
          </div>
        </div>

        {/* Step 6 – Manager summary */}
        <div
          className="flex items-center gap-3 px-1 py-2 rounded-xl transition-all duration-500"
          style={{
            opacity: active("summary") ? 1 : 0,
            transform: active("summary") ? "translateY(0)" : "translateY(8px)",
            backgroundColor: "rgba(103,217,255,0.05)",
            border: "1px solid rgba(103,217,255,0.12)",
          }}
        >
          <div
            className="w-7 h-7 rounded-lg flex items-center justify-center flex-shrink-0"
            style={{ backgroundColor: "rgba(103,217,255,0.12)" }}
          >
            <BarChart2 className="w-3.5 h-3.5" style={{ color: "#67D9FF" }} aria-hidden="true" />
          </div>
          <div className="flex-1 min-w-0">
            <p className="text-xs font-medium truncate" style={{ color: "#F6F5EF" }}>Manager summary sent</p>
            <p className="text-xs truncate" style={{ color: "rgba(246,245,239,0.45)" }}>
              1 hot lead · beige sofa · follow-up suggested
            </p>
          </div>
          <ChevronRight className="w-3.5 h-3.5 flex-shrink-0" style={{ color: "rgba(246,245,239,0.3)" }} aria-hidden="true" />
        </div>
      </div>

      {/* Screen-reader summary */}
      <p className="sr-only">
        Product preview: a customer asks about a beige sofa via WhatsApp. AIT reads business context, prepares a reply draft, updates the customer record, and sends a manager summary — all automatically.
      </p>
    </div>
  )
}
