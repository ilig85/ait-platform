import { createHash, createHmac, timingSafeEqual } from "node:crypto"

export function constantTimeSecretEqual(actual: string, expected: string): boolean {
  const actualDigest = createHash("sha256").update(actual, "utf8").digest()
  const expectedDigest = createHash("sha256").update(expected, "utf8").digest()

  return timingSafeEqual(actualDigest, expectedDigest)
}

export function verifyWebhookChallenge(
  query: URLSearchParams,
  expectedVerifyToken: string,
): { valid: true; challenge: string } | { valid: false } {
  const mode = query.get("hub.mode")
  const suppliedToken = query.get("hub.verify_token")
  const challenge = query.get("hub.challenge")

  if (
    mode !== "subscribe"
    || suppliedToken === null
    || challenge === null
    || expectedVerifyToken.length === 0
    || !constantTimeSecretEqual(suppliedToken, expectedVerifyToken)
  ) {
    return { valid: false }
  }

  return { valid: true, challenge }
}

export function verifyHmacSha256Signature(
  rawBody: Uint8Array,
  signature: string | null,
  secret: string,
): boolean {
  if (!signature || !/^sha256=[0-9a-f]{64}$/i.test(signature) || !secret) return false

  const supplied = Buffer.from(signature.slice("sha256=".length), "hex")
  const expected = createHmac("sha256", secret).update(rawBody).digest()
  return supplied.length === expected.length && timingSafeEqual(supplied, expected)
}

export function requiredServerEnv(name: string): string {
  const value = process.env[name]

  if (!value) {
    throw new Error(`Missing required server environment variable: ${name}`)
  }

  return value
}
