import { AitLogo } from "@/components/brand/ait-logo"

export default function Loading() {
  return (
    <div
      className="min-h-screen bg-background flex items-center justify-center p-6"
      role="status"
      aria-label="Loading"
    >
      <div className="flex flex-col items-center gap-4 animate-fade-in">
        {/* AIT Fold logomark with ripple ring */}
        <div className="relative">
          <div className="w-14 h-14 rounded-2xl bg-primary/15 border border-primary/20 flex items-center justify-center">
            <AitLogo variant="symbol" theme="sidebar" size="md" label="Loading AIT" />
          </div>
          {/* Ripple ring — respects prefers-reduced-motion via Tailwind */}
          <span
            className="absolute inset-0 rounded-2xl border border-primary/20 motion-safe:animate-ping"
            style={{ animationDuration: "1.8s" }}
            aria-hidden="true"
          />
        </div>

        <div className="space-y-1 text-center">
          <div className="h-3 w-28 rounded skeleton mx-auto" />
          <div className="h-2.5 w-40 rounded skeleton mx-auto" />
        </div>
      </div>
      <span className="sr-only">Loading AIT workspace…</span>
    </div>
  )
}
