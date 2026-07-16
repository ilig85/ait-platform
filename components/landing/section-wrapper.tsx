"use client"

import { useReveal } from "@/hooks/use-reveal"

interface SectionWrapperProps {
  id?: string
  children: React.ReactNode
  dark?: boolean
  className?: string
}

export function SectionWrapper({ id, children, dark = false, className = "" }: SectionWrapperProps) {
  const { ref, visible } = useReveal(0.1)

  return (
    <section
      id={id}
      ref={ref as React.RefObject<HTMLElement>}
      style={{
        backgroundColor: dark ? "#071A1B" : "#F6F5EF",
        opacity: visible ? 1 : 0,
        transform: visible ? "translateY(0)" : "translateY(28px)",
        transition: "opacity 0.65s ease-out, transform 0.65s ease-out",
      }}
      className={`py-20 lg:py-28 ${className}`}
    >
      <div className="mx-auto max-w-7xl px-6 lg:px-8">
        {children}
      </div>
    </section>
  )
}
