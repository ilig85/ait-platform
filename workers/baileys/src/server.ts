import { createServer, type IncomingMessage, type ServerResponse } from "node:http"
import { timingSafeEqual } from "node:crypto"
import pino from "pino"
import { config } from "./config.js"
import { requestPairingCode, restoreSessions, sendText } from "./session-manager.js"

const logger = pino({ level: config.logLevel })
const CONNECTION_ROUTE = /^\/connections\/([0-9a-f-]+)\/(pairing-code|messages)$/i

function authorized(request: IncomingMessage): boolean {
  const supplied = request.headers.authorization?.replace(/^Bearer\s+/i, "") ?? ""
  const expectedBuffer = Buffer.from(config.workerSecret)
  const suppliedBuffer = Buffer.from(supplied)
  return suppliedBuffer.length === expectedBuffer.length
    && timingSafeEqual(suppliedBuffer, expectedBuffer)
}

async function jsonBody(request: IncomingMessage): Promise<unknown> {
  const chunks: Buffer[] = []
  let size = 0
  for await (const chunk of request) {
    const buffer = Buffer.isBuffer(chunk) ? chunk : Buffer.from(chunk)
    size += buffer.length
    if (size > 16_384) throw new Error("Request body is too large")
    chunks.push(buffer)
  }
  if (chunks.length === 0) return {}
  return JSON.parse(Buffer.concat(chunks).toString("utf8"))
}

function respond(response: ServerResponse, status: number, body: unknown): void {
  response.writeHead(status, {
    "content-type": "application/json; charset=utf-8",
    "cache-control": "no-store",
  })
  response.end(JSON.stringify(body))
}

function safeError(error: unknown): string {
  return error instanceof Error ? error.message.slice(0, 300) : "Unknown worker error"
}

const server = createServer(async (request, response) => {
  const url = new URL(request.url ?? "/", "http://worker.local")
  if (request.method === "GET" && url.pathname === "/health") {
    respond(response, 200, { status: "ok" })
    return
  }
  if (!authorized(request)) {
    respond(response, 401, { status: "unauthorized" })
    return
  }

  const match = url.pathname.match(CONNECTION_ROUTE)
  if (request.method !== "POST" || !match) {
    respond(response, 404, { status: "not_found" })
    return
  }

  const connectionId = match[1]!
  const action = match[2]!
  try {
    const body = await jsonBody(request) as Record<string, unknown>
    if (action === "pairing-code") {
      const phoneNumber = typeof body.phoneNumber === "string" ? body.phoneNumber : ""
      const code = await requestPairingCode(connectionId, phoneNumber)
      respond(response, 201, { status: "pairing_code_ready", code })
      return
    }

    const recipientExternalId = typeof body.recipientExternalId === "string"
      ? body.recipientExternalId
      : ""
    const text = typeof body.text === "string" ? body.text : ""
    if (!recipientExternalId || !text.trim() || Array.from(text).length > 4_096) {
      respond(response, 400, { status: "invalid_message" })
      return
    }
    const sent = await sendText(connectionId, recipientExternalId, text)
    respond(response, 201, { status: "sent", ...sent })
  } catch (error) {
    const message = safeError(error)
    logger.error({ error, connectionId, action }, "Worker request failed")
    respond(response, 502, { status: "worker_error", message })
  }
})

server.listen(config.port, () => {
  logger.info({ port: config.port }, "AIT Baileys worker listening")
  void restoreSessions().catch((error) => {
    logger.error({ error }, "Stored WhatsApp sessions could not be restored")
  })
})

function shutdown(signal: string): void {
  logger.info({ signal }, "Stopping AIT Baileys worker")
  server.close((error) => {
    if (error) {
      logger.error({ error }, "Worker shutdown failed")
      process.exitCode = 1
    }
  })
}

process.on("SIGTERM", () => shutdown("SIGTERM"))
process.on("SIGINT", () => shutdown("SIGINT"))
