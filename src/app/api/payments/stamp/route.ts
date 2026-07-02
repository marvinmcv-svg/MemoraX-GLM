import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/db'

export const dynamic = 'force-dynamic'

// POST /api/payments/stamp
// Internal helper — stamps a provider reference (e.g. Stripe session id) onto
// an existing pending Payment row. Called by the stripe lib after session
// creation. Not user-facing.
export async function POST(req: NextRequest) {
  try {
    const body = await req.json().catch(() => null)
    if (!body) return NextResponse.json({ error: 'invalid body' }, { status: 400 })
    const { paymentId, reference } = body
    if (!paymentId || !reference) {
      return NextResponse.json({ error: 'paymentId + reference required' }, { status: 400 })
    }
    await db.payment.update({ where: { id: paymentId }, data: { reference: String(reference) } })
    return NextResponse.json({ ok: true })
  } catch (e: any) {
    return NextResponse.json({ error: e?.message ?? 'unknown' }, { status: 500 })
  }
}
