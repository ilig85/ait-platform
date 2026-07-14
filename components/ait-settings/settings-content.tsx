"use client"

import { useState } from "react"
import { Building2, Clock, Globe, Users, BrainCircuit, Smartphone, Save, CheckCircle2 } from "lucide-react"
import { cn } from "@/lib/utils"

const TABS = [
  { id: "business", label: "Business", icon: Building2 },
  { id: "ai", label: "AI Behaviour", icon: BrainCircuit },
  { id: "team", label: "Team", icon: Users },
  { id: "channel", label: "Channel", icon: Smartphone },
] as const

const DAYS = ["Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"]
const LANGUAGES = ["English", "Russian", "Kyrgyz"]

export function AitSettingsContent() {
  const [tab, setTab] = useState<string>("business")
  const [saved, setSaved] = useState(false)
  const [form, setForm] = useState({
    businessName: "AIT Business",
    industry: "Retail",
    timezone: "Asia/Bishkek",
    openDays: ["Mon", "Tue", "Wed", "Thu", "Fri"],
    openFrom: "09:00",
    openTo: "18:00",
    languages: ["English", "Russian"],
    aiConfidenceThreshold: 75,
    aiAutoReply: true,
    aiDraftOnly: false,
    escalationKeywords: "refund, cancel, urgent, lawyer",
    teamName: "Support Team",
    managerEmail: "manager@ait.com",
    whatsappStatus: "connected",
    phoneNumber: "+996 555 123 456",
  })

  const save = () => {
    setSaved(true)
    setTimeout(() => setSaved(false), 2500)
  }

  const toggleDay = (day: string) => {
    setForm(prev => ({
      ...prev,
      openDays: prev.openDays.includes(day)
        ? prev.openDays.filter(d => d !== day)
        : [...prev.openDays, day]
    }))
  }

  const toggleLanguage = (lang: string) => {
    setForm(prev => ({
      ...prev,
      languages: prev.languages.includes(lang)
        ? prev.languages.filter(l => l !== lang)
        : [...prev.languages, lang]
    }))
  }

  return (
    <div className="flex flex-col gap-6 max-w-2xl">
      {/* Header */}
      <div>
        <h1 className="text-2xl font-semibold text-foreground">Settings</h1>
        <p className="text-sm text-muted-foreground mt-0.5">Configure your business, AI behaviour, team, and channels</p>
      </div>

      {/* Tabs */}
      <div className="flex gap-1 bg-card border border-border rounded-xl p-1">
        {TABS.map(t => {
          const Icon = t.icon
          return (
            <button
              key={t.id}
              onClick={() => setTab(t.id)}
              className={cn(
                "flex items-center gap-2 flex-1 justify-center px-3 py-2 text-xs rounded-lg font-medium transition-all",
                tab === t.id ? "bg-primary text-primary-foreground" : "text-muted-foreground hover:text-foreground hover:bg-accent"
              )}
            >
              <Icon className="w-3.5 h-3.5" /> {t.label}
            </button>
          )
        })}
      </div>

      {/* Business tab */}
      {tab === "business" && (
        <div className="flex flex-col gap-4">
          <div className="bg-card border border-border rounded-xl p-5 flex flex-col gap-4">
            <div className="flex items-center gap-2 mb-1">
              <Building2 className="w-4 h-4 text-primary" />
              <h2 className="text-sm font-semibold text-foreground">Business Profile</h2>
            </div>
            <Field label="Business name">
              <input value={form.businessName} onChange={e => setForm(p => ({...p, businessName: e.target.value}))} className={inputCls} />
            </Field>
            <Field label="Industry">
              <input value={form.industry} onChange={e => setForm(p => ({...p, industry: e.target.value}))} className={inputCls} />
            </Field>
            <Field label="Timezone">
              <select value={form.timezone} onChange={e => setForm(p => ({...p, timezone: e.target.value}))} className={inputCls}>
                <option value="Asia/Bishkek">Asia/Bishkek (UTC+6)</option>
                <option value="Europe/Moscow">Europe/Moscow (UTC+3)</option>
                <option value="UTC">UTC</option>
              </select>
            </Field>
          </div>
          <div className="bg-card border border-border rounded-xl p-5 flex flex-col gap-4">
            <div className="flex items-center gap-2 mb-1">
              <Clock className="w-4 h-4 text-primary" />
              <h2 className="text-sm font-semibold text-foreground">Business Hours</h2>
            </div>
            <div>
              <p className="text-xs text-muted-foreground mb-2">Open days</p>
              <div className="flex gap-2 flex-wrap">
                {DAYS.map(day => (
                  <button
                    key={day}
                    onClick={() => toggleDay(day)}
                    className={cn(
                      "px-3 py-1.5 text-xs rounded-lg font-medium transition-colors",
                      form.openDays.includes(day)
                        ? "bg-primary text-primary-foreground"
                        : "bg-accent text-muted-foreground hover:text-foreground"
                    )}
                  >
                    {day}
                  </button>
                ))}
              </div>
            </div>
            <div className="flex gap-4">
              <Field label="Open from" className="flex-1">
                <input type="time" value={form.openFrom} onChange={e => setForm(p => ({...p, openFrom: e.target.value}))} className={inputCls} />
              </Field>
              <Field label="Close at" className="flex-1">
                <input type="time" value={form.openTo} onChange={e => setForm(p => ({...p, openTo: e.target.value}))} className={inputCls} />
              </Field>
            </div>
            <div>
              <p className="text-xs text-muted-foreground mb-2">Interface languages</p>
              <div className="flex gap-2 flex-wrap">
                {LANGUAGES.map(lang => (
                  <button
                    key={lang}
                    onClick={() => toggleLanguage(lang)}
                    className={cn(
                      "flex items-center gap-1.5 px-3 py-1.5 text-xs rounded-lg font-medium transition-colors",
                      form.languages.includes(lang)
                        ? "bg-primary text-primary-foreground"
                        : "bg-accent text-muted-foreground hover:text-foreground"
                    )}
                  >
                    <Globe className="w-3 h-3" /> {lang}
                  </button>
                ))}
              </div>
            </div>
          </div>
        </div>
      )}

      {/* AI Behaviour tab */}
      {tab === "ai" && (
        <div className="bg-card border border-border rounded-xl p-5 flex flex-col gap-5">
          <div className="flex items-center gap-2 mb-1">
            <BrainCircuit className="w-4 h-4 text-primary" />
            <h2 className="text-sm font-semibold text-foreground">AI Behaviour</h2>
          </div>

          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-foreground">Auto-reply mode</p>
              <p className="text-xs text-muted-foreground mt-0.5">AI sends approved replies automatically</p>
            </div>
            <Toggle value={form.aiAutoReply} onChange={v => setForm(p => ({...p, aiAutoReply: v}))} />
          </div>

          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-foreground">Draft-only mode</p>
              <p className="text-xs text-muted-foreground mt-0.5">AI drafts replies, manager always approves</p>
            </div>
            <Toggle value={form.aiDraftOnly} onChange={v => setForm(p => ({...p, aiDraftOnly: v}))} />
          </div>

          <div>
            <div className="flex items-center justify-between mb-2">
              <p className="text-sm font-medium text-foreground">Confidence threshold</p>
              <span className="text-sm font-bold text-primary">{form.aiConfidenceThreshold}%</span>
            </div>
            <input
              type="range" min={50} max={100} step={5}
              value={form.aiConfidenceThreshold}
              onChange={e => setForm(p => ({...p, aiConfidenceThreshold: Number(e.target.value)}))}
              className="w-full accent-[hsl(var(--primary))]"
            />
            <p className="text-xs text-muted-foreground mt-1">Below this threshold, AI escalates to a human</p>
          </div>

          <Field label="Escalation keywords (comma separated)">
            <input
              value={form.escalationKeywords}
              onChange={e => setForm(p => ({...p, escalationKeywords: e.target.value}))}
              className={inputCls}
              placeholder="refund, cancel, urgent..."
            />
          </Field>
        </div>
      )}

      {/* Team tab */}
      {tab === "team" && (
        <div className="bg-card border border-border rounded-xl p-5 flex flex-col gap-4">
          <div className="flex items-center gap-2 mb-1">
            <Users className="w-4 h-4 text-primary" />
            <h2 className="text-sm font-semibold text-foreground">Team</h2>
          </div>
          <Field label="Team name">
            <input value={form.teamName} onChange={e => setForm(p => ({...p, teamName: e.target.value}))} className={inputCls} />
          </Field>
          <Field label="Manager email">
            <input type="email" value={form.managerEmail} onChange={e => setForm(p => ({...p, managerEmail: e.target.value}))} className={inputCls} />
          </Field>
          <div className="p-4 bg-accent/40 rounded-xl border border-border">
            <p className="text-xs text-muted-foreground">Team member invitations are sent via email. The manager always has full access to the audit trail and human control override.</p>
          </div>
        </div>
      )}

      {/* Channel tab */}
      {tab === "channel" && (
        <div className="bg-card border border-border rounded-xl p-5 flex flex-col gap-4">
          <div className="flex items-center gap-2 mb-1">
            <Smartphone className="w-4 h-4 text-primary" />
            <h2 className="text-sm font-semibold text-foreground">WhatsApp Channel</h2>
          </div>
          <div className="flex items-center gap-3 p-4 rounded-xl bg-emerald-50 dark:bg-emerald-950/20 border border-emerald-200 dark:border-emerald-800">
            <CheckCircle2 className="w-5 h-5 text-emerald-600 dark:text-emerald-400 flex-shrink-0" />
            <div>
              <p className="text-sm font-medium text-emerald-800 dark:text-emerald-300">Channel connected</p>
              <p className="text-xs text-emerald-700 dark:text-emerald-400 mt-0.5">{form.phoneNumber}</p>
            </div>
          </div>
          <Field label="Phone number">
            <input value={form.phoneNumber} onChange={e => setForm(p => ({...p, phoneNumber: e.target.value}))} className={inputCls} />
          </Field>
          <button className="text-sm px-4 py-2 border border-border rounded-lg hover:bg-accent transition-colors text-foreground self-start">
            Reconnect channel
          </button>
        </div>
      )}

      {/* Save button */}
      <div className="flex items-center gap-3">
        <button
          onClick={save}
          className="flex items-center gap-2 px-5 py-2.5 bg-primary hover:bg-primary/90 text-primary-foreground rounded-lg font-medium text-sm transition-colors"
        >
          {saved ? <CheckCircle2 className="w-4 h-4" /> : <Save className="w-4 h-4" />}
          {saved ? "Saved" : "Save changes"}
        </button>
        {saved && <p className="text-xs text-emerald-600 dark:text-emerald-400 font-medium">Changes saved successfully</p>}
      </div>
    </div>
  )
}

function Field({ label, children, className }: { label: string; children: React.ReactNode; className?: string }) {
  return (
    <div className={cn("flex flex-col gap-1.5", className)}>
      <label className="text-xs font-medium text-muted-foreground">{label}</label>
      {children}
    </div>
  )
}

function Toggle({ value, onChange }: { value: boolean; onChange: (v: boolean) => void }) {
  return (
    <button
      onClick={() => onChange(!value)}
      className={cn(
        "relative w-11 h-6 rounded-full transition-colors flex-shrink-0",
        value ? "bg-primary" : "bg-border"
      )}
    >
      <span className={cn(
        "absolute top-1 w-4 h-4 rounded-full bg-white transition-transform",
        value ? "translate-x-6" : "translate-x-1"
      )} />
    </button>
  )
}

const inputCls = "w-full px-3 py-2 text-sm bg-background border border-border rounded-lg text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-primary/40"
