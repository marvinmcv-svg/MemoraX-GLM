import 'server-only'
import { db } from '@/lib/db'
import type { PlanId, BillingCycle, PaymentProvider } from './index'

// ============================================================
// MemoraX payments — server-only DB + provider logic.
// Types/constants/formatting live in ./index.ts (client-safe).
// ============================================================

/** Merchant bank details for QR interbancario payments. */
export const MERCHANT_BANK = {
  bankName: process.env.QR_MERCHANT_BANK ?? 'Banco de Unión',
  accountHolder: process.env.QR_MERCHANT_NAME ?? 'MemoraX Bolivia S.R.L.',
  accountNumber: process.env.QR_MERCHANT_ACCOUNT ?? '1000200030004000',
  ci: process.env.QR_MERCHANT_CI ?? '1234567 LP',
}

/** Tigo Money merchant number. */
export const TIGO_MERCHANT = {
  phoneNumber: process.env.TIGO_MERCHANT_PHONE ?? '70700000',
  merchantName: process.env.TIGO_MERCHANT_NAME ?? 'MEMORAX BO',
}

/** Create a pending Payment row + return it. Used by all three providers. */
export async function createPendingPayment(opts: {
  userId: string
  provider: PaymentProvider
  amountBob: number
  plan: PlanId
  cycle: BillingCycle
  reference?: string
}): Promise<{ id: string; reference: string }> {
  let subscription = await db.subscription.findFirst({
    where: { userId: opts.userId, status: { in: ['active', 'trialing', 'past_due'] } },
    orderBy: { createdAt: 'desc' },
  })

  if (!subscription) {
    const periodEnd = new Date()
    periodEnd.setDate(periodEnd.getDate() + (opts.cycle === 'annual' ? 365 : 30))
    subscription = await db.subscription.create({
      data: {
        userId: opts.userId,
        plan: opts.plan,
        status: 'trialing',
        cycle: opts.cycle,
        currentPeriodEnd: periodEnd,
      },
    })
  }

  const reference = opts.reference ?? generateReference(opts.provider)
  const payment = await db.payment.create({
    data: {
      subscriptionId: subscription.id,
      userId: opts.userId,
      provider: opts.provider,
      amountBob: opts.amountBob,
      status: 'pending',
      reference,
    },
  })

  return { id: payment.id, reference }
}

/** Generate a human-readable reference code for QR / Tigo payments. */
export function generateReference(provider: PaymentProvider): string {
  const prefix = provider === 'qr' ? 'MX-QR' : provider === 'tigo' ? 'MX-TG' : 'MX-SP'
  const rand = Math.random().toString(36).slice(2, 8).toUpperCase()
  const ts = Date.now().toString(36).slice(-4).toUpperCase()
  return `${prefix}-${ts}-${rand}`
}

/** Mark a payment paid + activate the subscription. */
export async function confirmPayment(paymentId: string, opts?: { payerNote?: string }): Promise<boolean> {
  const payment = await db.payment.findUnique({ where: { id: paymentId } })
  if (!payment) return false
  if (payment.status === 'paid') return true

  await db.payment.update({
    where: { id: paymentId },
    data: { status: 'paid', confirmedAt: new Date(), payerNote: opts?.payerNote ?? payment.payerNote },
  })

  if (payment.subscriptionId) {
    const sub = await db.subscription.findUnique({ where: { id: payment.subscriptionId } })
    if (sub) {
      const cycleDays = sub.cycle === 'annual' ? 365 : 30
      const base = sub.currentPeriodEnd > new Date() ? sub.currentPeriodEnd : new Date()
      const periodEnd = new Date(base)
      periodEnd.setDate(periodEnd.getDate() + cycleDays)
      await db.subscription.update({
        where: { id: sub.id },
        data: { status: 'active', currentPeriodEnd: periodEnd },
      })
    }
  }

  return true
}
