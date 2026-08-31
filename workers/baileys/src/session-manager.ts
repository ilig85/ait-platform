import { readdir } from "node:fs/promises"
import { join } from "node:path"
import type { Boom } from "@hapi/boom"
import makeWASocket, {
  Browsers,
  DisconnectReason,
  jidNormalizedUser,
  useMultiFileAuthState,
  type WASocket,
  type WAMessage,
  type WAMessageContent,
} from "@whiskeysockets/baileys"
import pino from "pino"
import { config } from "./config.js"
import {
  loadBaileysConnection,
  recordInboundText,
  setConnectionState,
  type BaileysConnection,
} from "./supabase.js"

const logger = pino({ level: config.logLevel })
const baileysLogger = pino({ level: "silent" })
const UUID_PATTERN = /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i

type Session = {
  socket: WASocket
  connection: BaileysConnection
  pairingReady: Promise<void>
  resolvePairingReady: () => void
  pairingPending: boolean
}

const sessions = new Map<string, Session>()
const reconnectAttempts = new Map<string, number>()

function messageText(content: WAMessageContent | null | undefined): string | null {
  if (!content) return null
  if (typeof content.conversation === "string") return content.conversation
  if (typeof content.extendedTextMessage?.text === "string") return content.extendedTextMessage.text
  if (content.ephemeralMessage?.message) return messageText(content.ephemeralMessage.message)
  if (content.viewOnceMessage?.message) return messageText(content.viewOnceMessage.message)
  if (content.viewOnceMessageV2?.message) return messageText(content.viewOnceMessageV2.message)
  return null
}

function messageDate(message: WAMessage): Date {
  const raw = message.messageTimestamp
  const seconds = typeof raw === "number"
    ? raw
    : raw && typeof raw === "object" && "toNumber" in raw
      ? raw.toNumber()
      : Number(raw)
  const date = new Date(seconds * 1000)
  return Number.isNaN(date.getTime()) ? new Date() : date
}

async function ingestMessage(connection: BaileysConnection, message: WAMessage): Promise<void> {
  const remoteJid = message.key.remoteJid
  const providerMessageId = message.key.id
  if (message.key.fromMe || !remoteJid || !providerMessageId) return

  const normalizedJid = jidNormalizedUser(remoteJid)
  if (!normalizedJid.endsWith("@s.whatsapp.net")) return

  const text = messageText(message.message)?.trim()
  if (!text) return

  const senderPhoneNumber = normalizedJid.split("@")[0]?.split(":")[0]
  if (!senderPhoneNumber || !/^\d+$/.test(senderPhoneNumber)) return

  await recordInboundText({
    connection,
    providerMessageId,
    senderExternalId: normalizedJid,
    senderPhoneNumber,
    senderDisplayName: message.pushName?.trim() || null,
    text,
    occurredAt: messageDate(message),
  })
}

function reconnectDelay(connectionId: string): number {
  const attempt = (reconnectAttempts.get(connectionId) ?? 0) + 1
  reconnectAttempts.set(connectionId, attempt)
  return Math.min(30_000, 1_000 * 2 ** Math.min(attempt, 5))
}

async function openSession(connectionId: string): Promise<Session> {
  const existing = sessions.get(connectionId)
  if (existing) return existing

  const connection = await loadBaileysConnection(connectionId)
  await setConnectionState(connection, { status: "connecting" })
  const { state, saveCreds } = await useMultiFileAuthState(join(config.authDir, connectionId))

  let resolvePairingReady = () => {}
  const pairingReady = new Promise<void>((resolve) => {
    resolvePairingReady = resolve
  })
  const socket = makeWASocket({
    auth: state,
    browser: Browsers.macOS("Desktop"),
    logger: baileysLogger,
    markOnlineOnConnect: false,
    syncFullHistory: false,
  })
  const session: Session = {
    socket,
    connection,
    pairingReady,
    resolvePairingReady,
    pairingPending: false,
  }
  sessions.set(connectionId, session)

  socket.ev.on("creds.update", saveCreds)
  socket.ev.on("messages.upsert", ({ messages, type }) => {
    if (type !== "notify") return
    for (const message of messages) {
      void ingestMessage(connection, message).catch((error) => {
        logger.error({ error, connectionId, providerMessageId: message.key.id }, "Inbound message failed")
      })
    }
  })
  socket.ev.on("connection.update", (update) => {
    if (update.qr) session.resolvePairingReady()

    if (update.connection === "open") {
      reconnectAttempts.delete(connectionId)
      session.pairingPending = false
      session.resolvePairingReady()
      const accountId = socket.user?.id ? jidNormalizedUser(socket.user.id) : connection.phoneNumber
      void setConnectionState(connection, {
        status: "connected",
        accountId,
        displayName: socket.user?.name || "WhatsApp",
      }).catch((error) => logger.error({ error, connectionId }, "Could not save connected state"))
      logger.info({ connectionId }, "WhatsApp connected")
      return
    }

    if (update.connection !== "close") return
    sessions.delete(connectionId)
    const statusCode = (update.lastDisconnect?.error as Boom | undefined)?.output?.statusCode
    const loggedOut = statusCode === DisconnectReason.loggedOut
    void setConnectionState(connection, {
      status: loggedOut ? "disconnected" : "reconnecting",
      error: loggedOut ? "WhatsApp unlinked this device. Connect it again." : null,
    }).catch((error) => logger.error({ error, connectionId }, "Could not save disconnected state"))

    if (!loggedOut) {
      const delay = reconnectDelay(connectionId)
      setTimeout(() => {
        void openSession(connectionId).catch((error) => {
          logger.error({ error, connectionId }, "WhatsApp reconnect failed")
        })
      }, delay)
    }
  })

  return session
}

async function withTimeout<T>(promise: Promise<T>, milliseconds: number, message: string): Promise<T> {
  let timeout: NodeJS.Timeout | undefined
  try {
    return await Promise.race([
      promise,
      new Promise<never>((_, reject) => {
        timeout = setTimeout(() => reject(new Error(message)), milliseconds)
      }),
    ])
  } finally {
    if (timeout) clearTimeout(timeout)
  }
}

export async function requestPairingCode(connectionId: string, phoneNumber: string): Promise<string> {
  const normalizedPhone = phoneNumber.replace(/\D/g, "")
  if (!/^\d{8,15}$/.test(normalizedPhone)) throw new Error("Phone number must contain 8 to 15 digits")

  const session = await openSession(connectionId)
  if (session.connection.phoneNumber !== normalizedPhone) {
    throw new Error("Phone number does not match the trusted connection")
  }
  if (session.socket.authState.creds.registered) {
    throw new Error("This WhatsApp connection is already paired")
  }
  if (session.pairingPending) {
    throw new Error("A pairing request is already active")
  }

  session.pairingPending = true
  try {
    await withTimeout(session.pairingReady, 20_000, "WhatsApp did not become ready for pairing")
    const code = await session.socket.requestPairingCode(normalizedPhone)
    setTimeout(() => {
      const current = sessions.get(connectionId)
      if (current === session) current.pairingPending = false
    }, 120_000)
    return code
  } catch (error) {
    session.pairingPending = false
    throw error
  }
}

export async function sendText(
  connectionId: string,
  recipientExternalId: string,
  text: string,
): Promise<{ externalMessageId: string; acceptedAt: string }> {
  const session = sessions.get(connectionId) ?? await openSession(connectionId)
  if (!session.socket.authState.creds.registered) throw new Error("WhatsApp is not paired")

  const normalizedRecipient = recipientExternalId.includes("@")
    ? jidNormalizedUser(recipientExternalId)
    : `${recipientExternalId.replace(/\D/g, "")}@s.whatsapp.net`
  if (!/^\d+@s\.whatsapp\.net$/.test(normalizedRecipient)) {
    throw new Error("Recipient is not a one-to-one WhatsApp contact")
  }

  const sent = await session.socket.sendMessage(normalizedRecipient, { text })
  if (!sent?.key.id) throw new Error("WhatsApp did not return a message ID")
  return { externalMessageId: sent.key.id, acceptedAt: new Date().toISOString() }
}

export async function restoreSessions(): Promise<void> {
  let entries: string[] = []
  try {
    entries = await readdir(config.authDir)
  } catch (error) {
    if ((error as NodeJS.ErrnoException).code !== "ENOENT") throw error
    return
  }

  await Promise.all(entries.filter((entry) => UUID_PATTERN.test(entry)).map(async (connectionId) => {
    try {
      await openSession(connectionId)
    } catch (error) {
      logger.error({ error, connectionId }, "Stored WhatsApp session could not be restored")
    }
  }))
}
