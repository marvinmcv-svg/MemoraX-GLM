import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/db'
import { createQrPayment } from '@/lib/payments/qr'
import type { PlanId, BillingCycle } from '@/lib/payments'

export const dynamic = 'force-dynamic'

// POST /api/payments/qr  body: { userId, plan, cycle }
export async function POST(req: NextRequest) {
  try {
    const body = await req.json().catch(() => null)
    if (!body) return NextResponse.json({ error: 'invalid body' }, { status: 400 })

    const userId = String(body.userId ?? '')
    const plan = String(body.plan ?? '') as PlanId
    const cycle = String(body.cycle ?? 'monthly') as BillingCycle

    if (!userId) return NextResponse.json({ error: 'userId required' }, { status: 400 })
    if (!['scholar', 'family', 'educator'].includes(plan)) {
      return NextResponse.json({ error: 'invalid plan' }, { status: 400 })
    }
    if (!['monthly', 'annual'].includes(cycle)) {
      return NextResponse.json({ error: 'invalid cycle' }, { status: 400 })
    }

    const user = await db.user.findUnique({ where: { id: userId } })
    if (!user) return NextResponse.json({ error: 'user not found' }, { status: 404 })

    const qr = await createQrPayment({ userId, plan, cycle })
    return NextResponse.json(qr)
  } catch (e: any) {
    console.error('[payments/qr] error', e)
    return NextResponse.json({ error: e?.message ?? 'unknown' }, { status: 500 })
  }
}
