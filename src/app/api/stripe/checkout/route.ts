import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { db } from '@/lib/db'
import { getStripe, TIER_CONFIG, ensureStripeProducts, type TierCode } from '@/lib/stripe'

export const dynamic = 'force-dynamic'

// POST /api/stripe/checkout
// body: { tier: 'SCHOLAR' | 'FAMILY' | 'EDUCATOR', billing: 'monthly' | 'annual' }
// Creates a Stripe Checkout session and returns the URL
export async function POST(req: NextRequest) {
  const session = await getServerSession(authOptions)
  if (!session?.user) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  const { tier, billing } = await req.json()
  if (!tier || !TIER_CONFIG[tier as TierCode]) {
    return NextResponse.json({ error: 'Invalid tier' }, { status: 400 })
  }
  if (!billing || !['monthly', 'annual'].includes(billing)) {
    return NextResponse.json({ error: 'Invalid billing period' }, { status: 400 })
  }

  const userId = (session.user as any).id
  const userEmail = session.user.email!
  const userName = session.user.name!

  try {
    const stripe = getStripe()

    // Ensure products exist (or use cached price IDs)
    // In production, you'd have fixed price IDs in env vars
    const prices = await ensureStripeProducts()
    const priceId = prices[`${tier}_${billing}`]

    if (!priceId) {
      // Fallback: create a one-off price for this checkout
      const config = TIER_CONFIG[tier as TierCode]
      const amount = billing === 'monthly' ? config.monthlyPrice : config.annualPrice * 12
      const price = await stripe.prices.create({
        unit_amount: amount,
        currency: 'usd',
        recurring: { interval: billing === 'monthly' ? 'month' : 'year' },
        metadata: { tier, billing },
      })
      // Use this price for checkout
      const checkoutSession = await stripe.checkout.sessions.create({
        mode: 'subscription',
        payment_method_types: ['card'],
        customer_email: userEmail,
        line_items: [{ price: price.id, quantity: 1 }],
        success_url: `${process.env.NEXTAUTH_URL}/?upgrade=success&tier=${tier}`,
        cancel_url: `${process.env.NEXTAUTH_URL}/?upgrade=cancelled`,
        metadata: {
          userId,
          tier,
          billing,
        },
        subscription_data: {
          metadata: { userId, tier },
        },
      })
      return NextResponse.json({ url: checkoutSession.url })
    }

    const checkoutSession = await stripe.checkout.sessions.create({
      mode: 'subscription',
      payment_method_types: ['card'],
      customer_email: userEmail,
      line_items: [{ price: priceId, quantity: 1 }],
      success_url: `${process.env.NEXTAUTH_URL}/?upgrade=success&tier=${tier}`,
      cancel_url: `${process.env.NEXTAUTH_URL}/?upgrade=cancelled`,
      metadata: {
        userId,
        tier,
        billing,
      },
      subscription_data: {
        metadata: { userId, tier },
      },
    })

    return NextResponse.json({ url: checkoutSession.url })
  } catch (e: any) {
    console.error('Stripe checkout error:', e)
    return NextResponse.json({ error: 'Could not create checkout session' }, { status: 500 })
  }
}
