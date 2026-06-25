import { NextRequest } from 'next/server'
import { db } from '@/lib/db'

export const dynamic = 'force-dynamic'

// GET /api/teacher/course/[courseId]/insights
// Per-assignment insights: which assignments have the most stuck/not-started students.
export async function GET(_req: NextRequest, { params }: { params: Promise<{ courseId: string }> }) {
  const { courseId } = await params
  const course = await db.course.findUnique({
    where: { id: courseId },
    include: { enrollments: true, assignments: { orderBy: { dueDate: 'asc' } } },
  })
  if (!course) return Response.json({ insights: [] })

  const studentCount = course.enrollments.length
  const now = new Date()
  const insights = []

  for (const a of course.assignments) {
    const subs = await db.submission.findMany({
      where: { assignmentId: a.id },
    })
    const notStarted = subs.filter((s) => s.status === 'NOT_STARTED').length
    const inProgress = subs.filter((s) => s.status === 'IN_PROGRESS').length
    const submitted = subs.filter((s) => s.status === 'SUBMITTED').length
    const graded = subs.filter((s) => s.status === 'GRADED').length
    const stuckRate = studentCount > 0 ? Math.round(((notStarted + inProgress) / studentCount) * 100) : 0
    const daysUntilDue = Math.ceil((a.dueDate.getTime() - now.getTime()) / 86400000)

    insights.push({
      id: a.id,
      title: a.title,
      type: a.type,
      dueDate: a.dueDate.toISOString(),
      daysUntilDue,
      maxPoints: a.maxPoints,
      breakdown: { notStarted, inProgress, submitted, graded },
      stuckRate,
      flag:
        stuckRate >= 70 && daysUntilDue <= 3
          ? 'critical'
          : stuckRate >= 50 && daysUntilDue <= 5
          ? 'warning'
          : 'ok',
    })
  }

  return Response.json({
    insights,
    studentCount,
  })
}
