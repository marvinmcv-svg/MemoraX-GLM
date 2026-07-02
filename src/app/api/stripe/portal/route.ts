import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { getStripe } from '@/lib/stripe'

export const dynamic = 'force-dynamic'

// POST /api/stripe/portal
// Creates a Stripe Customer Portal session for self-serve subscription management
// (cancel, update payment method, view invoices)
export async function POST(_req: NextRequest) {
  const session = await getServerSession(authOptions)
  if (!session?.user) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  const userEmail = session.user.email!

  try {
    const stripe = getStripe()

    // Find the customer by email
    const customers = await stripe.customers.list({ email: userEmail, limit: 1 })

    if (customers.data.length === 0) {
      return NextResponse.json({ error: 'No subscription found' }, { status: 404 })
    }

    const customerId = customers.data[0].id

    const portalSession = await stripe.billingPortal.sessions.create({
      customer: customerId,
      return_url: `${process.env.NEXTAUTH_URL}/`,
    })

    return NextResponse.json({ url: portalSession.url })
  } catch (e: any) {
    console.error('Stripe portal error:', e)
    return NextResponse.json({ error: 'Could not create portal session' }, { status: 500 })
  }
}
