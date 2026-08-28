import Link from "next/link"
import { AitLogo } from "@/components/brand/ait-logo"
import { Mascot } from "@/components/brand/mascot"

export default function AuthErrorPage() {
  return (
    <div className="min-h-screen flex items-center justify-center bg-background px-4">
      <div className="w-full max-w-md text-center">
        <div className="flex items-center justify-center gap-2 mb-8">
          <AitLogo variant="wordmark" theme="light" size="md" label="AIT" />
        </div>
        <Mascot pose="thinking" width={88} height={98} className="mx-auto mb-4" />
        <h1 className="text-2xl font-bold text-foreground mb-2">Authentication error</h1>
        <p className="text-muted-foreground mb-6 text-sm">
          Something went wrong during sign in. The link may have expired or already been used.
        </p>
        <Link
          href="/login"
          className="inline-flex items-center justify-center px-5 py-2.5 bg-primary text-primary-foreground rounded-lg text-sm font-medium hover:bg-primary/90 transition-colors"
        >
          Back to login
        </Link>
      </div>
    </div>
  )
}
