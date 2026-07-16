import { AlertCircle, Building2 } from "lucide-react"

export function DataUnavailable({
  message,
  missingMembership = false,
}: {
  message: string
  missingMembership?: boolean
}) {
  const Icon = missingMembership ? Building2 : AlertCircle
  const accentColor = missingMembership ? "#67D9FF" : "#FF6B6B"

  return (
    <div className="bg-card border border-border/60 rounded-xl p-8 text-center animate-fade-in">
      <div
        className="w-12 h-12 rounded-2xl mx-auto mb-3 flex items-center justify-center"
        style={{ background: `${accentColor}18`, border: `1px solid ${accentColor}30` }}
      >
        <Icon className="w-5 h-5" style={{ color: accentColor }} />
      </div>
      <h2 className="text-sm font-semibold text-foreground">
        {missingMembership ? "No organization membership" : "Data unavailable"}
      </h2>
      <p className="text-sm text-muted-foreground mt-1 max-w-lg mx-auto leading-relaxed">{message}</p>
    </div>
  )
}
