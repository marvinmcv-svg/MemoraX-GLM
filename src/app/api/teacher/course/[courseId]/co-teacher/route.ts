import { NextRequest } from 'next/server'
import { db } from '@/lib/db'

export const dynamic = 'force-dynamic'

// POST /api/teacher/course/[courseId]/co-teacher
// body: { coTeacherId } — assign a co-teacher to a course
export async function POST(req: NextRequest, { params }: { params: Promise<{ courseId: string }> }) {
  const { courseId } = await params
  const { coTeacherId } = await req.json()
  if (!coTeacherId) return Response.json({ error: 'coTeacherId required' }, { status: 400 })

  const coTeacher = await db.user.findUnique({ where: { id: coTeacherId, role: 'TEACHER' } })
  if (!coTeacher) return Response.json({ error: 'teacher not found' }, { status: 404 })

  const course = await db.course.update({
    where: { id: courseId },
    data: { coTeacherId },
  })
  return Response.json({
    ok: true,
    coTeacher: { id: coTeacher.id, name: coTeacher.name, avatar: coTeacher.avatar },
  })
}

// DELETE — remove co-teacher
export async function DELETE(_req: NextRequest, { params }: { params: Promise<{ courseId: string }> }) {
  const { courseId } = await params
  await db.course.update({
    where: { id: courseId },
    data: { coTeacherId: null },
  })
  return Response.json({ ok: true })
}
