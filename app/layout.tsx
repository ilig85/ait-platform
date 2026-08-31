import type React from "react"
import type { Metadata, Viewport } from "next"
import { Manrope } from "next/font/google"
import { Analytics } from "@vercel/analytics/next"
import { ThemeProvider } from "@/components/theme-provider"
import { I18nProvider } from "@/lib/i18n"
import { Toaster } from "@/components/ui/sonner"
import "./globals.css"

const manrope = Manrope({
  subsets: ["latin", "cyrillic"],
  weight: ["400", "500", "600", "700", "800"],
  variable: "--font-ait-sans",
})

export const metadata: Metadata = {
  title: "AIT — AI manager for customer conversations",
  description: "AIT answers routine WhatsApp questions using your business knowledge and brings a manager in when needed.",
  icons: {
    icon: [{ url: "/ait-logo-icon.svg", type: "image/svg+xml" }],
    shortcut: "/ait-logo-icon.svg",
    apple: "/ait-logo-icon.svg",
  },
}

export const viewport: Viewport = {
  themeColor: "#F6F1E7",
  width: "device-width",
  initialScale: 1,
}

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="ru" className={`${manrope.variable} bg-background`} suppressHydrationWarning>
      <body className="font-sans antialiased">
        <I18nProvider>
          <ThemeProvider defaultTheme="light" storageKey="ait-theme">
            <a href="#main-content" className="sr-only focus:not-sr-only focus:fixed focus:left-4 focus:top-4 focus:z-[9999] focus:rounded-full focus:bg-[#173E3C] focus:px-4 focus:py-2 focus:text-sm focus:font-semibold focus:text-white">
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
