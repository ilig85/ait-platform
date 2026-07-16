"use client"

import { BookOpen, FileText, Lock } from "lucide-react"
import { AitHeader } from "@/components/ait/header"
import { Button } from "@/components/ui/button"

const PLACEHOLDER_CATEGORIES = [
  { label: "FAQs", count: "—", icon: FileText },
  { label: "Pricing", count: "—", icon: FileText },
  { label: "Policies", count: "—", icon: Lock },
] as const

export function KnowledgeContent() {
  return (
    <>
      <AitHeader
        title="Knowledge Base"
        subtitle="Manager-verified business knowledge for future AI workflows."
      />

      {/* Category scaffolding — greyed out until backend is wired */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 mb-6">
        {PLACEHOLDER_CATEGORIES.map((cat) => {
          const Icon = cat.icon
          return (
            <div
              key={cat.label}
              className="bg-card border border-border/60 rounded-xl p-4 flex items-center gap-3 opacity-40 select-none"
            >
              <div className="w-8 h-8 rounded-lg bg-muted flex items-center justify-center flex-shrink-0">
                <Icon className="w-4 h-4 text-muted-foreground" />
              </div>
              <div>
                <p className="text-xs font-medium text-foreground">{cat.label}</p>
                <p className="text-xs text-muted-foreground">{cat.count} entries</p>
              </div>
            </div>
          )
        })}
      </div>

      {/* Empty state */}
      <div className="bg-card border border-border/60 rounded-xl p-10 flex flex-col items-center text-center gap-4">
        <div className="w-14 h-14 rounded-2xl bg-[#2DE2B1]/10 border border-[#2DE2B1]/20 flex items-center justify-center">
          <BookOpen className="w-6 h-6 text-[#2DE2B1]" />
        </div>
        <div>
          <h2 className="text-sm font-semibold text-foreground">Knowledge storage is coming soon</h2>
          <p className="text-sm text-muted-foreground mt-1 leading-relaxed max-w-sm">
            No production knowledge-base table exists in the current schema. No placeholder entries are displayed or editable.
          </p>
        </div>
        <Button
          size="sm"
          disabled
          className="bg-[#2DE2B1] text-[#071A1B] hover:bg-[#2DE2B1]/90 opacity-50 cursor-not-allowed"
        >
          Add Entry
        </Button>
      </div>
    </>
  )
}
