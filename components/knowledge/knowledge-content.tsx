"use client"

import { useState } from "react"
import { AlertCircle, BookOpen, CheckCircle2, Loader2, Save, Sparkles } from "lucide-react"
import { AitHeader } from "@/components/ait/header"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { Button } from "@/components/ui/button"
import { Textarea } from "@/components/ui/textarea"

const MAX_KNOWLEDGE_CHARACTERS = 30_000

export function KnowledgeContent({
  initialContent,
  available,
  canEdit,
}: {
  initialContent: string
  available: boolean
  canEdit: boolean
}) {
  const [content, setContent] = useState(initialContent)
  const [savedContent, setSavedContent] = useState(initialContent)
  const [isSaving, setIsSaving] = useState(false)
  const [message, setMessage] = useState<{ kind: "success" | "error"; text: string } | null>(null)

  async function saveKnowledge() {
    if (!available || !canEdit || isSaving || content === savedContent) return
    setIsSaving(true)
    setMessage(null)
    try {
      const response = await fetch("/api/knowledge", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ content }),
      })
      const payload = await response.json().catch(() => null) as { message?: string } | null
      if (!response.ok) {
        setMessage({ kind: "error", text: payload?.message ?? "AIT could not save business knowledge." })
        return
      }
      setSavedContent(content)
      setMessage({ kind: "success", text: "Saved. Automatic replies can now use this verified knowledge." })
    } catch {
      setMessage({ kind: "error", text: "AIT could not reach the server. Check your connection and try again." })
    } finally {
      setIsSaving(false)
    }
  }

  return (
    <>
      <AitHeader
        title="Knowledge Base"
        subtitle="Verified facts AIT can use in customer replies."
      />

      <div className="max-w-4xl space-y-4">
        <div className="rounded-xl border border-[#2DE2B1]/25 bg-[#2DE2B1]/7 p-4 flex items-start gap-3">
          <div className="w-9 h-9 rounded-lg bg-[#2DE2B1]/15 flex items-center justify-center flex-shrink-0">
            <Sparkles className="w-4 h-4 text-[#2DE2B1]" />
          </div>
          <div>
            <h2 className="text-sm font-semibold text-foreground">Fast MVP knowledge</h2>
            <p className="mt-1 text-xs leading-relaxed text-muted-foreground">
              Paste products, prices, availability, delivery, payment rules, and FAQs below. AIT may answer only from this manager-verified text; unsupported questions still go to a human.
            </p>
          </div>
        </div>

        <div className="bg-card border border-border/60 rounded-xl p-5 space-y-3">
          <div className="flex items-center justify-between gap-3">
            <div className="flex items-center gap-2">
              <BookOpen className="w-4 h-4 text-[#2DE2B1]" />
              <h2 className="text-sm font-semibold text-foreground">Business facts</h2>
            </div>
            <span className="text-[11px] text-muted-foreground">
              {content.length.toLocaleString()} / {MAX_KNOWLEDGE_CHARACTERS.toLocaleString()}
            </span>
          </div>

          <Textarea
            value={content}
            onChange={(event) => {
              setContent(event.target.value)
              if (message) setMessage(null)
            }}
            maxLength={MAX_KNOWLEDGE_CHARACTERS}
            disabled={!available || !canEdit || isSaving}
            className="min-h-[360px] resize-y text-sm leading-relaxed"
            placeholder={[
              "Business: AIT Demo Furniture",
              "Product: Sofia sofa — beige, three seats, wooden legs — 45,000 KGS — in stock.",
              "Product: Luna armchair — dark green, velvet — 18,000 KGS — in stock.",
              "Delivery: Free in Bishkek for orders above 40,000 KGS.",
              "Payment: Cash, card, or bank transfer.",
            ].join("\n")}
          />

          <div className="flex flex-wrap items-center justify-between gap-3">
            <p className="text-xs text-muted-foreground">
              Use short, explicit facts. Include currency and whether each product is in stock.
            </p>
            <Button
              type="button"
              size="sm"
              disabled={!available || !canEdit || isSaving || content === savedContent}
              onClick={() => void saveKnowledge()}
              className="bg-[#2DE2B1] text-[#071A1B] hover:bg-[#2DE2B1]/90"
            >
              {isSaving ? <Loader2 className="w-3.5 h-3.5 mr-1.5 animate-spin" /> : <Save className="w-3.5 h-3.5 mr-1.5" />}
              Save knowledge
            </Button>
          </div>
        </div>

        {!available && (
          <Alert className="border-amber-400/30 bg-amber-400/8">
            <AlertCircle className="h-4 w-4 text-amber-500" />
            <AlertDescription className="text-xs text-muted-foreground">
              Apply the minimal business-knowledge Supabase migration before saving.
            </AlertDescription>
          </Alert>
        )}
        {available && !canEdit && (
          <Alert>
            <AlertCircle className="h-4 w-4" />
            <AlertDescription className="text-xs">
              Only organization owners and managers can edit verified business knowledge.
            </AlertDescription>
          </Alert>
        )}
        {message && (
          <Alert className={message.kind === "error" ? "border-destructive/30 bg-destructive/5" : "border-[#2DE2B1]/30 bg-[#2DE2B1]/7"}>
            {message.kind === "error"
              ? <AlertCircle className="h-4 w-4 text-destructive" />
              : <CheckCircle2 className="h-4 w-4 text-[#2DE2B1]" />}
            <AlertDescription className={message.kind === "error" ? "text-xs text-destructive" : "text-xs text-muted-foreground"}>
              {message.text}
            </AlertDescription>
          </Alert>
        )}
      </div>
    </>
  )
}
