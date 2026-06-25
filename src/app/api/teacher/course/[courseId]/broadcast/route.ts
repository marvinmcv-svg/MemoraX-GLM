import { NextRequest } from 'next/server'
import { db } from '@/lib/db'

export const dynamic = 'force-dynamic'

// POST /api/teacher/course/[courseId]/broadcast
// body: { content } — posts an announcement + sends a TeacherMessage to every enrolled student
export async function POST(req: NextRequest, { params }: { params: Promise<{ courseId: string }> }) {
  const { courseId } = await params
  const { content } = await req.json()
  if (!content?.trim()) return Response.json({ error: 'content required' }, { status: 400 })

  const course = await db.course.findUnique({
    where: { id: courseId },
    include: { enrollments: true },
  })
  if (!course) return Response.json({ error: 'course not found' }, { status: 404 })

  // save the announcement
  await db.announcement.create({
    data: { courseId, teacherId: course.teacherId, content: content.trim() },
  })

  // send a TeacherMessage to every enrolled student (so it lands in their chat)
  if (course.enrollments.length > 0) {
    await db.teacherMessage.createMany({
      data: course.enrollments.map((e) => ({
        courseId,
        teacherId: course.teacherId,
        studentId: e.studentId,
        content: `📢 Announcement from ${course.name}: ${content.trim()}`,
      })),
    })
  }

  return Response.json({ ok: true, recipients: course.enrollments.length })
}
