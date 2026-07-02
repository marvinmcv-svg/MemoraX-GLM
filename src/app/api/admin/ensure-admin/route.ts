import { NextResponse } from 'next/server'
import { ensureDefaultAdmin } from '@/lib/auth-crypto'
export const dynamic = 'force-dynamic'
const isDemoMode = process.env.NODE_ENV !== 'production' && process.env.VERCEL_ENV !== 'production'
export async function POST() {
  if (!isDemoMode) return NextResponse.json({ error: 'Not available in production' }, { status: 403 })
  try { await ensureDefaultAdmin(); return NextResponse.json({ ok: true }) } catch { return NextResponse.json({ error: 'Setup failed' }, { status: 500 }) }
}
