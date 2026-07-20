"use client"

import { useState } from "react"
import { Loader2 } from "lucide-react"
import { Button } from "@/components/ui/button"

type FacebookLoginResponse = {
  authResponse?: { code?: string }
  status?: string
}

type FacebookSdk = {
  init(options: {
    appId: string
    cookie: boolean
    xfbml: boolean
    version: string
  }): void
  login(
    callback: (response: FacebookLoginResponse) => void,
    options: Record<string, unknown>,
  ): void
}

type EmbeddedSignupSession = {
  wabaId: string
  phoneNumberId: string
  businessPortfolioId: string | null
}

declare global {
  interface Window {
    FB?: FacebookSdk
    fbAsyncInit?: () => void
  }
}

let sdkPromise: Promise<FacebookSdk> | null = null

function loadFacebookSdk(appId: string): Promise<FacebookSdk> {
  if (window.FB) return Promise.resolve(window.FB)
  if (sdkPromise) return sdkPromise

  sdkPromise = new Promise<FacebookSdk>((resolve, reject) => {
    const timeout = window.setTimeout(() => reject(new Error("Meta login took too long to load.")), 15_000)
    window.fbAsyncInit = () => {
      if (!window.FB) {
        window.clearTimeout(timeout)
        reject(new Error("Meta login did not initialize."))
        return
      }
      window.FB.init({ appId, cookie: true, xfbml: false, version: "v25.0" })
      window.clearTimeout(timeout)
      resolve(window.FB)
    }

    if (!document.getElementById("facebook-jssdk")) {
      const script = document.createElement("script")
      script.id = "facebook-jssdk"
      script.async = true
      script.defer = true
      script.crossOrigin = "anonymous"
      script.src = "https://connect.facebook.net/en_US/sdk.js"
      script.onerror = () => {
        window.clearTimeout(timeout)
        script.remove()
        reject(new Error("Meta login could not be loaded."))
      }
      document.head.appendChild(script)
    }
  }).catch((error) => {
    sdkPromise = null
    throw error
  })

  return sdkPromise
}

function parseEmbeddedSignupMessage(value: unknown): {
  event: string
  data: Record<string, unknown>
} | null {
  let parsed = value
  if (typeof value === "string") {
    try {
      parsed = JSON.parse(value)
    } catch {
      return null
    }
  }
  if (!parsed || typeof parsed !== "object") return null
  const message = parsed as { type?: unknown; event?: unknown; data?: unknown }
  if (message.type !== "WA_EMBEDDED_SIGNUP" || typeof message.event !== "string") return null
  return {
    event: message.event,
    data: message.data && typeof message.data === "object"
      ? message.data as Record<string, unknown>
      : {},
  }
}

function waitForEmbeddedSignupSession(): {
  promise: Promise<EmbeddedSignupSession>
  cancel: () => void
} {
  let removeListener = () => {}
  let cancel = () => {}
  const promise = new Promise<EmbeddedSignupSession>((resolve, reject) => {
    const allowedOrigins = new Set(["https://www.facebook.com", "https://web.facebook.com"])
    const timeout = window.setTimeout(() => {
      removeListener()
      reject(new Error("Meta did not return the WhatsApp account details. Please try again."))
    }, 120_000)

    const finish = (result: EmbeddedSignupSession | Error) => {
      window.clearTimeout(timeout)
      removeListener()
      if (result instanceof Error) reject(result)
      else resolve(result)
    }

    const listener = (event: MessageEvent) => {
      if (!allowedOrigins.has(event.origin)) return
      const message = parseEmbeddedSignupMessage(event.data)
      if (!message) return
      if (message.event === "CANCEL" || message.event === "ERROR") {
        finish(new Error("WhatsApp connection was cancelled in Meta."))
        return
      }
      if (message.event !== "FINISH") return

      const wabaId = message.data.waba_id
      const phoneNumberId = message.data.phone_number_id
      const businessPortfolioId = message.data.business_id
      if (typeof wabaId !== "string" || typeof phoneNumberId !== "string") {
        finish(new Error("Meta returned incomplete WhatsApp account details."))
        return
      }
      finish({
        wabaId,
        phoneNumberId,
        businessPortfolioId: typeof businessPortfolioId === "string" ? businessPortfolioId : null,
      })
    }

    removeListener = () => window.removeEventListener("message", listener)
    cancel = () => finish(new Error("WhatsApp connection was cancelled."))
    window.addEventListener("message", listener)
  })

  return { promise, cancel }
}

function requestEmbeddedSignupCode(
  sdk: FacebookSdk,
  configurationId: string,
): Promise<string> {
  return new Promise((resolve, reject) => {
    sdk.login((response) => {
      const code = response.authResponse?.code
      if (typeof code === "string" && code) resolve(code)
      else reject(new Error("Meta did not authorize the WhatsApp connection."))
    }, {
      config_id: configurationId,
      response_type: "code",
      override_default_response_type: true,
      extras: { setup: {}, sessionInfoVersion: "3" },
    })
  })
}

export function WhatsAppConnectButton({
  appId,
  configurationId,
  owner,
}: {
  appId: string | null
  configurationId: string | null
  owner: boolean
}) {
  const [connecting, setConnecting] = useState(false)
  const [message, setMessage] = useState<string | null>(null)
  const configured = Boolean(appId && configurationId)

  async function connect() {
    if (!appId || !configurationId) return
    setConnecting(true)
    setMessage(null)
    const sessionWaiter = waitForEmbeddedSignupSession()

    try {
      const sdk = await loadFacebookSdk(appId)
      const [code, session] = await Promise.all([
        requestEmbeddedSignupCode(sdk, configurationId),
        sessionWaiter.promise,
      ])
      const response = await fetch("/api/integrations/whatsapp/embedded-signup", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ code, ...session }),
      })
      const result = await response.json() as { message?: string }
      if (!response.ok) throw new Error(result.message ?? "WhatsApp could not be connected.")

      setMessage("WhatsApp connected. New customers will appear automatically when they message this number.")
      window.setTimeout(() => window.location.reload(), 900)
    } catch (error) {
      sessionWaiter.cancel()
      setMessage(error instanceof Error ? error.message : "WhatsApp could not be connected.")
    } finally {
      setConnecting(false)
    }
  }

  const disabledReason = !owner
    ? "Only an organization owner can connect WhatsApp."
    : !configured
      ? "Meta Embedded Signup must be configured in the deployment first."
      : null

  return (
    <div className="flex flex-col gap-2 items-start">
      <Button
        variant="outline"
        className="border-border/60"
        disabled={connecting || Boolean(disabledReason)}
        title={disabledReason ?? undefined}
        onClick={connect}
      >
        {connecting && <Loader2 className="w-4 h-4 mr-2 animate-spin" />}
        {connecting ? "Connecting…" : "Connect WhatsApp Business"}
      </Button>
      <p className="text-xs text-muted-foreground">
        {message ?? disabledReason ?? "Meta will verify the business and number; recipients never need to be entered manually."}
      </p>
    </div>
  )
}
