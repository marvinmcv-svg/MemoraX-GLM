// ============================================================
// MemoraX payments — types, constants, and formatting.
// This module is SAFE for client components (no DB, no SDK).
// The DB + provider logic lives in ./server.ts (server-only).
// ============================================================

export type PlanId = 'free' | 'scholar' | 'family' | 'educator'
export type BillingCycle = 'monthly' | 'annual'
export type PaymentProvider = 'stripe' | 'qr' | 'tigo'
export type PaymentStatus = 'pending' | 'paid' | 'failed' | 'refunded'

// Prices in BOB (Bolivian Boliviano) integer cents.
export const PLAN_PRICES_BOB: Record<PlanId, { monthly: number; annual: number }> = {
  free: { monthly: 0, annual: 0 },
  scholar: { monthly: 5500, annual: 3900 }, // 55 / 39 BOB per month
  family: { monthly: 13900, annual: 9900 }, // 139 / 99 BOB per month
  educator: { monthly: 8900, annual: 6900 }, // 89 / 69 BOB per month
}

export const PLAN_NAMES: Record<PlanId, string> = {
  free: 'Starter',
  scholar: 'Scholar',
  family: 'Family',
  educator: 'Educator',
}

/** BOB cents → display string "139.90 Bs" */
export function formatBOB(cents: number): string {
  return `${(cents / 100).toFixed(2)} Bs`
}

/** Price for one billing cycle (annual is per-month but billed as 12×). */
export function priceForCycle(plan: PlanId, cycle: BillingCycle): number {
  const p = PLAN_PRICES_BOB[plan]
  if (cycle === 'annual') return p.annual * 12
  return p.monthly
}
