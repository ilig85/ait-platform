import { AlertCircle, Building2 } from "lucide-react"
import { Card } from "@/components/ui/card"

export function DataUnavailable({
  message,
  missingMembership = false,
}: {
  message: string
  missingMembership?: boolean
}) {
  const Icon = missingMembership ? Building2 : AlertCircle
  return (
    <Card className="border-border/60 p-8 text-center">
      <Icon className="w-8 h-8 mx-auto text-muted-foreground mb-3" />
      <h2 className="text-sm font-semibold text-foreground">
        {missingMembership ? "No organization membership" : "Data unavailable"}
      </h2>
      <p className="text-sm text-muted-foreground mt-1 max-w-lg mx-auto">{message}</p>
    </Card>
  )
}
