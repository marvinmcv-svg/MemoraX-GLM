import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/db'

export const dynamic = 'force-dynamic'

// GET /api/payments/billing?userId=...
// Returns the user's current subscription + recent payment history.
export async function GET(req: NextRequest) {
  const url = new URL(req.url)
  const userId = url.searchParams.get('userId')
  if (!userId) return NextResponse.json({ error: 'userId required' }, { status: 400 })

  const user = await db.user.findUnique({ where: { id: userId } })
  if (!user) return NextResponse.json({ error: 'user not found' }, { status: 404 })

  const [subscription, payments] = await Promise.all([
    db.subscription.findFirst({
      where: { userId },
      orderBy: { createdAt: 'desc' },
    }),
    db.payment.findMany({
      where: { userId },
      orderBy: { createdAt: 'desc' },
      take: 20,
    }),
  ])

  return NextResponse.json({
    subscription: subscription
      ? {
          id: subscription.id,
          plan: subscription.plan,
          status: subscription.status,
          cycle: subscription.cycle,
          currentPeriodEnd: subscription.currentPeriodEnd.toISOString(),
        }
      : null,
    payments: payments.map((p) => ({
      id: p.id,
      provider: p.provider,
      amountBob: p.amountBob,
      status: p.status,
      reference: p.reference,
      payerNote: p.payerNote,
      createdAt: p.createdAt.toISOString(),
      confirmedAt: p.confirmedAt?.toISOString() ?? null,
    })),
  })
}
