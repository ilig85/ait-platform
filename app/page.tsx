import { LandingNav } from "@/components/landing/landing-nav"
import { LandingHero } from "@/components/landing/landing-hero"
import { InboxSection } from "@/components/landing/inbox-section"
import { AIReplySection } from "@/components/landing/ai-reply-section"
import { RecordsSection } from "@/components/landing/records-section"
import { InsightsSection } from "@/components/landing/insights-section"
import { SecuritySection } from "@/components/landing/security-section"
import { LandingCTA } from "@/components/landing/landing-cta"
import { LandingFooter } from "@/components/landing/landing-footer"

export default function LandingPage() {
  return (
    <>
      <LandingNav />
      <main id="main-content">
        <LandingHero />
        <InboxSection />
        <AIReplySection />
        <RecordsSection />
        <InsightsSection />
        <SecuritySection />
        <LandingCTA />
      </main>
      <LandingFooter />
    </>
  )
}
