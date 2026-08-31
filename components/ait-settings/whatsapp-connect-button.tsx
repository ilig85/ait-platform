"use client"

import { useState } from "react"
import { CheckCircle2, Loader2 } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"

type PairingResponse = {
  status?: string
  code?: string
  message?: string
}

function delay(milliseconds: number) {
  return new Promise((resolve) => window.setTimeout(resolve, milliseconds))
}

export function WhatsAppConnectButton({
  owner,
}: {
  appId: string | null
  configurationId: string | null
  owner: boolean
}) {
  const [phoneNumber, setPhoneNumber] = useState("")
  const [connecting, setConnecting] = useState(false)
  const [pairingCode, setPairingCode] = useState<string | null>(null)
  const [connected, setConnected] = useState(false)
  const [message, setMessage] = useState<string | null>(null)

  async function waitForConnection() {
    for (let attempt = 0; attempt < 60; attempt += 1) {
      await delay(2_000)
      const response = await fetch("/api/integrations/whatsapp/baileys/pairing-code", {
        cache: "no-store",
      })
      if (!response.ok) continue
      const result = await response.json() as PairingResponse
      if (result.status === "connected") {
        setConnected(true)
        setPairingCode(null)
        setMessage("WhatsApp connected. New messages will appear in Inbox automatically.")
        window.setTimeout(() => window.location.reload(), 1_200)
        return
      }
      if (result.status === "error" || result.status === "disconnected") {
        setMessage(result.message ?? "WhatsApp did not finish linking. Please try again.")
        return
      }
    }
    setMessage("Pairing timed out. Request a new code and try again.")
  }

  async function connect() {
    setConnecting(true)
    setPairingCode(null)
    setConnected(false)
    setMessage(null)
    try {
      const response = await fetch("/api/integrations/whatsapp/baileys/pairing-code", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ phoneNumber }),
      })
      const result = await response.json().catch(() => null) as PairingResponse | null
      if (!response.ok) throw new Error(result?.message ?? "WhatsApp could not be connected.")
      if (result?.status === "connected") {
        setConnected(true)
        setMessage("This WhatsApp number is already connected.")
        return
      }
      if (!result?.code) throw new Error("WhatsApp did not return a pairing code.")
      setPairingCode(result.code)
      setMessage("Open WhatsApp → Settings → Linked Devices → Link a Device → Link with phone number, then enter this code.")
      void waitForConnection()
    } catch (error) {
      setMessage(error instanceof Error ? error.message : "WhatsApp could not be connected.")
    } finally {
      setConnecting(false)
    }
  }

  const disabledReason = !owner ? "Only an organization owner can connect WhatsApp." : null

  return (
    <div className="flex flex-col gap-3 items-start">
      <div className="w-full max-w-sm space-y-2">
        <label htmlFor="whatsapp-phone" className="text-xs font-medium text-foreground">
          WhatsApp phone number
        </label>
        <Input
          id="whatsapp-phone"
          type="tel"
          inputMode="tel"
          autoComplete="tel"
          placeholder="+996 555 123 456"
          value={phoneNumber}
          disabled={connecting || !owner}
          onChange={(event) => setPhoneNumber(event.target.value)}
        />
        <p className="text-xs text-muted-foreground">Include the country code. AIT connects as a linked device.</p>
      </div>

      <Button
        variant="outline"
        className="border-border/60"
        disabled={connecting || Boolean(disabledReason) || phoneNumber.trim().length < 8}
        title={disabledReason ?? undefined}
        onClick={() => void connect()}
      >
        {connecting && <Loader2 className="w-4 h-4 mr-2 animate-spin" />}
        {connected && <CheckCircle2 className="w-4 h-4 mr-2" />}
        {connecting ? "Creating pairing code…" : connected ? "WhatsApp connected" : "Connect WhatsApp"}
      </Button>

      {pairingCode && (
        <div className="rounded-xl border border-primary/30 bg-primary/5 px-5 py-4">
          <p className="text-xs font-medium text-muted-foreground">Pairing code</p>
          <p className="mt-1 font-mono text-2xl font-semibold tracking-[0.3em] text-foreground">
            {pairingCode.match(/.{1,4}/g)?.join(" ") ?? pairingCode}
          </p>
        </div>
      )}
      <p className="text-xs text-muted-foreground leading-relaxed">
        {message ?? disabledReason ?? "Your phone stays signed in. You can unlink AIT at any time from WhatsApp's Linked Devices screen."}
      </p>
    </div>
  )
}
