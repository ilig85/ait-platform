export default function Loading() {
  return (
    <div className="min-h-screen bg-background flex items-center justify-center p-6">
      <div className="w-full max-w-md space-y-3" role="status" aria-label="Loading workspace data">
        <div className="h-8 w-40 rounded-lg bg-muted animate-pulse" />
        <div className="h-24 rounded-xl bg-muted/70 animate-pulse" />
        <div className="grid grid-cols-2 gap-3">
          <div className="h-20 rounded-xl bg-muted/50 animate-pulse" />
          <div className="h-20 rounded-xl bg-muted/50 animate-pulse" />
        </div>
        <span className="sr-only">Loading organization data…</span>
      </div>
    </div>
  )
}
