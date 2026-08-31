import { resolve } from "node:path"

function required(name: string): string {
  const value = process.env[name]?.trim()
  if (!value) throw new Error(`${name} is required`)
  return value
}

function validHttpUrl(name: string): string {
  const value = required(name)
  const parsed = new URL(value)
  if (parsed.protocol !== "https:" && parsed.protocol !== "http:") {
    throw new Error(`${name} must be an HTTP(S) URL`)
  }
  return parsed.toString().replace(/\/$/, "")
}

const port = Number.parseInt(process.env.PORT ?? "3001", 10)
if (!Number.isInteger(port) || port < 1 || port > 65_535) {
  throw new Error("PORT must be between 1 and 65535")
}

const workerSecret = required("AIT_WORKER_SECRET")
if (workerSecret.length < 32) {
  throw new Error("AIT_WORKER_SECRET must contain at least 32 characters")
}

export const config = {
  port,
  workerSecret,
  supabaseUrl: validHttpUrl("SUPABASE_URL"),
  supabaseServiceRoleKey: required("SUPABASE_SERVICE_ROLE_KEY"),
  authDir: resolve(process.env.BAILEYS_AUTH_DIR ?? "./auth"),
  logLevel: process.env.LOG_LEVEL ?? "info",
}
