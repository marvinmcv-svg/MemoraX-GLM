import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/db'

export const dynamic = 'force-dynamic'

// GET /api/payments/status/[id] — poll a payment's status (used by QR/Tigo
// while the parent completes the transfer in their bank/wallet app).
export async function GET(_req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params
  const payment = await db.payment.findUnique({
    where: { id },
    select: { id: true, status: true, provider: true, amountBob: true, reference: true, confirmedAt: true },
  })
  if (!payment) return NextResponse.json({ error: 'not found' }, { status: 404 })
  return NextResponse.json(payment)
}
