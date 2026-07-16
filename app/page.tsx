import Link from "next/link"
import { Zap } from "lucide-react"

export default function LandingPage() {
  return (
    <main className="min-h-screen bg-background flex items-center justify-center px-6 py-12">
      <div className="w-full max-w-xl text-center">
        <div className="inline-flex items-center gap-3 mb-8">
          <div className="w-10 h-10 rounded-xl bg-[#0F766E] flex items-center justify-center">
            <Zap className="w-5 h-5 text-white" />
          </div>
          <span className="text-2xl font-bold tracking-tight text-foreground">AIT</span>
        </div>

        <h1 className="text-3xl md:text-4xl font-bold text-foreground text-balance">
          AI-powered customer communication for growing businesses
        </h1>
        <p className="mt-4 text-muted-foreground">
          The full AIT landing page is coming soon.
        </p>

        <div className="mt-8 flex flex-col sm:flex-row items-center justify-center gap-3">
          <Link
            href="/login"
            className="inline-flex w-full sm:w-auto items-center justify-center rounded-lg bg-[#0F766E] px-5 py-2.5 text-sm font-medium text-white hover:bg-[#0F766E]/90 transition-colors"
          >
            Log in
          </Link>
          <Link
            href="/signup"
            className="inline-flex w-full sm:w-auto items-center justify-center rounded-lg border border-border bg-card px-5 py-2.5 text-sm font-medium text-foreground hover:bg-accent transition-colors"
          >
            Create account
          </Link>
        </div>
      </div>
    </main>
  )
}
