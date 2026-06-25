import { NextRequest } from 'next/server'
import { db } from '@/lib/db'

export const dynamic = 'force-dynamic'

// GET /api/teacher/[teacherId]/messages — all messages sent by this teacher, newest first
export async function GET(_req: NextRequest, { params }: { params: Promise<{ teacherId: string }> }) {
  const { teacherId } = await params
  const msgs = await db.teacherMessage.findMany({
    where: { teacherId },
    include: { student: true },
    orderBy: { createdAt: 'desc' },
  })

  // fetch course names separately (avoids deep include issues)
  const courseIds = [...new Set(msgs.map((m) => m.courseId))]
  const courses = await db.course.findMany({ where: { id: { in: courseIds } } })
  const courseMap = new Map(courses.map((c) => [c.id, c.name]))

  const result = msgs.map((m) => ({
    id: m.id,
    courseId: m.courseId,
    courseName: courseMap.get(m.courseId) ?? 'Class',
    studentId: m.studentId,
    studentName: m.student.name,
    studentAvatar: m.student.avatar,
    studentGrade: m.student.grade,
    content: m.content,
    readAt: m.readAt?.toISOString() ?? null,
    createdAt: m.createdAt.toISOString(),
  }))
  return Response.json({ messages: result })
}
