export default function Loading() {
  return (
    <div
      className="min-h-screen bg-background flex items-center justify-center p-6"
      role="status"
      aria-label="Loading"
    >
      <div className="flex flex-col items-center gap-4 animate-fade-in">
        {/* Signal logomark pulse */}
        <div className="relative">
          <div className="w-12 h-12 rounded-2xl bg-[#2DE2B1]/15 border border-[#2DE2B1]/20 flex items-center justify-center">
            <svg
              viewBox="0 0 16 16"
              className="w-5 h-5 text-[#2DE2B1]"
              fill="none"
              stroke="currentColor"
              strokeWidth="2.5"
              strokeLinecap="round"
              strokeLinejoin="round"
              aria-hidden
            >
              <polygon points="3,1 13,8 3,15" />
            </svg>
          </div>
          {/* Ripple ring */}
          <span
            className="absolute inset-0 rounded-2xl border border-[#2DE2B1]/20 animate-ping"
            style={{ animationDuration: "1.8s" }}
          />
        </div>

        <div className="space-y-1 text-center">
          <div className="h-3 w-28 rounded skeleton mx-auto" />
          <div className="h-2.5 w-40 rounded skeleton mx-auto" />
        </div>
      </div>
      <span className="sr-only">Loading Signal workspace…</span>
    </div>
  )
}
