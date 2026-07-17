import type { ProviderDeliveryStatus } from "./provider"

type StoredDeliveryStatus = ProviderDeliveryStatus | "pending" | "received"

const DELIVERY_RANK: Record<"pending" | "sent" | "delivered" | "read", number> = {
  pending: 0,
  sent: 1,
  delivered: 2,
  read: 3,
}

/** Failed is terminal, but is accepted only before confirmed delivery. */
export function shouldAdvanceDeliveryStatus(
  current: StoredDeliveryStatus,
  next: ProviderDeliveryStatus,
): boolean {
  if (current === "received" || current === "read" || current === "failed") return false

  if (next === "failed") {
    return current === "pending" || current === "sent"
  }

  if (current === "delivered") return next === "read"

  return DELIVERY_RANK[next] > DELIVERY_RANK[current]
}
