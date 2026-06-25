import { NextRequest } from 'next/server'
import { db } from '@/lib/db'

export const dynamic = 'force-dynamic'

// POST /api/teacher/message
// body: { courseId, teacherId, studentId, content }
export async function POST(req: NextRequest) {
  const { courseId, teacherId, studentId, content } = await req.json()
  if (!courseId || !teacherId || !studentId || !content) {
    return Response.json({ error: 'courseId, teacherId, studentId, content required' }, { status: 400 })
  }
  await db.teacherMessage.create({
    data: { courseId, teacherId, studentId, content },
  })
  return Response.json({ ok: true })
}
