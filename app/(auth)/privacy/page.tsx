import type { Metadata } from "next"
import Link from "next/link"
import { AitLogo } from "@/components/brand/ait-logo"

export const metadata: Metadata = {
  title: "Privacy Policy | AIT",
  description: "How AIT collects, uses, shares, and protects personal information.",
}

const updatedAt = "July 20, 2026"

export default function PrivacyPolicyPage() {
  return (
    <main className="min-h-screen bg-background">
      <div className="mx-auto w-full max-w-3xl px-6 py-10 sm:py-14">
        <div className="mb-10 flex items-center justify-between gap-4">
          <Link href="/" aria-label="AIT home">
            <AitLogo variant="wordmark" theme="light" size="md" label="AIT" />
          </Link>
          <Link
            href="/login"
            className="text-sm font-medium text-primary hover:underline"
          >
            Sign in
          </Link>
        </div>

        <article className="prose prose-slate max-w-none dark:prose-invert">
          <h1>Privacy Policy</h1>
          <p className="lead">
            This Privacy Policy explains how AIT collects, uses, shares, and
            protects personal information when people use AIT or communicate
            with a business that uses AIT.
          </p>
          <p><strong>Last updated:</strong> {updatedAt}</p>

          <h2>1. Information we process</h2>
          <p>Depending on how AIT is used, we may process:</p>
          <ul>
            <li>
              <strong>Account information:</strong> name, email address,
              authentication records, organization membership, and account
              preferences.
            </li>
            <li>
              <strong>Business and workspace information:</strong> business
              profile details, team settings, connected channels, knowledge
              entries, tasks, and customer-support configurations.
            </li>
            <li>
              <strong>Customer communications:</strong> sender identifiers,
              phone numbers, profile information provided by a connected
              channel, message text, timestamps, delivery status, and related
              conversation metadata.
            </li>
            <li>
              <strong>Integration information:</strong> WhatsApp Business
              account and phone-number identifiers and other information needed
              to connect and operate authorized communication channels.
            </li>
            <li>
              <strong>Technical and security information:</strong> request
              timestamps, diagnostic identifiers, browser or device
              information, approximate network information, and service,
              security, and error logs.
            </li>
          </ul>

          <h2>2. How we use information</h2>
          <p>We use information to:</p>
          <ul>
            <li>provide, maintain, and improve AIT;</li>
            <li>authenticate users and administer workspaces;</li>
            <li>receive, organize, display, and send authorized business communications;</li>
            <li>provide customer-management, workflow, and support features;</li>
            <li>protect the service, prevent abuse, and investigate errors;</li>
            <li>respond to support and privacy requests; and</li>
            <li>comply with applicable legal obligations.</li>
          </ul>

          <h2>3. WhatsApp and connected services</h2>
          <p>
            When a business connects its WhatsApp Business account, AIT
            processes communications and related metadata so the business can
            manage customer conversations. The connected business controls why
            it communicates with its customers and is responsible for its own
            notices, permissions, and lawful use of customer information.
          </p>
          <p>
            Meta and WhatsApp may separately process information under their
            own terms and privacy policies. AIT does not control their
            independent processing.
          </p>

          <h2>4. How we share information</h2>
          <p>We may share information only as needed with:</p>
          <ul>
            <li>authorized members of the relevant AIT workspace;</li>
            <li>
              infrastructure, database, authentication, monitoring, and other
              service providers that help operate AIT;
            </li>
            <li>
              Meta, WhatsApp, and other connected services when necessary to
              provide an integration requested by the business;
            </li>
            <li>
              authorities or other parties when required by law or necessary to
              protect rights, safety, and service integrity; and
            </li>
            <li>
              a successor in connection with a merger, financing, acquisition,
              reorganization, or sale of assets, subject to appropriate
              safeguards.
            </li>
          </ul>
          <p>
            AIT does not sell personal information or use customer message
            content for third-party advertising.
          </p>

          <h2>5. Data retention</h2>
          <p>
            We retain information for as long as needed to provide the service,
            maintain legitimate business and security records, comply with
            legal obligations, and resolve disputes. Retention periods depend
            on the type of information and how the relevant business configures
            and uses AIT. Information may remain for a limited period in
            protected backups after deletion from active systems.
          </p>

          <h2>6. Security</h2>
          <p>
            We use administrative, technical, and organizational safeguards
            designed to protect information. No system can guarantee absolute
            security, so users should also protect their credentials and notify
            us promptly of suspected unauthorized access.
          </p>

          <h2>7. Your choices and requests</h2>
          <p>
            Depending on applicable law, you may request access, correction,
            deletion, restriction, or a copy of personal information. AIT
            account holders may also contact us about closing an account or
            deleting workspace information.
          </p>
          <p>
            If your information was provided through a business using AIT,
            contacting that business first may be the fastest way to complete
            your request. You may also email us. We may need to verify your
            identity and relationship to the relevant account or business
            before acting.
          </p>

          <h2>8. Children</h2>
          <p>
            AIT is a business service and is not directed to children. We do
            not knowingly collect personal information from children in
            violation of applicable law.
          </p>

          <h2>9. International processing</h2>
          <p>
            AIT and its service providers may process information in countries
            other than the country where it was collected. Where required, we
            use appropriate safeguards for international transfers.
          </p>

          <h2>10. Changes to this policy</h2>
          <p>
            We may update this policy as AIT changes. We will post the revised
            policy here and update the date above. Material changes may also be
            communicated through the service or another appropriate channel.
          </p>

          <h2>11. Contact us</h2>
          <p>
            For privacy questions or requests, contact:
          </p>
          <p>
            <strong>AIT</strong><br />
            <a href="mailto:aitplatform.contact@gmail.com">
              aitplatform.contact@gmail.com
            </a>
          </p>
          <p>
            Please do not send passwords, access tokens, or verification codes
            by email.
          </p>
        </article>

        <footer className="mt-12 border-t pt-6 text-sm text-muted-foreground">
          © {new Date().getFullYear()} AIT
        </footer>
      </div>
    </main>
  )
}
