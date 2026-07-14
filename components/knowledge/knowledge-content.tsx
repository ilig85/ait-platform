"use client"

import { useState } from "react"
import { Plus, Search, BookOpen, Pencil, Trash2, CheckCircle2, Clock, ChevronDown, ChevronUp, X, AlertCircle } from "lucide-react"
import { cn } from "@/lib/utils"
import { DEMO_KNOWLEDGE } from "@/lib/mock-data"
import type { KnowledgeItem, KnowledgeType, KnowledgeStatus } from "@/lib/mock-data"

const TYPE_LABELS: Record<KnowledgeType, string> = {
  faq: "FAQ", product: "Product", price: "Price",
  policy: "Policy", delivery: "Delivery", hours: "Hours",
}
const TYPE_COLORS: Record<KnowledgeType, string> = {
  faq:      "bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-400",
  price:    "bg-purple-100 text-purple-700 dark:bg-purple-900/30 dark:text-purple-400",
  product:  "bg-emerald-100 text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-400",
  policy:   "bg-orange-100 text-orange-700 dark:bg-orange-900/30 dark:text-orange-400",
  delivery: "bg-cyan-100 text-cyan-700 dark:bg-cyan-900/30 dark:text-cyan-400",
  hours:    "bg-rose-100 text-rose-700 dark:bg-rose-900/30 dark:text-rose-400",
}

const FILTER_TYPES: Array<KnowledgeType | "all"> = ["all", "faq", "price", "policy", "delivery", "hours", "product"]

export function KnowledgeContent() {
  const [items, setItems] = useState<KnowledgeItem[]>(DEMO_KNOWLEDGE)
  const [activeType, setActiveType] = useState<KnowledgeType | "all">("all")
  const [search, setSearch] = useState("")
  const [expanded, setExpanded] = useState<string | null>(null)
  const [editing, setEditing] = useState<string | null>(null)
  const [editValue, setEditValue] = useState("")
  const [showAdd, setShowAdd] = useState(false)
  const [newItem, setNewItem] = useState({ title: "", content: "", type: "faq" as KnowledgeType })

  const filtered = items.filter(item => {
    const matchType = activeType === "all" || item.type === activeType
    const matchSearch =
      item.title.toLowerCase().includes(search.toLowerCase()) ||
      item.content.toLowerCase().includes(search.toLowerCase())
    return matchType && matchSearch
  })

  const startEdit = (item: KnowledgeItem) => {
    setEditing(item.id)
    setEditValue(item.content)
  }

  const saveEdit = (id: string) => {
    setItems(prev => prev.map(i =>
      i.id === id ? { ...i, content: editValue, status: "needs_review" as KnowledgeStatus } : i
    ))
    setEditing(null)
  }

  const toggleVerify = (id: string) => {
    setItems(prev => prev.map(i =>
      i.id === id ? { ...i, status: (i.status === "verified" ? "needs_review" : "verified") as KnowledgeStatus } : i
    ))
  }

  const deleteItem = (id: string) => {
    setItems(prev => prev.filter(i => i.id !== id))
    if (expanded === id) setExpanded(null)
  }

  const addItem = () => {
    if (!newItem.title.trim() || !newItem.content.trim()) return
    setItems(prev => [...prev, {
      id: `k-${Date.now()}`,
      type: newItem.type,
      title: newItem.title,
      content: newItem.content,
      languages: ["ru"],
      status: "draft" as KnowledgeStatus,
      lastEditor: "Manager",
      lastVerified: new Date().toISOString(),
      usageCount: 0,
      source: "manual" as const,
    }])
    setNewItem({ title: "", content: "", type: "faq" })
    setShowAdd(false)
  }

  return (
    <div className="flex flex-col gap-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-semibold text-foreground">Knowledge Base</h1>
          <p className="text-sm text-muted-foreground mt-0.5">Manager-verified FAQs, services, prices, and policies</p>
        </div>
        <button
          onClick={() => setShowAdd(true)}
          className="flex items-center gap-2 text-sm px-4 py-2 bg-primary hover:bg-primary/90 text-primary-foreground rounded-lg font-medium transition-colors"
        >
          <Plus className="w-4 h-4" /> Add Entry
        </button>
      </div>

      {/* Add form */}
      {showAdd && (
        <div className="bg-card border border-border rounded-xl p-4 flex flex-col gap-3">
          <div className="flex items-center justify-between">
            <h3 className="text-sm font-semibold text-foreground">New Knowledge Entry</h3>
            <button onClick={() => setShowAdd(false)} className="p-1 hover:bg-accent rounded-lg transition-colors">
              <X className="w-4 h-4 text-muted-foreground" />
            </button>
          </div>
          <select
            value={newItem.type}
            onChange={e => setNewItem(prev => ({ ...prev, type: e.target.value as KnowledgeType }))}
            className="w-full px-3 py-2 text-sm bg-background border border-border rounded-lg text-foreground focus:outline-none focus:ring-2 focus:ring-primary/40"
          >
            {(["faq","price","policy","delivery","hours","product"] as KnowledgeType[]).map(t => (
              <option key={t} value={t}>{TYPE_LABELS[t]}</option>
            ))}
          </select>
          <input
            value={newItem.title}
            onChange={e => setNewItem(prev => ({ ...prev, title: e.target.value }))}
            placeholder="Title or question..."
            className="w-full px-3 py-2 text-sm bg-background border border-border rounded-lg text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-primary/40"
          />
          <textarea
            value={newItem.content}
            onChange={e => setNewItem(prev => ({ ...prev, content: e.target.value }))}
            placeholder="Answer or description..."
            rows={3}
            className="w-full px-3 py-2 text-sm bg-background border border-border rounded-lg text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-primary/40 resize-none"
          />
          <div className="flex justify-end gap-2">
            <button onClick={() => setShowAdd(false)} className="px-3 py-1.5 text-sm border border-border rounded-lg hover:bg-accent transition-colors text-foreground">Cancel</button>
            <button onClick={addItem} className="px-3 py-1.5 text-sm bg-primary text-primary-foreground rounded-lg hover:bg-primary/90 transition-colors font-medium">Save as Draft</button>
          </div>
        </div>
      )}

      {/* Search + Type filters */}
      <div className="flex flex-col sm:flex-row gap-3">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
          <input
            value={search}
            onChange={e => setSearch(e.target.value)}
            placeholder="Search knowledge..."
            className="w-full pl-9 pr-4 py-2 text-sm bg-card border border-border rounded-lg text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-primary/40"
          />
        </div>
        <div className="flex items-center gap-1 bg-card border border-border rounded-lg p-1 flex-wrap">
          {FILTER_TYPES.map(t => (
            <button
              key={t}
              onClick={() => setActiveType(t)}
              className={cn(
                "px-3 py-1 text-xs rounded-md font-medium transition-all",
                activeType === t
                  ? "bg-primary text-primary-foreground"
                  : "text-muted-foreground hover:text-foreground hover:bg-accent"
              )}
            >
              {t === "all" ? "All" : TYPE_LABELS[t]}
            </button>
          ))}
        </div>
      </div>

      {/* Stats row */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
        {[
          { label: "Total entries",  value: items.length },
          { label: "Verified",       value: items.filter(i => i.status === "verified").length },
          { label: "Needs review",   value: items.filter(i => i.status === "needs_review").length },
          { label: "Draft",          value: items.filter(i => i.status === "draft").length },
        ].map(stat => (
          <div key={stat.label} className="bg-card border border-border rounded-xl px-4 py-3 text-center">
            <p className="text-2xl font-bold text-foreground">{stat.value}</p>
            <p className="text-xs text-muted-foreground mt-0.5">{stat.label}</p>
          </div>
        ))}
      </div>

      {/* Knowledge list */}
      <div className="flex flex-col gap-2">
        {filtered.length === 0 && (
          <div className="text-center py-16 text-muted-foreground text-sm">No entries match your search.</div>
        )}
        {filtered.map(item => {
          const isOpen = expanded === item.id
          const isVerified = item.status === "verified"
          return (
            <div key={item.id} className="bg-card border border-border rounded-xl overflow-hidden">
              <div
                className="flex items-center gap-3 px-4 py-3 cursor-pointer hover:bg-accent/40 transition-colors"
                onClick={() => setExpanded(isOpen ? null : item.id)}
              >
                <BookOpen className="w-4 h-4 text-muted-foreground flex-shrink-0" />
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 flex-wrap">
                    <span className="text-sm font-medium text-foreground truncate">{item.title}</span>
                    <span className={cn("text-xs px-1.5 py-0.5 rounded-md font-medium flex-shrink-0", TYPE_COLORS[item.type])}>
                      {TYPE_LABELS[item.type]}
                    </span>
                    {isVerified
                      ? <CheckCircle2 className="w-3.5 h-3.5 text-emerald-500 flex-shrink-0" />
                      : item.status === "needs_review"
                        ? <AlertCircle className="w-3.5 h-3.5 text-amber-500 flex-shrink-0" />
                        : <Clock className="w-3.5 h-3.5 text-muted-foreground flex-shrink-0" />
                    }
                  </div>
                  <p className="text-xs text-muted-foreground mt-0.5">
                    Used {item.usageCount}x &middot; Edited by {item.lastEditor} &middot;{" "}
                    {item.languages.map(l => l.toUpperCase()).join(" · ")}
                  </p>
                </div>
                <div className="flex items-center gap-1">
                  {isOpen ? <ChevronUp className="w-4 h-4 text-muted-foreground" /> : <ChevronDown className="w-4 h-4 text-muted-foreground" />}
                </div>
              </div>

              {isOpen && (
                <div className="border-t border-border bg-accent/30 px-4 py-4 flex flex-col gap-3">
                  {editing === item.id ? (
                    <>
                      <textarea
                        value={editValue}
                        onChange={e => setEditValue(e.target.value)}
                        rows={4}
                        className="w-full px-3 py-2 text-sm bg-background border border-border rounded-lg text-foreground focus:outline-none focus:ring-2 focus:ring-primary/40 resize-none"
                      />
                      <div className="flex gap-2">
                        <button onClick={() => saveEdit(item.id)} className="px-3 py-1.5 text-xs bg-primary text-primary-foreground rounded-lg hover:bg-primary/90 transition-colors font-medium">Save</button>
                        <button onClick={() => setEditing(null)} className="px-3 py-1.5 text-xs border border-border rounded-lg hover:bg-accent transition-colors text-foreground">Cancel</button>
                      </div>
                    </>
                  ) : (
                    <p className="text-sm text-foreground leading-relaxed">{item.content}</p>
                  )}
                  <div className="flex items-center gap-2 pt-2 border-t border-border">
                    <button
                      onClick={() => toggleVerify(item.id)}
                      className={cn(
                        "flex items-center gap-1.5 text-xs px-3 py-1.5 rounded-lg font-medium transition-colors",
                        isVerified
                          ? "bg-emerald-100 text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-400 hover:bg-emerald-200 dark:hover:bg-emerald-900/50"
                          : "bg-card border border-border text-muted-foreground hover:bg-accent"
                      )}
                    >
                      <CheckCircle2 className="w-3 h-3" /> {isVerified ? "Verified" : "Mark verified"}
                    </button>
                    <button
                      onClick={() => startEdit(item)}
                      className="flex items-center gap-1.5 text-xs px-3 py-1.5 bg-card border border-border hover:bg-accent text-foreground rounded-lg transition-colors"
                    >
                      <Pencil className="w-3 h-3" /> Edit
                    </button>
                    <button
                      onClick={() => deleteItem(item.id)}
                      className="flex items-center gap-1.5 text-xs px-3 py-1.5 bg-card border border-red-200 dark:border-red-900/50 hover:bg-red-50 dark:hover:bg-red-950/30 text-red-600 dark:text-red-400 rounded-lg transition-colors ml-auto"
                    >
                      <Trash2 className="w-3 h-3" /> Delete
                    </button>
                  </div>
                </div>
              )}
            </div>
          )
        })}
      </div>
    </div>
  )
}
