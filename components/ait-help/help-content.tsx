"use client"

import { useState } from "react"
import { ChevronDown, ChevronUp, MessageCircle, BookOpen, Workflow, Shield } from "lucide-react"
import { cn } from "@/lib/utils"

const SECTIONS = [
  {
    icon: Workflow,
    title: "Getting Started",
    items: [
      {
        q: "How do I connect WhatsApp?",
        a: "Go to Settings > Channel and follow the QR pairing flow. Your phone must have WhatsApp installed. After scanning, the channel status will show as connected."
      },
      {
        q: "What is the onboarding process?",
        a: "After signing up, you will complete a short onboarding: enter your business name, hours, language preferences, and AI boundaries. Then connect your WhatsApp channel. The workspace becomes ready once the channel is verified."
      },
      {
        q: "Which languages are supported?",
        a: "The interface and AI replies support Kyrgyz (KY), Russian (RU), and English (EN). You can enable multiple languages from Settings > Business."
      },
    ],
  },
  {
    icon: MessageCircle,
    title: "Inbox & Conversations",
    items: [
      {
        q: "How does a customer message appear?",
        a: "Incoming WhatsApp messages are matched to a customer profile and appear in your Inbox. Unread conversations are highlighted. You can filter by AI status, open/resolved, or search by name."
      },
      {
        q: "Can I edit an AI draft before sending?",
        a: "Yes. Open any conversation and click the draft reply field. The AI reply is editable. You can approve as-is, edit it, or discard it and write your own."
      },
      {
        q: "What happens when a conversation is resolved?",
        a: "The conversation is archived with a timestamp and resolution method (AI or manager). Delivery status is recorded and the data feeds into your Insights."
      },
    ],
  },
  {
    icon: BookOpen,
    title: "Knowledge Base",
    items: [
      {
        q: "What is the knowledge base used for?",
        a: "The AI reads verified knowledge entries (FAQs, prices, services, policies) when generating replies. The more accurate and verified your entries are, the better the AI performs."
      },
      {
        q: "How do I verify an entry?",
        a: "Open any knowledge entry, review the answer, and click 'Mark verified'. Unverified entries are still used by the AI but are flagged as lower confidence."
      },
    ],
  },
  {
    icon: Shield,
    title: "Human Control & Audit",
    items: [
      {
        q: "Can the AI send replies without my approval?",
        a: "Only if Auto-reply mode is enabled in Settings > AI Behaviour. With Draft-only mode on, the manager always approves before sending. You are always in control."
      },
      {
        q: "Where can I see what the AI has done?",
        a: "Every AI action has a full execution history in AI Tasks. You can see the draft, the confidence score, the knowledge entries used, and the number of steps taken."
      },
      {
        q: "What triggers an escalation to a human?",
        a: "If the AI confidence falls below your threshold (set in Settings), or if the message contains an escalation keyword (e.g. refund, cancel), it is routed to your Inbox as 'Needs Human'."
      },
    ],
  },
]

export function AitHelpContent() {
  const [open, setOpen] = useState<string | null>(null)

  const toggle = (key: string) => setOpen(prev => prev === key ? null : key)

  return (
    <div className="flex flex-col gap-6 max-w-2xl">
      {/* Header */}
      <div>
        <h1 className="text-2xl font-semibold text-foreground">Help & Support</h1>
        <p className="text-sm text-muted-foreground mt-0.5">Answers to common questions about the AIT platform</p>
      </div>

      {/* Sections */}
      {SECTIONS.map(section => {
        const Icon = section.icon
        return (
          <div key={section.title} className="flex flex-col gap-2">
            <div className="flex items-center gap-2 mb-1">
              <Icon className="w-4 h-4 text-primary" />
              <h2 className="text-sm font-semibold text-foreground">{section.title}</h2>
            </div>
            {section.items.map(item => {
              const key = `${section.title}::${item.q}`
              const isOpen = open === key
              return (
                <div key={key} className="bg-card border border-border rounded-xl overflow-hidden">
                  <button
                    onClick={() => toggle(key)}
                    className="w-full flex items-center justify-between gap-3 px-4 py-3.5 text-left hover:bg-accent/40 transition-colors"
                  >
                    <span className="text-sm font-medium text-foreground">{item.q}</span>
                    {isOpen
                      ? <ChevronUp className="w-4 h-4 text-muted-foreground flex-shrink-0" />
                      : <ChevronDown className="w-4 h-4 text-muted-foreground flex-shrink-0" />
                    }
                  </button>
                  {isOpen && (
                    <div className="px-4 pb-4 border-t border-border bg-accent/20">
                      <p className="text-sm text-muted-foreground leading-relaxed pt-3">{item.a}</p>
                    </div>
                  )}
                </div>
              )
            })}
          </div>
        )
      })}

      {/* Contact block */}
      <div className="bg-card border border-border rounded-xl p-5 flex items-start gap-4">
        <div className="w-10 h-10 rounded-xl bg-primary/10 flex items-center justify-center flex-shrink-0">
          <MessageCircle className="w-5 h-5 text-primary" />
        </div>
        <div>
          <h3 className="text-sm font-semibold text-foreground">Still have a question?</h3>
          <p className="text-xs text-muted-foreground mt-1 leading-relaxed">
            Contact the AIT support team at{" "}
            <a href="mailto:support@ait.com" className="text-primary hover:underline">support@ait.com</a>
            {" "}or open a live chat from the WhatsApp business number. We respond within one business day.
          </p>
        </div>
      </div>
    </div>
  )
}
