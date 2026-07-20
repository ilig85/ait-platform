import { NextResponse } from "next/server"
import { z } from "zod"
import { getCurrentWorkspace } from "@/lib/data/workspace"
import {
  encryptMetaSecret,
  generateRegistrationPin,
} from "@/lib/messaging/meta/credential-crypto"
import {
  exchangeEmbeddedSignupCode,
  loadEmbeddedSignupPhone,
  MetaGraphApiError,
  registerEmbeddedSignupPhone,
  subscribeEmbeddedSignupWaba,
} from "@/lib/messaging/meta/embedded-signup"
import { requiredServerEnv } from "@/lib/messaging/security"
import { createAdminClient } from "@/lib/supabase/admin"

export const runtime = "nodejs"
export const dynamic = "force-dynamic"

const signupSchema = z.object({
  code: z.string().min(10).max(4_096),
  wabaId: z.string().regex(/^\d+$/),
  phoneNumberId: z.string().regex(/^\d+$/),
  businessPortfolioId: z.string().regex(/^\d+$/).nullable().optional(),
})

function safeFailureReason(error: unknown): string {
  if (error instanceof MetaGraphApiError) {
    return `${error.message} (Meta code ${error.code ?? "unknown"})`.slice(0, 500)
  }
  return error instanceof Error ? error.message.slice(0, 500) : "Unknown connection error"
}

export async function POST(request: Request) {
  const workspace = await getCurrentWorkspace()
  if (workspace.status === "unauthenticated") {
    return NextResponse.json({ status: "unauthenticated" }, { status: 401 })
  }
  if (workspace.status !== "ready") {
    return NextResponse.json({ status: "workspace_unavailable" }, { status: 409 })
  }
  if (workspace.role !== "owner") {
    return NextResponse.json(
      { status: "forbidden", message: "Only an organization owner can connect WhatsApp." },
      { status: 403 },
    )
  }

  let parsed: z.infer<typeof signupSchema>
  try {
    parsed = signupSchema.parse(await request.json())
  } catch {
    return NextResponse.json(
      { status: "invalid_signup", message: "Meta returned incomplete signup information." },
      { status: 400 },
    )
  }

  const admin = createAdminClient()
  let connectionId: string | null = null

  try {
    const token = await exchangeEmbeddedSignupCode(parsed.code)
    const phone = await loadEmbeddedSignupPhone(
      token.accessToken,
      parsed.wabaId,
      parsed.phoneNumberId,
    )
    const registrationPin = generateRegistrationPin()
    const encryptedAccessToken = encryptMetaSecret(
      token.accessToken,
      `${parsed.phoneNumberId}:access-token`,
    )
    const encryptedRegistrationPin = encryptMetaSecret(
      registrationPin,
      `${parsed.phoneNumberId}:registration-pin`,
    )

    const installResult = await admin.rpc("ait_install_meta_whatsapp_connection", {
      target_organization_id: workspace.organization.id,
      target_meta_app_id: requiredServerEnv("NEXT_PUBLIC_META_APP_ID"),
      target_business_portfolio_id: parsed.businessPortfolioId ?? "",
      target_waba_id: parsed.wabaId,
      target_phone_number_id: parsed.phoneNumberId,
      target_display_phone_number: phone.displayPhoneNumber ?? "",
      target_verified_name: phone.verifiedName ?? "WhatsApp Business",
      target_encrypted_access_token: encryptedAccessToken,
      target_access_token_expires_at: token.expiresAt?.toISOString() ?? null,
      target_encrypted_registration_pin: encryptedRegistrationPin,
    })
    if (installResult.error || !installResult.data) {
      throw new Error("AIT could not save the WhatsApp connection")
    }
    connectionId = installResult.data

    await registerEmbeddedSignupPhone(token.accessToken, parsed.phoneNumberId, registrationPin)
    await subscribeEmbeddedSignupWaba(token.accessToken, parsed.wabaId)

    const now = new Date().toISOString()
    const [metaUpdate, connectionUpdate] = await Promise.all([
      admin
        .from("meta_whatsapp_connections")
        .update({ webhook_subscription_status: "subscribed" })
        .eq("channel_connection_id", connectionId),
      admin
        .from("channel_connections")
        .update({
          status: "connected",
          connected_at: now,
          disconnected_at: null,
          last_error: null,
        })
        .eq("id", connectionId)
        .eq("organization_id", workspace.organization.id),
    ])
    if (metaUpdate.error || connectionUpdate.error) {
      throw new Error("WhatsApp connected, but AIT could not finalize its local status")
    }

    return NextResponse.json({
      status: "connected",
      connectionId,
      displayPhoneNumber: phone.displayPhoneNumber,
      verifiedName: phone.verifiedName,
    }, { status: 201 })
  } catch (error) {
    const reason = safeFailureReason(error)
    console.error("[meta-embedded-signup] Connection failed", {
      organizationId: workspace.organization.id,
      connectionId,
      reason,
    })

    if (connectionId) {
      await Promise.all([
        admin
          .from("meta_whatsapp_connections")
          .update({ webhook_subscription_status: "error" })
          .eq("channel_connection_id", connectionId),
        admin
          .from("channel_connections")
          .update({ status: "error", last_error: reason })
          .eq("id", connectionId)
          .eq("organization_id", workspace.organization.id),
      ])
    }

    return NextResponse.json({
      status: "connection_failed",
      message: error instanceof MetaGraphApiError
        ? "Meta could not finish the WhatsApp connection. Check the selected business and phone number, then try again."
        : "AIT could not finish the WhatsApp connection. Please try again.",
      metaCode: error instanceof MetaGraphApiError ? error.code : null,
    }, { status: 502 })
  }
}
