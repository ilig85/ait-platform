/**
 * AIT brand component — single canonical definition of the AIT Fold symbol.
 *
 * Variants:
 *   - symbol     → mark only (default)
 *   - wordmark   → mark + "AIT" text
 *
 * Themes:
 *   - sidebar    → mint container (#2DE2B1 bg) + deep-ink mark + white text  (for dark sidebar)
 *   - light      → ink container (#102223 bg) + white mark + ink text        (for light backgrounds)
 *   - plain      → no container, currentColor mark + currentColor text       (inherits from parent)
 *
 * The mark geometry is defined once here. Do NOT redefine it elsewhere.
 */

import type { CSSProperties } from "react"
import { cn } from "@/lib/utils"

// ─── Canonical AIT Fold mark ────────────────────────────────────────────────
// viewBox="0 0 96 96"  |  fill="currentColor"  |  no gradient, no glow, no shadow
function AitMark({ className, style }: { className?: string; style?: CSSProperties }) {
  return (
    <svg
      viewBox="0 0 96 96"
      fill="currentColor"
      xmlns="http://www.w3.org/2000/svg"
      aria-hidden="true"
      focusable="false"
      className={className}
      style={style}
    >
      <path d="M13 82L40 14H76V82H61V30H50L29 82H13Z" />
      <path d="M31 56H61V69H26L31 56Z" />
    </svg>
  )
}

// ─── Size scale ─────────────────────────────────────────────────────────────
const CONTAINER_SIZE: Record<string, string> = {
  xs:  "w-5 h-5",   // 20px  — collapsed sidebar icon
  sm:  "w-7 h-7",   // 28px  — default sidebar / nav
  md:  "w-8 h-8",   // 32px  — auth pages
  lg:  "w-10 h-10", // 40px  — landing hero / large contexts
  xl:  "w-14 h-14", // 56px  — loading screen
}

const MARK_PADDING: Record<string, string> = {
  xs:  "p-[3px]",
  sm:  "p-1",
  md:  "p-1.5",
  lg:  "p-2",
  xl:  "p-2.5",
}

const TEXT_SIZE: Record<string, string> = {
  xs:  "text-sm",
  sm:  "text-base",
  md:  "text-xl",
  lg:  "text-2xl",
  xl:  "text-3xl",
}

// ─── Theme ──────────────────────────────────────────────────────────────────
const THEME = {
  sidebar: {
    container: "rounded-md",
    containerStyle: { backgroundColor: "#2DE2B1" },
    markStyle:  { color: "#071A1B" },
    textStyle:  { color: "#FFFFFF" },
  },
  light: {
    container: "rounded-md",
    containerStyle: { backgroundColor: "#102223" },
    markStyle:  { color: "#FFFFFF" },
    textStyle:  { color: "#102223" },
  },
  plain: {
    container: "",
    containerStyle: {},
    markStyle:  {},
    textStyle:  {},
  },
} as const

// ─── Props ───────────────────────────────────────────────────────────────────
export interface AitLogoProps {
  /** "symbol" shows the mark only; "wordmark" adds the "AIT" text */
  variant?: "symbol" | "wordmark"
  /** Visual theme */
  theme?: "sidebar" | "light" | "plain"
  /** Container/icon size */
  size?: "xs" | "sm" | "md" | "lg" | "xl"
  /** Optional className on the root wrapper */
  className?: string
  /** Accessible label (defaults to "AIT") */
  label?: string
}

export function AitLogo({
  variant = "symbol",
  theme = "sidebar",
  size = "sm",
  className,
  label = "AIT",
}: AitLogoProps) {
  const t = THEME[theme]
  const containerSize = CONTAINER_SIZE[size]
  const padding = MARK_PADDING[size]
  const textSize = TEXT_SIZE[size]

  return (
    <div
      className={cn("flex items-center gap-2 flex-shrink-0", className)}
      role="img"
      aria-label={label}
    >
      {/* Mark container */}
      <div
        className={cn(
          "flex items-center justify-center flex-shrink-0",
          containerSize,
          padding,
          t.container,
        )}
        style={t.containerStyle}
        aria-hidden="true"
      >
        <AitMark style={t.markStyle} className="w-full h-full" />
      </div>

      {/* Wordmark */}
      {variant === "wordmark" && (
        <span
          className={cn("font-bold tracking-tight leading-none", textSize)}
          style={t.textStyle}
        >
          AIT
        </span>
      )}
    </div>
  )
}

// ─── Convenience aliases ─────────────────────────────────────────────────────
/** Mark only, sized for the dark sidebar (expanded) */
export function SidebarLogo({ className }: { className?: string }) {
  return <AitLogo variant="wordmark" theme="sidebar" size="sm" className={className} />
}

/** Mark only, for the collapsed sidebar */
export function SidebarLogoCollapsed({ className }: { className?: string }) {
  return <AitLogo variant="symbol" theme="sidebar" size="sm" className={className} />
}

/** For auth pages (light background) */
export function AuthLogo({ className }: { className?: string }) {
  return <AitLogo variant="wordmark" theme="light" size="md" className={className} />
}

/** For landing nav / footer (dark background, uses sidebar theme) */
export function NavLogo({ className }: { className?: string }) {
  return <AitLogo variant="wordmark" theme="sidebar" size="sm" className={className} />
}

/** Loading screen — large centered mark */
export function LoadingLogo({ className }: { className?: string }) {
  return <AitLogo variant="symbol" theme="sidebar" size="xl" className={className} />
}
