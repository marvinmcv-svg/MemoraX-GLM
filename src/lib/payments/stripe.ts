import 'server-only'
import Stripe from 'stripe'
import { PlanId, BillingCycle, PLAN_NAMES, priceForCycle, formatBOB } from './index'
import { createPendingPayment } from './server'

// ============================================================
// Stripe provider — international cards, charged in BOB.
// Gracefully degrades to "demo mode" when STRIPE_SECRET_KEY is absent:
//   - createCheckoutSession returns a fake session URL pointing at /api/payments/demo
//   - the webhook + checkout-complete flow still works against the DB
// This lets the full UI + flow be developed/tested without live keys.
// ============================================================

function getStripe(): Stripe | null {
  const key = process.env.STRIPE_SECRET_KEY
  if (!key || key.trim() === '') return null
  return new Stripe(key, { apiVersion: '2025-08-27.basil' as any })
}

export const stripeDemoMode = () => getStripe() === null

export interface StripeCheckoutResult {
  url: string         // redirect the client here
  paymentId: string   // our internal Payment row id
  sessionId?: string  // Stripe checkout session id (omitted in demo)
}

export async function createCheckoutSession(opts: {
  userId: string
  plan: PlanId
  cycle: BillingCycle
  successUrl: string
  cancelUrl: string
}): Promise<StripeCheckoutResult> {
  const amountBob = priceForCycle(opts.plan, opts.cycle)
  const { id: paymentId, reference } = await createPendingPayment({
    userId: opts.userId,
    provider: 'stripe',
    amountBob: amountBob,
    plan: opts.plan,
    cycle: opts.cycle,
    reference: undefined, // Stripe session id becomes the reference
  })

  const stripe = getStripe()
  if (!stripe) {
    // Demo mode — return a synthetic URL that the client treats as a session.
    return {
      url: `${opts.successUrl}?demo=1&paymentId=${paymentId}`,
      paymentId,
    }
  }

  const session = await stripe.checkout.sessions.create({
    mode: 'payment',
    line_items: [
      {
        quantity: 1,
        price_data: {
          currency: 'bob',
          unit_amount: amountBob,
          product_data: {
            name: `MemoraX ${PLAN_NAMES[opts.plan]} — ${opts.cycle === 'annual' ? 'Anual' : 'Mensual'}`,
            description: `Plan ${PLAN_NAMES[opts.plan]} · ${formatBOB(amountBob)} · referencia ${reference}`,
          },
        },
      },
    ],
    success_url: `${opts.successUrl}?session_id={CHECKOUT_SESSION_ID}&paymentId=${paymentId}`,
    cancel_url: opts.cancelUrl,
    client_reference_id: paymentId,
    metadata: {
      paymentId,
      userId: opts.userId,
      plan: opts.plan,
      cycle: opts.cycle,
    },
  })

  // stamp the Stripe session id as our reference
  await fetch(`${process.env.NEXTAUTH_URL ?? 'http://localhost:3000'}/api/payments/stamp`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ paymentId, reference: session.id }),
  }).catch(() => {})

  return { url: session.url!, paymentId, sessionId: session.id }
}
