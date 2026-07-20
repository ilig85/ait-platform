import "server-only"

import { createCipheriv, createDecipheriv, randomBytes, randomInt } from "node:crypto"
import { requiredServerEnv } from "../security"

const FORMAT_VERSION = "ait-meta-v1"
const IV_BYTES = 12

function encryptionKey(): Buffer {
  const key = Buffer.from(requiredServerEnv("META_CREDENTIAL_ENCRYPTION_KEY"), "base64")
  if (key.length !== 32) {
    throw new Error("META_CREDENTIAL_ENCRYPTION_KEY must be a base64-encoded 32-byte key")
  }
  return key
}

function additionalAuthenticatedData(purpose: string): Buffer {
  return Buffer.from(`ait:meta-cloud:${purpose}`, "utf8")
}

export function encryptMetaSecret(secret: string, purpose: string): string {
  if (!secret) throw new Error("Cannot encrypt an empty Meta credential")

  const iv = randomBytes(IV_BYTES)
  const cipher = createCipheriv("aes-256-gcm", encryptionKey(), iv)
  cipher.setAAD(additionalAuthenticatedData(purpose))
  const ciphertext = Buffer.concat([cipher.update(secret, "utf8"), cipher.final()])
  const authenticationTag = cipher.getAuthTag()

  return [
    FORMAT_VERSION,
    iv.toString("base64url"),
    authenticationTag.toString("base64url"),
    ciphertext.toString("base64url"),
  ].join(".")
}

export function decryptMetaSecret(encrypted: string, purpose: string): string {
  const [version, encodedIv, encodedTag, encodedCiphertext, ...extra] = encrypted.split(".")
  if (
    version !== FORMAT_VERSION
    || !encodedIv
    || !encodedTag
    || !encodedCiphertext
    || extra.length > 0
  ) {
    throw new Error("Stored Meta credential has an unsupported format")
  }

  const decipher = createDecipheriv(
    "aes-256-gcm",
    encryptionKey(),
    Buffer.from(encodedIv, "base64url"),
  )
  decipher.setAAD(additionalAuthenticatedData(purpose))
  decipher.setAuthTag(Buffer.from(encodedTag, "base64url"))

  return Buffer.concat([
    decipher.update(Buffer.from(encodedCiphertext, "base64url")),
    decipher.final(),
  ]).toString("utf8")
}

export function generateRegistrationPin(): string {
  return randomInt(0, 1_000_000).toString().padStart(6, "0")
}
