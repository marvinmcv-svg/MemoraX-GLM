import { NextRequest } from 'next/server'
import { db } from '@/lib/db'

export const dynamic = 'force-dynamic'

// POST /api/teacher/course
// body: { teacherId, name, subject?, color?, room? }
export async function POST(req: NextRequest) {
  const { teacherId, name, subject, color, room } = await req.json()
  if (!teacherId || !name) {
    return Response.json({ error: 'teacherId and name required' }, { status: 400 })
  }
  const course = await db.course.create({
    data: {
      name,
      subject: subject || null,
      teacherId,
      color: color || 'emerald',
      room: room || null,
    },
  })
  return Response.json({ course })
}
