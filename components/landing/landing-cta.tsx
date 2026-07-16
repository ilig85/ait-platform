"use client"

import Link from "next/link"
import { ArrowRight, Zap } from "lucide-react"
import { SectionWrapper } from "./section-wrapper"

export function LandingCTA() {
  return (
    <SectionWrapper dark={false} className="py-24 lg:py-32">
      <div
        className="rounded-3xl px-8 py-16 md:px-16 text-center relative overflow-hidden"
        style={{
          backgroundColor: "#071A1B",
          border: "1px solid rgba(45,226,177,0.15)",
          boxShadow: "0 32px 80px rgba(7,26,27,0.3)",
        }}
      >
        {/* Ambient glow */}
        <div
          aria-hidden="true"
          className="absolute inset-0 pointer-events-none rounded-3xl"
          style={{
            background:
              "radial-gradient(ellipse 70% 50% at 50% 0%, rgba(45,226,177,0.06) 0%, transparent 70%)",
          }}
        />

        <div className="relative">
          {/* Icon */}
          <div
            className="w-14 h-14 rounded-2xl flex items-center justify-center mx-auto mb-6"
            style={{ backgroundColor: "rgba(45,226,177,0.1)", border: "1px solid rgba(45,226,177,0.25)" }}
          >
            <Zap className="w-6 h-6" style={{ color: "#2DE2B1" }} aria-hidden="true" />
          </div>

          <h2
            className="text-3xl md:text-4xl lg:text-5xl font-bold text-balance leading-tight max-w-2xl mx-auto"
            style={{ color: "#F6F5EF" }}
          >
            Ready to let AI handle the replies?
          </h2>
          <p
            className="mt-5 text-lg leading-relaxed text-pretty max-w-xl mx-auto"
            style={{ color: "rgba(246,245,239,0.6)" }}
          >
            Connect WhatsApp Business and start responding to customers faster — with your team fully in control.
          </p>

          {/* CTAs */}
          <div className="mt-8 flex flex-col sm:flex-row items-center justify-center gap-3">
            <Link
              href="/signup"
              className="inline-flex items-center justify-center gap-2 px-7 py-3.5 rounded-xl text-base font-semibold transition-all focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#2DE2B1] focus-visible:ring-offset-2 focus-visible:ring-offset-[#071A1B] w-full sm:w-auto"
              style={{ backgroundColor: "#2DE2B1", color: "#071A1B" }}
              onMouseEnter={(e) =>
                ((e.currentTarget as HTMLElement).style.backgroundColor = "#25c99e")
              }
              onMouseLeave={(e) =>
                ((e.currentTarget as HTMLElement).style.backgroundColor = "#2DE2B1")
              }
            >
              Start free
              <ArrowRight className="w-4 h-4" aria-hidden="true" />
            </Link>
            <Link
              href="/login"
              className="inline-flex items-center justify-center gap-2 px-7 py-3.5 rounded-xl text-base font-medium transition-all focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#2DE2B1] w-full sm:w-auto"
              style={{
                border: "1px solid rgba(246,245,239,0.15)",
                color: "rgba(246,245,239,0.75)",
              }}
              onMouseEnter={(e) => {
                const el = e.currentTarget as HTMLElement
                el.style.borderColor = "rgba(246,245,239,0.3)"
                el.style.color = "#F6F5EF"
              }}
              onMouseLeave={(e) => {
                const el = e.currentTarget as HTMLElement
                el.style.borderColor = "rgba(246,245,239,0.15)"
                el.style.color = "rgba(246,245,239,0.75)"
              }}
            >
              Log in to existing account
            </Link>
          </div>

          <p
            className="mt-5 text-sm"
            style={{ color: "rgba(246,245,239,0.3)" }}
          >
            No credit card required &nbsp;·&nbsp; Cancel anytime
          </p>
        </div>
      </div>
    </SectionWrapper>
  )
}
