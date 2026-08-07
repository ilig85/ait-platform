/**
 * Canonical AIT frog logo, adapted from the presentation identity.
 * Keep the mark compact and friendly; teal means a verified answer and amber
 * is reserved for uncertainty or a manager handoff.
 */

import type { CSSProperties } from "react"
import { cn } from "@/lib/utils"

type LogoTheme = "sidebar" | "light" | "plain"

function AitMark({ theme, className }: { theme: LogoTheme; className?: string }) {
  const colors = theme === "sidebar"
    ? { frog: "#9AC8AA", ink: "#11333B", eye: "#F7F3EA", amber: "#E3A15A" }
    : { frog: "#6FA987", ink: "#14363E", eye: "#FFFDF8", amber: "#E3A15A" }

  return (
    <svg
      viewBox="0 0 440 400"
      xmlns="http://www.w3.org/2000/svg"
      aria-hidden="true"
      focusable="false"
      className={className}
    >
      <path
        d="M59 166C57 104 94 57 146 57c27 0 51 13 68 34 17-21 41-34 68-34 52 0 89 47 87 109 22 20 35 49 35 81 0 68-55 113-190 113S24 315 24 247c0-32 13-61 35-81Z"
        fill={colors.frog}
        stroke={colors.ink}
        strokeWidth="14"
        strokeLinejoin="round"
      />
      <ellipse cx="146" cy="135" rx="42" ry="54" fill={colors.eye} stroke={colors.ink} strokeWidth="12" />
      <ellipse cx="282" cy="135" rx="42" ry="54" fill={colors.eye} stroke={colors.ink} strokeWidth="12" />
      <ellipse cx="151" cy="143" rx="17" ry="27" fill={colors.ink} />
      <ellipse cx="277" cy="143" rx="17" ry="27" fill={colors.ink} />
      <circle cx="157" cy="134" r="6" fill={colors.eye} />
      <circle cx="283" cy="134" r="6" fill={colors.eye} />
      <path
        d="M105 241c28 39 69 58 109 58s81-19 109-58"
        fill="none"
        stroke={colors.ink}
        strokeWidth="14"
        strokeLinecap="round"
      />
      <circle cx="205" cy="214" r="6" fill={colors.ink} />
      <circle cx="223" cy="214" r="6" fill={colors.ink} />
      <circle cx="344" cy="274" r="13" fill={colors.amber} />
    </svg>
  )
}

const CONTAINER_SIZE: Record<string, string> = {
  xs: "w-5 h-5",
  sm: "w-8 h-8",
  md: "w-9 h-9",
  lg: "w-11 h-11",
  xl: "w-16 h-16",
}

const TEXT_SIZE: Record<string, string> = {
  xs: "text-sm",
  sm: "text-lg",
  md: "text-2xl",
  lg: "text-3xl",
  xl: "text-4xl",
}

const THEME: Record<LogoTheme, {
  container: string
  containerStyle: CSSProperties
  textStyle: CSSProperties
}> = {
  sidebar: {
    container: "rounded-xl bg-white/7 ring-1 ring-white/10",
    containerStyle: {},
    textStyle: { color: "#F7F3EA" },
  },
  light: {
    container: "rounded-xl bg-[#DCE9E1] ring-1 ring-[#14363E]/8",
    containerStyle: {},
    textStyle: { color: "#1E4D57" },
  },
  plain: {
    container: "",
    containerStyle: {},
    textStyle: {},
  },
}

export interface AitLogoProps {
  variant?: "symbol" | "wordmark"
  theme?: LogoTheme
  size?: "xs" | "sm" | "md" | "lg" | "xl"
  className?: string
  label?: string
}

export function AitLogo({
  variant = "symbol",
  theme = "sidebar",
  size = "sm",
  className,
  label = "AIT",
}: AitLogoProps) {
  const currentTheme = THEME[theme]

  return (
    <div
      className={cn("flex items-center gap-2.5 flex-shrink-0", className)}
      role="img"
      aria-label={label}
    >
      <div
        className={cn(
          "flex items-center justify-center flex-shrink-0 overflow-hidden p-0.5",
          CONTAINER_SIZE[size],
          currentTheme.container,
        )}
        style={currentTheme.containerStyle}
        aria-hidden="true"
      >
        <AitMark theme={theme} className="w-full h-full" />
      </div>

      {variant === "wordmark" && (
        <span
          className={cn("font-semibold tracking-[-0.035em] leading-none", TEXT_SIZE[size])}
          style={{ ...currentTheme.textStyle, fontFamily: "var(--font-ait-display), Georgia, serif" }}
        >
          AIT
        </span>
      )}
    </div>
  )
}

export function SidebarLogo({ className }: { className?: string }) {
  return <AitLogo variant="wordmark" theme="sidebar" size="sm" className={className} />
}

export function SidebarLogoCollapsed({ className }: { className?: string }) {
  return <AitLogo variant="symbol" theme="sidebar" size="sm" className={className} />
}

export function AuthLogo({ className }: { className?: string }) {
  return <AitLogo variant="wordmark" theme="light" size="md" className={className} />
}

export function NavLogo({ className }: { className?: string }) {
  return <AitLogo variant="wordmark" theme="sidebar" size="sm" className={className} />
}

export function LoadingLogo({ className }: { className?: string }) {
  return <AitLogo variant="symbol" theme="sidebar" size="xl" className={className} />
}
