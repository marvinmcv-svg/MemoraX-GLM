import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/db'
import { confirmPayment } from '@/lib/payments/server'

export const dynamic = 'force-dynamic'

// POST /api/payments/confirm
// body: { paymentId, payerNote? }
// Used by the QR + Tigo "Ya pagué" button — the parent pastes their bank/Tigo
// confirmation code. In production this triggers an admin-verification queue
// (or a bank API poll); in demo mode it auto-confirms so the flow is testable.
export async function POST(req: NextRequest) {
  try {
    const body = await req.json().catch(() => null)
    if (!body) return NextResponse.json({ error: 'invalid body' }, { status: 400 })

    const paymentId = String(body.paymentId ?? '')
    const payerNote = body.payerNote ? String(body.payerNote).slice(0, 200) : undefined

    if (!paymentId) return NextResponse.json({ error: 'paymentId required' }, { status: 400 })

    const payment = await db.payment.findUnique({ where: { id: paymentId } })
    if (!payment) return NextResponse.json({ error: 'payment not found' }, { status: 404 })
    if (payment.provider === 'stripe') {
      return NextResponse.json({ error: 'Stripe payments confirm via webhook' }, { status: 400 })
    }

    const ok = await confirmPayment(paymentId, { payerNote })
    if (!ok) return NextResponse.json({ error: 'could not confirm' }, { status: 500 })

    return NextResponse.json({ ok: true, status: 'paid', paymentId })
  } catch (e: any) {
    console.error('[payments/confirm] error', e)
    return NextResponse.json({ error: e?.message ?? 'unknown' }, { status: 500 })
  }
}
