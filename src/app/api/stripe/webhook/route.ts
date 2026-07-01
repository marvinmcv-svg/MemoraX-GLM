import { NextRequest, NextResponse } from 'next/server'
import Stripe from 'stripe'
import { db } from '@/lib/db'
import { confirmPayment } from '@/lib/payments/server'

export const runtime = 'nodejs'
export const dynamic = 'force-dynamic'

// POST /api/stripe/webhook
// Verifies the Stripe signature, finds the Payment row by metadata.paymentId,
// and marks it paid. In demo mode (no STRIPE_SECRET_KEY / no STRIPE_WEBHOOK_SECRET)
// this route still accepts signed events but skips signature verification so the
// flow is testable with `stripe listen --forward-to`.
export async function POST(req: NextRequest) {
  const sig = req.headers.get('stripe-signature') ?? ''
  const webhookSecret = process.env.STRIPE_WEBHOOK_SECRET
  const raw = await req.text()

  let event: Stripe.Event | null = null
  try {
    const stripe = webhookSecret && process.env.STRIPE_SECRET_KEY
      ? new Stripe(process.env.STRIPE_SECRET_KEY, { apiVersion: '2025-08-27.basil' as any })
      : null

    if (stripe && webhookSecret) {
      event = stripe.webhooks.constructEvent(raw, sig, webhookSecret)
    } else {
      // Demo mode — parse the event without verification (test webhooks only).
      event = JSON.parse(raw) as Stripe.Event
    }
  } catch (e: any) {
    console.error('[stripe/webhook] signature error', e?.message)
    return NextResponse.json({ error: 'signature invalid' }, { status: 400 })
  }

  if (!event) return NextResponse.json({ error: 'no event' }, { status: 400 })

  try {
    switch (event.type) {
      case 'checkout.session.completed': {
        const session = event.data.object as Stripe.Checkout.Session
        const paymentId = (session.metadata?.paymentId) ?? session.client_reference_id ?? null
        if (paymentId) {
          await confirmPayment(paymentId, { payerNote: `Stripe session ${session.id}` })
        }
        break
      }
      case 'payment_intent.payment_failed': {
        const pi = event.data.object as Stripe.PaymentIntent
        if (pi.metadata?.paymentId) {
          await db.payment.update({
            where: { id: pi.metadata.paymentId },
            data: { status: 'failed' },
          })
        }
        break
      }
      default:
        // ignore other events
        break
    }

    return NextResponse.json({ received: true })
  } catch (e: any) {
    console.error('[stripe/webhook] handler error', e)
    return NextResponse.json({ error: 'handler failed' }, { status: 500 })
  }
}
