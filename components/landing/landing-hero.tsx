"use client"

import Link from "next/link"
import { ArrowDown } from "lucide-react"
import { HeroAnimation } from "./hero-animation"

export function LandingHero() {
  return (
    <section
      aria-labelledby="hero-heading"
      style={{ backgroundColor: "#071A1B" }}
      className="relative min-h-screen pt-16 flex flex-col"
    >
      {/* Subtle grid texture */}
      <div
        aria-hidden="true"
        className="absolute inset-0 pointer-events-none"
        style={{
          backgroundImage:
            "linear-gradient(rgba(45,226,177,0.03) 1px, transparent 1px), linear-gradient(90deg, rgba(45,226,177,0.03) 1px, transparent 1px)",
          backgroundSize: "60px 60px",
        }}
      />

      {/* Content */}
      <div className="relative flex-1 flex flex-col lg:flex-row items-center justify-center gap-12 lg:gap-16 mx-auto max-w-7xl w-full px-6 lg:px-8 py-20 lg:py-28">
        {/* Left — headline + CTAs */}
        <div className="flex-1 max-w-xl text-center lg:text-left">
          {/* Product badge */}
          <div className="inline-flex items-center gap-2 mb-6 land-fade-up" style={{ animationDelay: "0ms" }}>
            <span
              className="inline-flex items-center gap-1.5 text-xs font-semibold tracking-widest uppercase px-3 py-1.5 rounded-full"
              style={{
                backgroundColor: "rgba(45,226,177,0.1)",
                border: "1px solid rgba(45,226,177,0.25)",
                color: "#2DE2B1",
              }}
            >
              <span
                aria-hidden="true"
                className="w-1.5 h-1.5 rounded-full"
                style={{ backgroundColor: "#2DE2B1", animation: "land-typing-cursor 2s ease-in-out infinite" }}
              />
              WhatsApp Business AI
            </span>
          </div>

          <h1
            id="hero-heading"
            className="text-4xl md:text-5xl lg:text-6xl font-bold leading-tight text-balance land-fade-up"
            style={{ color: "#F6F5EF", animationDelay: "80ms", lineHeight: 1.15 }}
          >
            Your customers message.{" "}
            <span style={{ color: "#2DE2B1" }}>AIT handles</span> the rest.
          </h1>

          <p
            className="mt-5 text-lg leading-relaxed text-pretty land-fade-up"
            style={{ color: "rgba(246,245,239,0.65)", animationDelay: "160ms", maxWidth: "38ch" }}
          >
            Connect WhatsApp Business, organize every conversation, and let AI answer customers while you stay in control.
          </p>

          {/* CTAs */}
          <div
            className="mt-8 flex flex-col sm:flex-row items-center lg:justify-start justify-center gap-3 land-fade-up"
            style={{ animationDelay: "240ms" }}
          >
            <Link
              href="/signup"
              className="inline-flex items-center justify-center gap-2 px-6 py-3 rounded-xl text-sm font-semibold transition-all focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#2DE2B1] focus-visible:ring-offset-2 focus-visible:ring-offset-[#071A1B] w-full sm:w-auto"
              style={{ backgroundColor: "#2DE2B1", color: "#071A1B" }}
              onMouseEnter={(e) =>
                ((e.currentTarget as HTMLElement).style.backgroundColor = "#25c99e")
              }
              onMouseLeave={(e) =>
                ((e.currentTarget as HTMLElement).style.backgroundColor = "#2DE2B1")
              }
            >
              Start free
            </Link>
            <a
              href="#how-it-works"
              onClick={(e) => {
                e.preventDefault()
                document.querySelector("#how-it-works")?.scrollIntoView({ behavior: "smooth" })
              }}
              className="inline-flex items-center justify-center gap-2 px-6 py-3 rounded-xl text-sm font-medium transition-all focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#2DE2B1] w-full sm:w-auto"
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
              See how it works
              <ArrowDown className="w-3.5 h-3.5" aria-hidden="true" />
            </a>
          </div>

          {/* Trust note — no fake stats */}
          <p
            className="mt-6 text-xs land-fade-up"
            style={{ color: "rgba(246,245,239,0.35)", animationDelay: "320ms" }}
          >
            No credit card required &nbsp;·&nbsp; Cancel anytime
          </p>
        </div>

        {/* Right — animated product preview */}
        <div
          className="flex-1 w-full max-w-md land-fade-up"
          style={{ animationDelay: "200ms" }}
        >
          <div
            className="rounded-2xl p-5 land-float"
            style={{
              backgroundColor: "#0D292A",
              border: "1px solid rgba(45,226,177,0.12)",
              boxShadow: "0 32px 80px rgba(0,0,0,0.5), 0 0 0 1px rgba(45,226,177,0.05)",
            }}
          >
            {/* Preview label */}
            <div className="flex items-center justify-between mb-4">
              <div className="flex items-center gap-2">
                <div className="flex gap-1.5" aria-hidden="true">
                  <span className="w-2.5 h-2.5 rounded-full" style={{ backgroundColor: "rgba(255,107,107,0.6)" }} />
                  <span className="w-2.5 h-2.5 rounded-full" style={{ backgroundColor: "rgba(246,245,239,0.2)" }} />
                  <span className="w-2.5 h-2.5 rounded-full" style={{ backgroundColor: "rgba(246,245,239,0.2)" }} />
                </div>
                <span className="text-xs font-medium" style={{ color: "rgba(246,245,239,0.35)" }}>AIT · Product preview</span>
              </div>
              <span
                className="text-xs px-2 py-0.5 rounded-full"
                style={{ backgroundColor: "rgba(45,226,177,0.1)", color: "#2DE2B1", border: "1px solid rgba(45,226,177,0.2)" }}
              >
                live demo
              </span>
            </div>
            <HeroAnimation />
          </div>
        </div>
      </div>

      {/* Scroll indicator */}
      <div
        className="flex justify-center pb-8 land-fade-in"
        style={{ animationDelay: "600ms" }}
        aria-hidden="true"
      >
        <a
          href="#product"
          onClick={(e) => {
            e.preventDefault()
            document.querySelector("#product")?.scrollIntoView({ behavior: "smooth" })
          }}
          aria-label="Scroll to product features"
          className="flex flex-col items-center gap-2 opacity-40 hover:opacity-70 transition-opacity focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#2DE2B1] rounded-md p-1"
          style={{ color: "#F6F5EF" }}
        >
          <ArrowDown className="w-4 h-4 animate-bounce" />
        </a>
      </div>
    </section>
  )
}
