"use client"

import { useRef, useState } from "react"
import {
  AlertCircle,
  BookOpen,
  CheckCircle2,
  Download,
  FileSpreadsheet,
  Loader2,
  Save,
  Sparkles,
} from "lucide-react"
import { AitHeader } from "@/components/ait/header"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Textarea } from "@/components/ui/textarea"

const MAX_KNOWLEDGE_CHARACTERS = 30_000
const MAX_SPREADSHEET_BYTES = 1_000_000
const MAX_SPREADSHEET_ROWS = 500

type TestResult = {
  kind: "answer" | "handoff" | "error"
  text: string
}

function detectDelimiter(source: string) {
  const candidates = [",", ";", "\t"] as const
  const counts = new Map<string, number>(candidates.map((candidate) => [candidate, 0]))
  let quoted = false

  for (const character of source.split(/\r?\n/, 1)[0] ?? "") {
    if (character === "\"") {
      quoted = !quoted
    } else if (!quoted && counts.has(character)) {
      counts.set(character, (counts.get(character) ?? 0) + 1)
    }
  }

  return candidates.reduce((best, candidate) =>
    (counts.get(candidate) ?? 0) > (counts.get(best) ?? 0) ? candidate : best,
  )
}

function parseCsv(source: string) {
  const text = source.replace(/^\uFEFF/, "")
  const delimiter = detectDelimiter(text)
  const rows: string[][] = []
  let row: string[] = []
  let cell = ""
  let quoted = false

  for (let index = 0; index < text.length; index += 1) {
    const character = text[index]

    if (quoted) {
      if (character === "\"" && text[index + 1] === "\"") {
        cell += "\""
        index += 1
      } else if (character === "\"") {
        quoted = false
      } else {
        cell += character
      }
      continue
    }

    if (character === "\"" && cell.length === 0) {
      quoted = true
    } else if (character === delimiter) {
      row.push(cell)
      cell = ""
    } else if (character === "\n" || character === "\r") {
      if (character === "\r" && text[index + 1] === "\n") index += 1
      row.push(cell)
      rows.push(row)
      row = []
      cell = ""
    } else {
      cell += character
    }
  }

  if (quoted) throw new Error("The spreadsheet contains an unfinished quoted cell.")
  if (cell.length > 0 || row.length > 0) {
    row.push(cell)
    rows.push(row)
  }

  return rows.filter((candidate) => candidate.some((value) => value.trim()))
}

function spreadsheetToKnowledge(source: string) {
  const rows = parseCsv(source)
  if (rows.length < 2) {
    throw new Error("The spreadsheet needs a header row and at least one knowledge row.")
  }

  const headers = rows[0].map((value, index) => value.trim() || `Column ${index + 1}`)
  const dataRows = rows.slice(1).filter((row) => row.some((value) => value.trim()))
  if (dataRows.length > MAX_SPREADSHEET_ROWS) {
    throw new Error(`Import up to ${MAX_SPREADSHEET_ROWS} rows at a time.`)
  }

  const records = dataRows.map((row, rowIndex) => {
    const facts = headers
      .map((header, columnIndex) => {
        const value = row[columnIndex]?.replace(/\s+/g, " ").trim()
        return value ? `${header}: ${value}` : null
      })
      .filter((value): value is string => Boolean(value))

    return `Record ${rowIndex + 1}: ${facts.join(" | ")}`
  })

  const knowledge = records.join("\n")
  if (!knowledge) throw new Error("No usable knowledge was found in the spreadsheet.")
  if (knowledge.length > MAX_KNOWLEDGE_CHARACTERS) {
    throw new Error("This import is too large. Remove some rows or columns and try again.")
  }

  return { knowledge, rowCount: records.length }
}

function downloadTemplate() {
  const template = [
    ["Type", "Name", "Description", "Price", "Availability", "Schedule", "Notes"],
    ["Course", "IELTS September", "IELTS preparation course", "8,000 KGS/month", "Places available", "Mon/Wed/Fri 18:30", "Materials included"],
    ["Course", "English Beginner", "English from the beginning", "6,500 KGS/month", "4 places", "Tue/Thu 17:00", "First lesson is free"],
    ["Policy", "Discounts", "Special discounts require a manager", "", "Manager approval required", "", "AIT must not promise a discount"],
  ]
  const csv = `\uFEFF${template
    .map((row) => row.map((value) => `"${value.replaceAll("\"", "\"\"")}"`).join(","))
    .join("\r\n")}`
  const url = URL.createObjectURL(new Blob([csv], { type: "text/csv;charset=utf-8" }))
  const anchor = document.createElement("a")
  anchor.href = url
  anchor.download = "AIT-knowledge-template.csv"
  anchor.click()
  URL.revokeObjectURL(url)
}

export function KnowledgeContent({
  initialContent,
  available,
  canEdit,
}: {
  initialContent: string
  available: boolean
  canEdit: boolean
}) {
  const fileInputRef = useRef<HTMLInputElement>(null)
  const [content, setContent] = useState(initialContent)
  const [savedContent, setSavedContent] = useState(initialContent)
  const [isSaving, setIsSaving] = useState(false)
  const [isImporting, setIsImporting] = useState(false)
  const [question, setQuestion] = useState("")
  const [isTesting, setIsTesting] = useState(false)
  const [testResult, setTestResult] = useState<TestResult | null>(null)
  const [message, setMessage] = useState<{ kind: "success" | "error"; text: string } | null>(null)

  async function saveKnowledge() {
    if (!available || !canEdit || isSaving || content === savedContent) return
    setIsSaving(true)
    setMessage(null)
    setTestResult(null)
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

  async function importSpreadsheet(file: File | undefined) {
    if (!file) return
    setMessage(null)
    setTestResult(null)

    if (!file.name.toLowerCase().endsWith(".csv")) {
      setMessage({
        kind: "error",
        text: "Export the spreadsheet as a CSV file from Excel or Google Sheets, then upload it here.",
      })
      return
    }
    if (file.size > MAX_SPREADSHEET_BYTES) {
      setMessage({ kind: "error", text: "The spreadsheet is too large. Upload a CSV under 1 MB." })
      return
    }

    setIsImporting(true)
    try {
      const imported = spreadsheetToKnowledge(await file.text())
      if (content.trim() && !window.confirm("Replace the current editor content with this spreadsheet? Nothing changes until you click Save knowledge.")) {
        return
      }
      setContent(imported.knowledge)
      setMessage({
        kind: "success",
        text: `Imported ${imported.rowCount} rows. Review them below, then click Save knowledge.`,
      })
    } catch (error) {
      setMessage({
        kind: "error",
        text: error instanceof Error ? error.message : "AIT could not read this spreadsheet.",
      })
    } finally {
      setIsImporting(false)
      if (fileInputRef.current) fileInputRef.current.value = ""
    }
  }

  async function testKnowledge() {
    const trimmedQuestion = question.trim()
    if (!trimmedQuestion || isTesting) return
    if (content !== savedContent) {
      setTestResult({ kind: "error", text: "Save the imported knowledge before testing it." })
      return
    }

    setIsTesting(true)
    setTestResult(null)
    try {
      const response = await fetch("/api/knowledge/test", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ question: trimmedQuestion }),
      })
      const payload = await response.json().catch(() => null) as {
        status?: string
        answer?: string
        message?: string
      } | null

      if (!response.ok) {
        setTestResult({ kind: "error", text: payload?.message ?? "AIT could not test this question." })
        return
      }
      if (payload?.status === "answered" && payload.answer) {
        setTestResult({ kind: "answer", text: payload.answer })
      } else {
        setTestResult({
          kind: "handoff",
          text: payload?.answer ?? "The saved knowledge does not fully support an answer, so AIT would send this question to a manager.",
        })
      }
    } catch {
      setTestResult({ kind: "error", text: "AIT could not reach the server. Check your connection and try again." })
    } finally {
      setIsTesting(false)
    }
  }

  return (
    <>
      <AitHeader
        title="Knowledge Base"
        subtitle="Verified facts AIT can use in customer replies."
      />

      <div className="max-w-4xl space-y-4">
        <div className="rounded-xl border border-primary/25 bg-primary/7 p-4 flex items-start gap-3">
          <div className="w-9 h-9 rounded-lg bg-primary/15 flex items-center justify-center flex-shrink-0">
            <Sparkles className="w-4 h-4 text-primary" />
          </div>
          <div>
            <h2 className="text-sm font-semibold text-foreground">Fast MVP knowledge</h2>
            <p className="mt-1 text-xs leading-relaxed text-muted-foreground">
              Add facts manually or import a spreadsheet. AIT may answer only from saved, manager-verified knowledge; unsupported questions still go to a human.
            </p>
          </div>
        </div>

        <div className="bg-card border border-border/60 rounded-xl p-5 space-y-4">
          <div className="flex flex-wrap items-start justify-between gap-3">
            <div>
              <div className="flex items-center gap-2">
                <FileSpreadsheet className="w-4 h-4 text-primary" />
                <h2 className="text-sm font-semibold text-foreground">Import a spreadsheet</h2>
              </div>
              <p className="mt-1 text-xs text-muted-foreground">
                In Excel or Google Sheets, choose Download or Save as CSV, then upload the file.
              </p>
            </div>
            <div className="flex flex-wrap gap-2">
              <input
                ref={fileInputRef}
                type="file"
                accept=".csv,text/csv"
                className="hidden"
                onChange={(event) => void importSpreadsheet(event.target.files?.[0])}
              />
              <Button
                type="button"
                size="sm"
                variant="outline"
                disabled={!available || !canEdit || isImporting}
                onClick={() => fileInputRef.current?.click()}
              >
                {isImporting
                  ? <Loader2 className="w-3.5 h-3.5 mr-1.5 animate-spin" />
                  : <FileSpreadsheet className="w-3.5 h-3.5 mr-1.5" />}
                Upload CSV
              </Button>
              <Button type="button" size="sm" variant="outline" onClick={downloadTemplate}>
                <Download className="w-3.5 h-3.5 mr-1.5" />
                Download template
              </Button>
            </div>
          </div>
        </div>

        <div className="bg-card border border-border/60 rounded-xl p-5 space-y-3">
          <div className="flex items-center justify-between gap-3">
            <div className="flex items-center gap-2">
              <BookOpen className="w-4 h-4 text-primary" />
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
              setTestResult(null)
              if (message) setMessage(null)
            }}
            maxLength={MAX_KNOWLEDGE_CHARACTERS}
            disabled={!available || !canEdit || isSaving}
            className="min-h-[320px] resize-y text-sm leading-relaxed"
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
              Spreadsheet rows are converted into explicit facts that you can review before saving.
            </p>
            <Button
              type="button"
              size="sm"
              disabled={!available || !canEdit || isSaving || content === savedContent}
              onClick={() => void saveKnowledge()}
              className="bg-primary text-primary-foreground hover:bg-primary/90"
            >
              {isSaving ? <Loader2 className="w-3.5 h-3.5 mr-1.5 animate-spin" /> : <Save className="w-3.5 h-3.5 mr-1.5" />}
              Save knowledge
            </Button>
          </div>
        </div>

        <div className="bg-card border border-border/60 rounded-xl p-5 space-y-3">
          <div className="flex items-center gap-2">
            <Sparkles className="w-4 h-4 text-primary" />
            <h2 className="text-sm font-semibold text-foreground">Test an AI answer</h2>
          </div>
          <p className="text-xs text-muted-foreground">
            Ask a customer-style question. This preview uses the same saved business knowledge as automatic WhatsApp replies.
          </p>
          <div className="flex flex-col gap-2 sm:flex-row">
            <Input
              value={question}
              onChange={(event) => {
                setQuestion(event.target.value)
                setTestResult(null)
              }}
              onKeyDown={(event) => {
                if (event.key === "Enter") void testKnowledge()
              }}
              maxLength={500}
              disabled={!available || isTesting}
              placeholder="For example: Сколько стоит курс IELTS?"
            />
            <Button
              type="button"
              size="sm"
              disabled={!available || isTesting || !question.trim() || !savedContent.trim()}
              onClick={() => void testKnowledge()}
              className="bg-primary text-primary-foreground hover:bg-primary/90 sm:min-w-28"
            >
              {isTesting ? <Loader2 className="w-3.5 h-3.5 mr-1.5 animate-spin" /> : <Sparkles className="w-3.5 h-3.5 mr-1.5" />}
              Test AI
            </Button>
          </div>
          {testResult && (
            <Alert className={
              testResult.kind === "error"
                ? "border-destructive/30 bg-destructive/5"
                : testResult.kind === "handoff"
                  ? "border-amber-400/30 bg-amber-400/8"
                  : "border-primary/30 bg-primary/7"
            }>
              {testResult.kind === "answer"
                ? <CheckCircle2 className="h-4 w-4 text-primary" />
                : <AlertCircle className={testResult.kind === "error" ? "h-4 w-4 text-destructive" : "h-4 w-4 text-amber-500"} />}
              <AlertDescription className={testResult.kind === "error" ? "text-xs text-destructive" : "text-xs text-foreground"}>
                {testResult.text}
              </AlertDescription>
            </Alert>
          )}
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
          <Alert className={message.kind === "error" ? "border-destructive/30 bg-destructive/5" : "border-primary/30 bg-primary/7"}>
            {message.kind === "error"
              ? <AlertCircle className="h-4 w-4 text-destructive" />
              : <CheckCircle2 className="h-4 w-4 text-primary" />}
            <AlertDescription className={message.kind === "error" ? "text-xs text-destructive" : "text-xs text-muted-foreground"}>
              {message.text}
            </AlertDescription>
          </Alert>
        )}
      </div>
    </>
  )
}
