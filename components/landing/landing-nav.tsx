"use client"

import { useState, useEffect } from "react"
import Link from "next/link"
import { Menu, X, Zap } from "lucide-react"

const navLinks = [
  { label: "Product", href: "#product" },
  { label: "How it works", href: "#how-it-works" },
  { label: "Security", href: "#security" },
]

export function LandingNav() {
  const [scrolled, setScrolled] = useState(false)
  const [mobileOpen, setMobileOpen] = useState(false)

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 20)
    window.addEventListener("scroll", onScroll, { passive: true })
    return () => window.removeEventListener("scroll", onScroll)
  }, [])

  const handleAnchor = (
    e: React.MouseEvent<HTMLAnchorElement>,
    href: string
  ) => {
    if (href.startsWith("#")) {
      e.preventDefault()
      setMobileOpen(false)
      const el = document.querySelector(href)
      if (el) el.scrollIntoView({ behavior: "smooth", block: "start" })
    }
  }

  return (
    <header
      role="banner"
      style={{
        backgroundColor: scrolled
          ? "rgba(7,26,27,0.92)"
          : "transparent",
        backdropFilter: scrolled ? "blur(12px)" : "none",
        borderBottom: scrolled
          ? "1px solid rgba(45,226,177,0.08)"
          : "1px solid transparent",
        transition: "background-color 0.3s, backdrop-filter 0.3s, border-color 0.3s",
      }}
      className="fixed top-0 left-0 right-0 z-50"
    >
      <nav
        aria-label="Main navigation"
        className="mx-auto max-w-7xl px-6 lg:px-8 h-16 flex items-center justify-between"
      >
        {/* Logo */}
        <Link
          href="/"
          className="flex items-center gap-2.5 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#2DE2B1] rounded-md"
          aria-label="AIT home"
        >
          <div
            className="w-8 h-8 rounded-lg flex items-center justify-center"
            style={{ backgroundColor: "#2DE2B1" }}
          >
            <Zap className="w-4 h-4" style={{ color: "#071A1B" }} aria-hidden="true" />
          </div>
          <span
            className="text-lg font-bold tracking-tight"
            style={{ color: "#FFFFFF" }}
          >
            AIT
          </span>
        </Link>

        {/* Desktop links */}
        <div className="hidden md:flex items-center gap-8" role="list">
          {navLinks.map((link) => (
            <a
              key={link.href}
              href={link.href}
              role="listitem"
              onClick={(e) => handleAnchor(e, link.href)}
              className="text-sm font-medium transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#2DE2B1] rounded-sm px-1"
              style={{ color: "rgba(246,245,239,0.7)" }}
              onMouseEnter={(e) =>
                ((e.target as HTMLElement).style.color = "#F6F5EF")
              }
              onMouseLeave={(e) =>
                ((e.target as HTMLElement).style.color = "rgba(246,245,239,0.7)")
              }
            >
              {link.label}
            </a>
          ))}
        </div>

        {/* Desktop CTAs */}
        <div className="hidden md:flex items-center gap-3">
          <Link
            href="/login"
            className="text-sm font-medium px-4 py-2 rounded-lg transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#2DE2B1]"
            style={{ color: "rgba(246,245,239,0.75)" }}
            onMouseEnter={(e) =>
              ((e.target as HTMLElement).style.color = "#F6F5EF")
            }
            onMouseLeave={(e) =>
              ((e.target as HTMLElement).style.color = "rgba(246,245,239,0.75)")
            }
          >
            Log in
          </Link>
          <Link
            href="/signup"
            className="text-sm font-semibold px-4 py-2 rounded-lg transition-all focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#2DE2B1] focus-visible:ring-offset-2 focus-visible:ring-offset-[#071A1B]"
            style={{
              backgroundColor: "#2DE2B1",
              color: "#071A1B",
            }}
            onMouseEnter={(e) =>
              ((e.target as HTMLElement).style.backgroundColor = "#25c99e")
            }
            onMouseLeave={(e) =>
              ((e.target as HTMLElement).style.backgroundColor = "#2DE2B1")
            }
          >
            Start free
          </Link>
        </div>

        {/* Mobile menu button */}
        <button
          aria-label={mobileOpen ? "Close menu" : "Open menu"}
          aria-expanded={mobileOpen}
          aria-controls="mobile-menu"
          className="md:hidden p-2 rounded-lg focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#2DE2B1]"
          style={{ color: "#F6F5EF" }}
          onClick={() => setMobileOpen((o) => !o)}
        >
          {mobileOpen ? (
            <X className="w-5 h-5" aria-hidden="true" />
          ) : (
            <Menu className="w-5 h-5" aria-hidden="true" />
          )}
        </button>
      </nav>

      {/* Mobile menu */}
      {mobileOpen && (
        <div
          id="mobile-menu"
          role="dialog"
          aria-label="Mobile navigation"
          style={{ backgroundColor: "rgba(7,26,27,0.97)", borderTop: "1px solid rgba(45,226,177,0.1)" }}
          className="md:hidden px-6 py-5 flex flex-col gap-4"
        >
          {navLinks.map((link) => (
            <a
              key={link.href}
              href={link.href}
              onClick={(e) => handleAnchor(e, link.href)}
              className="text-base font-medium py-1 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#2DE2B1] rounded-sm"
              style={{ color: "rgba(246,245,239,0.8)" }}
            >
              {link.label}
            </a>
          ))}
          <div className="flex flex-col gap-2 pt-2" style={{ borderTop: "1px solid rgba(255,255,255,0.08)" }}>
            <Link
              href="/login"
              className="text-base font-medium py-2 text-center rounded-lg focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#2DE2B1]"
              style={{ color: "rgba(246,245,239,0.75)" }}
              onClick={() => setMobileOpen(false)}
            >
              Log in
            </Link>
            <Link
              href="/signup"
              className="text-base font-semibold py-2.5 text-center rounded-lg focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#2DE2B1]"
              style={{ backgroundColor: "#2DE2B1", color: "#071A1B" }}
              onClick={() => setMobileOpen(false)}
            >
              Start free
            </Link>
          </div>
        </div>
      )}
    </header>
  )
}
