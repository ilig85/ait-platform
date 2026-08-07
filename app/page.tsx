import Link from "next/link"
import {
  ArrowRight,
  BarChart3,
  BookOpenText,
  CheckCircle2,
  Clock3,
  Languages,
  MessageCircle,
  ShieldCheck,
  UserRoundCheck,
} from "lucide-react"
import { AitLogo } from "@/components/brand/ait-logo"

const features = [
  {
    icon: Clock3,
    title: "Replies in seconds",
    copy: "AIT answers routine questions immediately, even when your team is busy.",
    tone: "bg-[#F3C97A]",
  },
  {
    icon: BookOpenText,
    title: "Answers from your data",
    copy: "Prices, availability, policies, and FAQs come from the knowledge you approve.",
    tone: "bg-[#DCE9DD]",
  },
  {
    icon: UserRoundCheck,
    title: "Knows when to hand off",
    copy: "Uncertain or sensitive conversations go to a manager with the context attached.",
    tone: "bg-[#F1B8AE]",
  },
  {
    icon: BarChart3,
    title: "One clear workspace",
    copy: "See waiting customers, AI activity, conversation history, and daily insights together.",
    tone: "bg-[#C9D8F0]",
  },
]

const steps = [
  ["01", "Connect WhatsApp", "Bring customer conversations into one organized inbox."],
  ["02", "Add business knowledge", "Upload the information AIT should use when answering."],
  ["03", "Choose your control level", "Let confident answers send automatically and review the rest."],
]

export default function LandingPage() {
  return (
    <div className="min-h-screen overflow-hidden bg-[#F6F1E7] text-[#173E3C]">
      <header className="fixed inset-x-0 top-0 z-50 border-b border-[#173E3C]/10 bg-[#F6F1E7]/90 backdrop-blur-xl">
        <nav className="mx-auto flex h-[76px] max-w-7xl items-center justify-between px-5 lg:px-8" aria-label="Main navigation">
          <Link href="/" aria-label="AIT home" className="rounded-xl focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#4C866D]">
            <AitLogo variant="wordmark" theme="light" size="md" />
          </Link>

          <div className="hidden items-center gap-8 md:flex">
            <a href="#product" className="text-sm font-semibold text-[#385C57] transition-colors hover:text-[#173E3C]">Product</a>
            <a href="#how-it-works" className="text-sm font-semibold text-[#385C57] transition-colors hover:text-[#173E3C]">How it works</a>
            <a href="#control" className="text-sm font-semibold text-[#385C57] transition-colors hover:text-[#173E3C]">Manager control</a>
          </div>

          <div className="hidden items-center gap-2 md:flex">
            <Link href="/login" className="rounded-full px-4 py-2.5 text-sm font-semibold text-[#173E3C] transition-colors hover:bg-[#E7E4D8]">Log in</Link>
            <Link href="/signup" className="rounded-full bg-[#173E3C] px-5 py-2.5 text-sm font-semibold text-white transition-transform hover:-translate-y-0.5 hover:bg-[#245451]">Start free</Link>
          </div>

          <Link href="/login" className="rounded-full border border-[#173E3C]/15 px-4 py-2 text-sm font-bold md:hidden">
            Log in
          </Link>
        </nav>
      </header>

      <main id="main-content">
        <section className="relative px-5 pb-20 pt-32 lg:px-8 lg:pb-28 lg:pt-44">
          <div aria-hidden="true" className="absolute -left-24 top-24 h-56 w-56 rounded-full bg-[#E9B86C]/35" />
          <div aria-hidden="true" className="absolute -right-28 top-12 h-72 w-72 rounded-full bg-[#BCD9C8]/70" />

          <div className="relative mx-auto grid max-w-7xl items-center gap-14 lg:grid-cols-[1.03fr_.97fr] lg:gap-20">
            <div className="land-fade-up">
              <div className="mb-7 inline-flex items-center gap-2 rounded-full border border-[#173E3C]/10 bg-[#FFFDF8] px-4 py-2 text-xs font-bold uppercase tracking-[0.14em] text-[#456D64] shadow-sm">
                <span className="h-2 w-2 rounded-full bg-[#E69A52]" />
                Built for customer conversations
              </div>
              <h1 className="max-w-[760px] text-[clamp(3.15rem,7vw,6.7rem)] font-semibold leading-[.91] tracking-[-.065em] text-[#173E3C]">
                Customers ask.
                <span className="mt-2 block text-[#5E9C7E]">AIT answers.</span>
              </h1>
              <p className="mt-7 max-w-xl text-lg leading-8 text-[#4F6E68] md:text-xl">
                A friendly AI manager for WhatsApp that knows your business, replies in your style, and brings a human in when it should.
              </p>

              <div className="mt-9 flex flex-col gap-3 sm:flex-row">
                <Link href="/signup" className="group inline-flex items-center justify-center gap-2 rounded-full bg-[#173E3C] px-6 py-3.5 text-sm font-bold text-white transition-all hover:-translate-y-0.5 hover:bg-[#245451]">
                  Start free
                  <ArrowRight className="h-4 w-4 transition-transform group-hover:translate-x-1" />
                </Link>
                <a href="#how-it-works" className="inline-flex items-center justify-center rounded-full border border-[#173E3C]/15 bg-[#FFFDF8] px-6 py-3.5 text-sm font-bold text-[#173E3C] transition-colors hover:bg-white">
                  See how it works
                </a>
              </div>

              <div className="mt-8 flex flex-wrap items-center gap-x-5 gap-y-2 text-sm font-medium text-[#5C756F]">
                <span className="inline-flex items-center gap-1.5"><CheckCircle2 className="h-4 w-4 text-[#5E9C7E]" /> No credit card</span>
                <span className="inline-flex items-center gap-1.5"><Languages className="h-4 w-4 text-[#5E9C7E]" /> Kyrgyz · Russian · English</span>
              </div>
            </div>

            <div className="relative mx-auto w-full max-w-[570px] land-fade-up" style={{ animationDelay: "120ms" }}>
              <div className="absolute -left-5 -top-12 z-20 rotate-[-7deg] rounded-full bg-[#FFFDF8] px-4 py-2 text-sm font-bold text-[#173E3C] shadow-[0_12px_28px_rgba(23,62,60,.12)]">Available 24/7</div>
              <img src="/ait-logo-icon.svg" alt="AIT frog mascot" className="absolute -right-2 -top-24 z-20 h-32 w-40 rotate-[4deg] object-contain md:-right-8 md:h-40 md:w-48" />

              <div className="relative rounded-[2rem] border border-[#173E3C]/10 bg-[#FFFDF8] p-4 shadow-[0_30px_90px_rgba(31,67,59,.16)] md:p-6">
                <div className="flex items-center justify-between border-b border-[#173E3C]/10 pb-4">
                  <div className="flex items-center gap-3">
                    <div className="flex h-10 w-10 items-center justify-center rounded-full bg-[#DCE9DD] text-sm font-extrabold">M</div>
                    <div>
                      <p className="text-sm font-bold">Mira</p>
                      <p className="text-xs text-[#78908A]">WhatsApp · just now</p>
                    </div>
                  </div>
                  <span className="rounded-full bg-[#F2C36F]/45 px-3 py-1 text-xs font-bold text-[#71501F]">New customer</span>
                </div>

                <div className="space-y-4 py-6">
                  <div className="max-w-[82%] rounded-[1.35rem] rounded-bl-md bg-[#EEECE5] px-4 py-3 text-sm leading-6 text-[#294B47]">
                    Hi! Do you have the beige sofa in stock, and can you deliver it tomorrow?
                  </div>

                  <div className="ml-auto flex max-w-[92%] items-center gap-3 rounded-2xl border border-[#5E9C7E]/20 bg-[#EFF5EE] px-4 py-3">
                    <img src="/ait-logo-icon.svg" alt="" className="h-9 w-11 shrink-0 object-contain" aria-hidden="true" />
                    <div>
                      <p className="text-xs font-bold uppercase tracking-[.12em] text-[#5E846F]">AIT checked your catalog</p>
                      <p className="mt-1 text-xs text-[#6B827C]">Stock · delivery policy · reply style</p>
                    </div>
                  </div>

                  <div className="ml-auto max-w-[86%] rounded-[1.35rem] rounded-br-md bg-[#5E9C7E] px-4 py-3 text-sm leading-6 text-white shadow-sm">
                    Yes, the beige sofa is available. We can deliver it tomorrow between 2–5 PM. Would you like me to reserve it for you?
                  </div>
                </div>

                <div className="flex items-center justify-between rounded-2xl bg-[#173E3C] px-4 py-3 text-white">
                  <div className="flex items-center gap-2 text-sm font-semibold"><CheckCircle2 className="h-4 w-4 text-[#B8D7C0]" /> Answered automatically</div>
                  <span className="text-xs text-white/55">2 sec</span>
                </div>
              </div>

              <div className="absolute -bottom-8 -left-6 hidden rotate-[3deg] rounded-2xl bg-[#F0A35B] px-5 py-4 text-sm font-bold text-[#4B321B] shadow-[0_15px_35px_rgba(83,55,30,.16)] sm:block">
                Your team stays in control.
              </div>
            </div>
          </div>
        </section>

        <section id="product" className="border-y border-[#173E3C]/10 bg-[#FFFDF8] px-5 py-24 lg:px-8 lg:py-32">
          <div className="mx-auto max-w-7xl">
            <div className="grid gap-10 lg:grid-cols-[.75fr_1.25fr] lg:gap-20">
              <div>
                <p className="text-sm font-extrabold uppercase tracking-[.15em] text-[#D17E3A]">Less waiting. Less repetition.</p>
                <h2 className="mt-5 max-w-lg text-4xl font-semibold leading-[1.02] tracking-[-.045em] text-[#173E3C] md:text-6xl">The routine work disappears. The important conversations do not.</h2>
                <p className="mt-6 max-w-md text-lg leading-8 text-[#617A74]">AIT is designed around how a real manager works: fast on simple questions, careful on difficult ones, and easy to understand at a glance.</p>
              </div>

              <div className="grid gap-4 sm:grid-cols-2">
                {features.map(({ icon: Icon, title, copy, tone }) => (
                  <article key={title} className="group rounded-[1.75rem] border border-[#173E3C]/10 bg-[#F8F5ED] p-6 transition-all duration-300 hover:-translate-y-1 hover:shadow-[0_20px_40px_rgba(23,62,60,.09)] md:p-7">
                    <div className={`flex h-12 w-12 items-center justify-center rounded-2xl ${tone}`}><Icon className="h-5 w-5" /></div>
                    <h3 className="mt-8 text-xl font-extrabold tracking-[-.025em]">{title}</h3>
                    <p className="mt-3 text-sm leading-6 text-[#607872]">{copy}</p>
                  </article>
                ))}
              </div>
            </div>
          </div>
        </section>

        <section id="how-it-works" className="bg-[#DDE9DD] px-5 py-24 lg:px-8 lg:py-32">
          <div className="mx-auto max-w-7xl">
            <div className="flex flex-col justify-between gap-6 md:flex-row md:items-end">
              <div>
                <p className="text-sm font-extrabold uppercase tracking-[.15em] text-[#557866]">How it works</p>
                <h2 className="mt-4 max-w-2xl text-4xl font-semibold leading-none tracking-[-.05em] md:text-6xl">Useful on day one.<br />Smarter every day.</h2>
              </div>
              <p className="max-w-md text-base leading-7 text-[#526D64]">No complicated AI setup. Connect the channel, give AIT reliable knowledge, and decide what it can handle alone.</p>
            </div>

            <div className="mt-14 grid gap-px overflow-hidden rounded-[2rem] border border-[#173E3C]/10 bg-[#173E3C]/10 lg:grid-cols-3">
              {steps.map(([number, title, copy]) => (
                <article key={number} className="bg-[#F8F5ED] p-7 md:p-9">
                  <span className="font-mono text-sm font-bold text-[#D17E3A]">{number}</span>
                  <h3 className="mt-12 text-2xl font-extrabold tracking-[-.035em]">{title}</h3>
                  <p className="mt-3 max-w-sm text-sm leading-6 text-[#607872]">{copy}</p>
                </article>
              ))}
            </div>
          </div>
        </section>

        <section id="control" className="bg-[#F6F1E7] px-5 py-24 lg:px-8 lg:py-32">
          <div className="mx-auto grid max-w-7xl items-center gap-14 lg:grid-cols-2 lg:gap-24">
            <div className="relative rounded-[2.25rem] bg-[#173E3C] p-5 text-white shadow-[0_28px_70px_rgba(23,62,60,.18)] md:p-8">
              <div className="flex items-center justify-between border-b border-white/10 pb-5">
                <div>
                  <p className="text-xs font-bold uppercase tracking-[.14em] text-white/45">Manager workspace</p>
                  <h3 className="mt-1 text-xl font-extrabold">Today at a glance</h3>
                </div>
                <span className="rounded-full bg-[#DDE9DD] px-3 py-1.5 text-xs font-bold text-[#173E3C]">Live</span>
              </div>
              <div className="mt-5 grid grid-cols-2 gap-3">
                <div className="rounded-2xl bg-white/8 p-4"><p className="text-3xl font-extrabold">24</p><p className="mt-1 text-xs text-white/55">AI replies sent</p></div>
                <div className="rounded-2xl bg-[#F0A35B] p-4 text-[#4C3118]"><p className="text-3xl font-extrabold">3</p><p className="mt-1 text-xs font-semibold">Need your attention</p></div>
              </div>
              <div className="mt-3 space-y-2">
                {["Custom wholesale request", "Customer asked for a refund", "Delivery address is unclear"].map((item, index) => (
                  <div key={item} className="flex items-center justify-between rounded-2xl bg-white/[.07] px-4 py-3.5">
                    <div className="flex items-center gap-3"><span className="flex h-7 w-7 items-center justify-center rounded-full bg-white/10 text-xs font-bold">{index + 1}</span><span className="text-sm font-semibold">{item}</span></div>
                    <ArrowRight className="h-4 w-4 text-white/35" />
                  </div>
                ))}
              </div>
              <img src="/ait-logo-icon.svg" alt="" aria-hidden="true" className="absolute -bottom-12 -right-8 h-32 w-40 rotate-[-5deg] object-contain" />
            </div>

            <div>
              <p className="text-sm font-extrabold uppercase tracking-[.15em] text-[#D17E3A]">Confidence with control</p>
              <h2 className="mt-5 text-4xl font-semibold leading-[1.02] tracking-[-.05em] md:text-6xl">Automation that knows its limits.</h2>
              <p className="mt-6 text-lg leading-8 text-[#607872]">You decide what “confident enough” means. AIT can send reliable answers automatically, draft uncertain replies, or immediately hand a conversation to your team.</p>
              <div className="mt-8 space-y-4">
                {[
                  [ShieldCheck, "You approve the knowledge AIT can use"],
                  [MessageCircle, "Every AI action stays visible in the conversation"],
                  [UserRoundCheck, "A manager can take over at any moment"],
                ].map(([Icon, label]) => {
                  const FeatureIcon = Icon as typeof ShieldCheck
                  return <div key={label as string} className="flex items-center gap-3 text-sm font-bold"><span className="flex h-10 w-10 items-center justify-center rounded-full bg-[#DDE9DD]"><FeatureIcon className="h-4 w-4" /></span>{label as string}</div>
                })}
              </div>
            </div>
          </div>
        </section>

        <section className="px-5 pb-8 lg:px-8 lg:pb-10">
          <div className="relative mx-auto max-w-7xl overflow-hidden rounded-[2.5rem] bg-[#F0A35B] px-7 py-16 text-[#3F2D1D] md:px-14 md:py-20 lg:px-20">
            <div aria-hidden="true" className="absolute -bottom-32 -right-20 h-72 w-72 rounded-full bg-[#F6D18D]" />
            <img src="/ait-logo-icon.svg" alt="AIT frog mascot" className="absolute -bottom-8 right-4 z-10 hidden h-52 w-64 rotate-[4deg] object-contain md:block lg:right-16" />
            <div className="relative z-20 max-w-3xl">
              <p className="text-sm font-extrabold uppercase tracking-[.15em]">Ready when your customers are</p>
              <h2 className="mt-5 text-4xl font-semibold leading-[.98] tracking-[-.055em] md:text-6xl">Let the next message get an immediate answer.</h2>
              <div className="mt-8 flex flex-col gap-3 sm:flex-row">
                <Link href="/signup" className="inline-flex items-center justify-center gap-2 rounded-full bg-[#173E3C] px-6 py-3.5 text-sm font-bold text-white transition-transform hover:-translate-y-0.5">Create your account <ArrowRight className="h-4 w-4" /></Link>
                <Link href="/login" className="inline-flex items-center justify-center rounded-full border border-[#3F2D1D]/20 bg-[#F7C67C] px-6 py-3.5 text-sm font-bold">Log in</Link>
              </div>
            </div>
          </div>
        </section>
      </main>

      <footer className="bg-[#F6F1E7] px-5 py-10 lg:px-8">
        <div className="mx-auto flex max-w-7xl flex-col gap-6 border-t border-[#173E3C]/10 pt-8 sm:flex-row sm:items-center sm:justify-between">
          <AitLogo variant="wordmark" theme="light" size="sm" />
          <p className="text-sm text-[#69807A]">AI answers the routine. Your team handles what matters.</p>
          <div className="flex gap-5 text-sm font-semibold text-[#4D6862]"><Link href="/privacy">Privacy</Link><Link href="/terms">Terms</Link></div>
        </div>
      </footer>
    </div>
  )
}
