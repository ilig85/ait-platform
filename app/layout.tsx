import type React from "react"
import type { Metadata, Viewport } from "next"
import { Noto_Sans } from "next/font/google"
import { Analytics } from "@vercel/analytics/next"
import { ThemeProvider } from "@/components/theme-provider"
import { I18nProvider } from "@/lib/i18n"
import { Toaster } from "@/components/ui/sonner"
import "./globals.css"

const notoSans = Noto_Sans({
  subsets: ["latin", "cyrillic"],
  weight: ["400", "500", "600", "700"],
  variable: "--font-sans",
})

export const metadata: Metadata = {
  title: "AIT — Your customers message. AIT handles the rest.",
  description:
    "Connect WhatsApp Business, organize every conversation, and let AI answer customers while you stay in control.",
  generator: "v0.app",
  icons: {
    icon: [
      { url: "/icon-light-32x32.png", media: "(prefers-color-scheme: light)" },
      { url: "/icon-dark-32x32.png", media: "(prefers-color-scheme: dark)" },
      { url: "/icon.svg", type: "image/svg+xml" },
    ],
    apple: "/apple-icon.png",
  },
}

export const viewport: Viewport = {
  themeColor: "#071A1B",
  width: "device-width",
  initialScale: 1,
}

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="ru" className={`${notoSans.variable} bg-background`} suppressHydrationWarning>
      <body className="font-sans antialiased">
        <I18nProvider>
          <ThemeProvider defaultTheme="light" storageKey="ait-theme">
            <a
              href="#main-content"
              className="sr-only focus:not-sr-only focus:fixed focus:top-4 focus:left-4 focus:z-[9999] focus:px-4 focus:py-2 focus:rounded-lg focus:text-sm focus:font-semibold"
              style={{ backgroundColor: "#2DE2B1", color: "#071A1B" }}
            >
              Skip to main content
            </a>
            {children}
            <Toaster position="bottom-right" richColors />
          </ThemeProvider>
        </I18nProvider>
        <Analytics />
      </body>
    </html>
  )
}
