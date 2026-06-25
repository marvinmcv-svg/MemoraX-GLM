import { NextResponse } from 'next/server'
import { seedDatabase } from '@/lib/seed'
import { db } from '@/lib/db'

export const dynamic = 'force-dynamic'

export async function POST() {
  try {
    const result = await seedDatabase()
    const count = await db.user.count()
    return NextResponse.json({ ok: true, users: count, familyId: result.family.id })
  } catch (e: any) {
    return NextResponse.json({ error: e?.message ?? 'unknown' }, { status: 500 })
  }
}
