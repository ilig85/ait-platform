"use client"

import { createContext, useContext } from "react"
import type { ShellData } from "@/lib/data/models"

const ShellContext = createContext<ShellData | null>(null)

export function ShellProvider({
  value,
  children,
}: {
  value: ShellData
  children: React.ReactNode
}) {
  return <ShellContext.Provider value={value}>{children}</ShellContext.Provider>
}

export function useShellData() {
  const value = useContext(ShellContext)
  if (!value) throw new Error("useShellData must be used within ShellProvider")
  return value
}
