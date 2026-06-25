import { NextRequest } from 'next/server'
import { db } from '@/lib/db'

export const dynamic = 'force-dynamic'

// GET /api/student/[studentId]/assignments
export async function GET(_req: NextRequest, { params }: { params: Promise<{ studentId: string }> }) {
  const { studentId } = await params
  const now = new Date()

  const enrollments = await db.enrollment.findMany({
    where: { studentId },
    include: { course: { include: { teacher: true } } },
  })

  const courseIds = enrollments.map((e) => e.courseId)

  const assignments = await db.assignment.findMany({
    where: { courseId: { in: courseIds } },
    include: {
      course: true,
      submissions: { where: { studentId } },
    },
    orderBy: { dueDate: 'asc' },
  })

  const result = assignments.map((a) => {
    const sub = a.submissions[0]
    const due = a.dueDate
    const daysUntilDue = Math.ceil((due.getTime() - now.getTime()) / 86400000)
    return {
      id: a.id,
      courseId: a.courseId,
      courseName: a.course.name,
      courseColor: a.course.color,
      title: a.title,
      description: a.description,
      dueDate: due.toISOString(),
      maxPoints: a.maxPoints,
      type: a.type,
      status: sub?.status ?? 'NOT_STARTED',
      score: sub?.score ?? null,
      daysUntilDue,
    }
  })

  return Response.json({ assignments: result })
}
