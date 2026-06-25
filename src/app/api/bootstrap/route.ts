import { NextResponse } from 'next/server'
import { seedDatabase } from '@/lib/seed'
import { db } from '@/lib/db'

export const dynamic = 'force-dynamic'

// POST /api/bootstrap — seed the demo dataset if empty
export async function POST() {
  try {
    const userCount = await db.user.count()
    if (userCount === 0) {
      const result = await seedDatabase()
      return NextResponse.json({
        seeded: true,
        users: {
          teacher: { id: result.teacher.id, email: result.teacher.email },
          mia: { id: result.mia.id, email: result.mia.email },
          leo: { id: result.leo.id, email: result.leo.email },
          sofia: { id: result.sofia.id, email: result.sofia.email },
          carlos: { id: result.carlos.id, email: result.carlos.email },
        },
        familyId: result.family.id,
      })
    }
    return NextResponse.json({ seeded: false, alreadyExists: true })
  } catch (e: any) {
    console.error('bootstrap error', e)
    return NextResponse.json({ error: e?.message ?? 'unknown' }, { status: 500 })
  }
}

// GET /api/bootstrap — return demo credentials for the landing page
export async function GET() {
  try {
    const users = await db.user.findMany({
      select: { id: true, email: true, name: true, role: true, avatar: true, grade: true },
    })
    return NextResponse.json({ users })
  } catch (e: any) {
    return NextResponse.json({ users: [], error: e?.message })
  }
}
