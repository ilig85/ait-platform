"use client"

import Link from "next/link"
import { AitLogo } from "@/components/brand/ait-logo"

const links = [
  {
    heading: "Product",
    items: [
      { label: "Unified Inbox", href: "#product" },
      { label: "AI Reply", href: "#how-it-works" },
      { label: "Customer Records", href: "#product" },
      { label: "Insights", href: "#product" },
    ],
  },
  {
    heading: "Security",
    items: [
      { label: "Security overview", href: "#security" },
      { label: "Human control", href: "#security" },
      { label: "Audit trail", href: "#security" },
    ],
  },
  {
    heading: "Account",
    items: [
      { label: "Log in", href: "/login" },
      { label: "Create account", href: "/signup" },
    ],
  },
]

export function LandingFooter() {
  const handleAnchor = (e: React.MouseEvent<HTMLAnchorElement>, href: string) => {
    if (href.startsWith("#")) {
      e.preventDefault()
      document.querySelector(href)?.scrollIntoView({ behavior: "smooth" })
    }
  }

  return (
    <footer
      role="contentinfo"
      style={{ backgroundColor: "#071A1B", borderTop: "1px solid rgba(45,226,177,0.08)" }}
      className="py-14"
    >
      <div className="mx-auto max-w-7xl px-6 lg:px-8">
        <div className="flex flex-col lg:flex-row gap-10 lg:gap-16">
          {/* Brand */}
          <div className="flex-shrink-0 max-w-xs">
            <Link
              href="/"
              className="inline-flex items-center gap-2.5 mb-4 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#2DE2B1] rounded-md"
              aria-label="AIT home"
            >
              <AitLogo variant="wordmark" theme="sidebar" size="sm" label="AIT" />
            </Link>
            <p
              className="text-sm leading-relaxed"
              style={{ color: "rgba(246,245,239,0.45)" }}
            >
              AI-powered WhatsApp communication for growing businesses. You stay in control — always.
            </p>
          </div>

          {/* Links */}
          <nav
            aria-label="Footer navigation"
            className="flex-1 grid grid-cols-2 sm:grid-cols-3 gap-8"
          >
            {links.map((col) => (
              <div key={col.heading}>
                <p
                  className="text-xs font-semibold uppercase tracking-widest mb-4"
                  style={{ color: "rgba(246,245,239,0.35)" }}
                >
                  {col.heading}
                </p>
                <ul className="flex flex-col gap-2.5" role="list">
                  {col.items.map((item) => (
                    <li key={item.label} role="listitem">
                      {item.href.startsWith("#") ? (
                        <a
                          href={item.href}
                          onClick={(e) => handleAnchor(e, item.href)}
                          className="text-sm transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#2DE2B1] rounded-sm"
                          style={{ color: "rgba(246,245,239,0.55)" }}
                          onMouseEnter={(e) =>
                            ((e.target as HTMLElement).style.color = "#F6F5EF")
                          }
                          onMouseLeave={(e) =>
                            ((e.target as HTMLElement).style.color = "rgba(246,245,239,0.55)")
                          }
                        >
                          {item.label}
                        </a>
                      ) : (
                        <Link
                          href={item.href}
                          className="text-sm transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#2DE2B1] rounded-sm"
                          style={{ color: "rgba(246,245,239,0.55)" }}
                          onMouseEnter={(e) =>
                            ((e.currentTarget as HTMLElement).style.color = "#F6F5EF")
                          }
                          onMouseLeave={(e) =>
                            ((e.currentTarget as HTMLElement).style.color = "rgba(246,245,239,0.55)")
                          }
                        >
                          {item.label}
                        </Link>
                      )}
                    </li>
                  ))}
                </ul>
              </div>
            ))}
          </nav>
        </div>

        {/* Bottom bar */}
        <div
          className="mt-12 pt-6 flex flex-col sm:flex-row items-center justify-between gap-3"
          style={{ borderTop: "1px solid rgba(255,255,255,0.06)" }}
        >
          <p
            className="text-xs"
            style={{ color: "rgba(246,245,239,0.3)" }}
          >
            {new Date().getFullYear()} AIT. All rights reserved.
          </p>
          <p
            className="text-xs"
            style={{ color: "rgba(246,245,239,0.2)" }}
          >
            AI assists. Humans decide.
          </p>
        </div>
      </div>
    </footer>
  )
}
