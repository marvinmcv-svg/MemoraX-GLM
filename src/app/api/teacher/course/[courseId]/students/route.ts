import { NextRequest } from 'next/server'
import { db } from '@/lib/db'

export const dynamic = 'force-dynamic'

// GET /api/teacher/course/[courseId]/students — roster with progress per assignment
export async function GET(_req: NextRequest, { params }: { params: Promise<{ courseId: string }> }) {
  const { courseId } = await params
  const course = await db.course.findUnique({
    where: { id: courseId },
    include: {
      enrollments: { include: { student: true } },
      assignments: { orderBy: { dueDate: 'asc' } },
    },
  })
  if (!course) return Response.json({ students: [], course: null })

  const now = new Date()
  const students = []
  for (const e of course.enrollments) {
    const subs = await db.submission.findMany({
      where: { studentId: e.studentId, assignment: { courseId } },
    })
    const subMap = new Map(subs.map((s) => [s.assignmentId, s]))

    const assignmentProgress = course.assignments.map((a) => {
      const sub = subMap.get(a.id)
      const status = sub?.status ?? 'NOT_STARTED'
      const daysUntilDue = Math.ceil((a.dueDate.getTime() - now.getTime()) / 86400000)
      return {
        assignmentId: a.id,
        title: a.title,
        dueDate: a.dueDate.toISOString(),
        daysUntilDue,
        status,
        score: sub?.score ?? null,
        maxPoints: a.maxPoints,
      }
    })

    const done = assignmentProgress.filter((p) => p.status === 'GRADED' || p.status === 'SUBMITTED').length
    const overdue = assignmentProgress.filter((p) => p.daysUntilDue < 0 && p.status !== 'GRADED' && p.status !== 'SUBMITTED').length
    const inProgress = assignmentProgress.filter((p) => p.status === 'IN_PROGRESS').length

    // recent memories for this student in this course's subject
    const memories = await db.memory.findMany({
      where: { studentId: e.studentId },
      orderBy: { createdAt: 'desc' },
      take: 4,
    })

    students.push({
      id: e.student.id,
      name: e.student.name,
      avatar: e.student.avatar,
      grade: e.student.grade,
      stats: {
        total: course.assignments.length,
        done,
        inProgress,
        overdue,
        completion: course.assignments.length ? Math.round((done / course.assignments.length) * 100) : 0,
      },
      assignments: assignmentProgress,
      recentMemories: memories.map((m) => ({ type: m.type, content: m.content, tags: m.tags })),
    })
  }

  return Response.json({
    course: {
      id: course.id,
      name: course.name,
      subject: course.subject,
      color: course.color,
      room: course.room,
    },
    students,
  })
}
