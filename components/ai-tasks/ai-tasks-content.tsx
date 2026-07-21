"use client"

import Link from "next/link"
import { FileText, MessageSquare, Sparkles } from "lucide-react"
import { AitHeader } from "@/components/ait/header"
import { Button } from "@/components/ui/button"

const capabilities = [
  {
    icon: FileText,
    title: "Conversation summaries",
    description: "Turn the stored WhatsApp thread into customer need, key facts, status, and a recommended next step.",
  },
  {
    icon: MessageSquare,
    title: "Editable reply drafts",
    description: "Generate a concise reply in the customer's language, review it, then send through the existing WhatsApp connection.",
  },
]

export function AITasksContent() {
  return (
    <>
      <AitHeader title="AI Tasks" subtitle="Create and supervise AI-assisted work." />
      <div className="flex flex-col items-center justify-center flex-1 py-12">
        <div className="w-full max-w-2xl rounded-2xl border border-border/60 bg-card p-6">
          <div className="w-12 h-12 rounded-2xl bg-[#2DE2B1]/10 border border-[#2DE2B1]/20 flex items-center justify-center mb-4">
            <Sparkles className="w-5 h-5 text-[#2DE2B1]" />
          </div>
          <h2 className="text-lg font-semibold text-foreground">AIT Copilot is ready in Inbox</h2>
          <p className="text-sm text-muted-foreground mt-1.5 leading-relaxed max-w-xl">
            AI stays human-supervised: record the customer&apos;s consent, create a summary or draft,
            review the result, and choose whether to send it.
          </p>

          <div className="grid gap-3 sm:grid-cols-2 mt-6">
            {capabilities.map((capability) => {
              const Icon = capability.icon
              return (
                <div key={capability.title} className="rounded-xl border border-border/60 bg-background/50 p-4">
                  <Icon className="w-4 h-4 text-[#2DE2B1] mb-2" />
                  <p className="text-sm font-semibold text-foreground">{capability.title}</p>
                  <p className="text-xs text-muted-foreground mt-1 leading-relaxed">
                    {capability.description}
                  </p>
                </div>
              )
            })}
          </div>

          <Button
            size="sm"
            className="mt-6 bg-[#2DE2B1] text-[#071A1B] hover:bg-[#2DE2B1]/90"
            asChild
          >
            <Link href="/inbox">
              Open AI Copilot in Inbox
            </Link>
          </Button>
        </div>
      </div>
    </>
  )
}
