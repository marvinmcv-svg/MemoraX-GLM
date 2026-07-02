import { NextResponse } from 'next/server'
import { seedDatabase } from '@/lib/seed'
import { db } from '@/lib/db'
import { requireAdmin } from '@/lib/auth'

export const dynamic = 'force-dynamic'

/** POST /api/admin/reset — wipe + re-seed the demo dataset. */
export async function POST() {
  const guard = await requireAdmin()
  if (!guard.ok) return guard.response

  try {
    const result = await seedDatabase()
    const count = await db.user.count()
    return NextResponse.json({
      ok: true,
      users: count,
      familyId: result.family.id,
    })
  } catch (e: any) {
    return NextResponse.json(
      { error: e?.message ?? 'unknown' },
      { status: 500 }
    )
  }
}
