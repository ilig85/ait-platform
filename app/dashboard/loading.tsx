export default function DashboardLoading() {
  return (
    <div
      className="min-h-screen bg-background flex items-start p-6 pt-10"
      role="status"
      aria-label="Loading workspace data"
    >
      <div className="w-full space-y-5 animate-fade-in">
        {/* Page title skeleton */}
        <div className="space-y-1.5">
          <div className="h-6 w-36 rounded-lg skeleton" />
          <div className="h-3.5 w-56 rounded skeleton" />
        </div>

        {/* Metric cards row */}
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
          {Array.from({ length: 4 }).map((_, i) => (
            <div
              key={i}
              className="bg-card border border-border/60 rounded-xl p-4 space-y-3"
              style={{ animationDelay: `${i * 60}ms` }}
            >
              <div className="flex items-center justify-between">
                <div className="h-3 w-20 rounded skeleton" />
                <div className="h-6 w-6 rounded-lg skeleton" />
              </div>
              <div className="h-7 w-14 rounded skeleton" />
              <div className="h-3 w-24 rounded skeleton" />
            </div>
          ))}
        </div>

        {/* Chart + health row */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-3">
          <div className="lg:col-span-2 bg-card border border-border/60 rounded-xl p-5 space-y-4">
            <div className="h-4 w-40 rounded skeleton" />
            <div className="h-[180px] w-full rounded-lg skeleton" />
          </div>
          <div className="bg-card border border-border/60 rounded-xl p-5 space-y-3">
            <div className="h-4 w-32 rounded skeleton" />
            {Array.from({ length: 4 }).map((_, i) => (
              <div key={i} className="flex items-center gap-3">
                <div className="h-7 w-7 rounded-lg skeleton" />
                <div className="flex-1 space-y-1.5">
                  <div className="h-3 w-20 rounded skeleton" />
                  <div className="h-1.5 w-full rounded-full skeleton" />
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
      <span className="sr-only">Loading dashboard data…</span>
    </div>
  )
}
