import { cn } from "@/lib/utils"

type LogoTheme = "sidebar" | "light" | "plain"

const ICON_SIZE = {
  xs: "h-6 w-8",
  sm: "h-8 w-10",
  md: "h-10 w-12",
  lg: "h-12 w-16",
  xl: "h-20 w-24",
} as const

const TEXT_SIZE = {
  xs: "text-sm",
  sm: "text-lg",
  md: "text-2xl",
  lg: "text-3xl",
  xl: "text-4xl",
} as const

export interface AitLogoProps {
  variant?: "symbol" | "wordmark"
  theme?: LogoTheme
  size?: keyof typeof ICON_SIZE
  className?: string
  label?: string
}

export function AitLogo({ variant = "symbol", theme = "light", size = "sm", className, label = "AIT" }: AitLogoProps) {
  const textColor = theme === "sidebar" ? "text-[#F8F3E9]" : theme === "light" ? "text-[#173E3C]" : "text-current"

  return (
    <span className={cn("inline-flex shrink-0 items-center gap-2", textColor, className)} role="img" aria-label={label}>
      <img src="/ait-logo-icon.svg" alt="" aria-hidden="true" className={cn("shrink-0 object-contain", ICON_SIZE[size])} />
      {variant === "wordmark" && (
        <span className={cn("font-extrabold leading-none tracking-[-.055em]", TEXT_SIZE[size])}>AIT</span>
      )}
    </span>
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
  return <AitLogo variant="wordmark" theme="light" size="sm" className={className} />
}

export function LoadingLogo({ className }: { className?: string }) {
  return <AitLogo variant="symbol" theme="sidebar" size="xl" className={className} />
}
