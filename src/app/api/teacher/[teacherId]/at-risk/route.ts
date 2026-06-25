import { NextRequest } from 'next/server'
import { db } from '@/lib/db'

export const dynamic = 'force-dynamic'

// GET /api/teacher/[teacherId]/at-risk
// Returns students flagged as at-risk across all the teacher's courses.
// At-risk = 3+ overdue OR frustration signals in last 7 days OR completion < 30%
export async function GET(_req: NextRequest, { params }: { params: Promise<{ teacherId: string }> }) {
  const { teacherId } = await params
  const courses = await db.course.findMany({ where: { teacherId }, select: { id: true, name: true } })
  const courseIds = courses.map((c) => c.id)
  if (courseIds.length === 0) return Response.json({ students: [] })

  const enrollments = await db.enrollment.findMany({
    where: { courseId: { in: courseIds } },
    include: { student: true, course: true },
  })

  const now = new Date()
  const sevenDaysAgo = new Date(now.getTime() - 7 * 86400000)

  const atRiskStudents = []
  for (const e of enrollments) {
    const subs = await db.submission.findMany({
      where: { studentId: e.studentId, assignment: { courseId: { in: courseIds } } },
      include: { assignment: true },
    })
    const totalAssignments = subs.length
    const overdue = subs.filter(
      (s) => s.assignment.dueDate < now && s.status !== 'GRADED' && s.status !== 'SUBMITTED'
    ).length
    const done = subs.filter((s) => s.status === 'GRADED' || s.status === 'SUBMITTED').length
    const completion = totalAssignments > 0 ? Math.round((done / totalAssignments) * 100) : 100

    const frustrationSignals = await db.reminder.count({
      where: { studentId: e.studentId, type: 'FRUSTRATION_SIGNAL', createdAt: { gte: sevenDaysAgo } },
    })

    const weakAreas = await db.memory.count({
      where: { studentId: e.studentId, type: 'WEAK_AREA' },
    })

    const reasons: string[] = []
    let riskLevel: 'high' | 'medium' | 'low' = 'low'
    if (overdue >= 3) {
      reasons.push(`${overdue} overdue assignments`)
      riskLevel = 'high'
    } else if (overdue >= 1) {
      reasons.push(`${overdue} overdue assignment${overdue > 1 ? 's' : ''}`)
      riskLevel = riskLevel === 'low' ? 'medium' : riskLevel
    }
    if (frustrationSignals > 0) {
      reasons.push(`${frustrationSignals} frustration signal${frustrationSignals > 1 ? 's' : ''} this week`)
      riskLevel = riskLevel === 'low' ? 'medium' : 'high'
    }
    if (completion < 30 && totalAssignments > 0) {
      reasons.push(`low completion (${completion}%)`)
      riskLevel = 'high'
    }
    if (weakAreas >= 3) {
      reasons.push(`${weakAreas} unresolved weak areas`)
    }

    if (reasons.length > 0) {
      atRiskStudents.push({
        id: e.student.id,
        name: e.student.name,
        avatar: e.student.avatar,
        grade: e.student.grade,
        courseName: e.course.name,
        courseId: e.course.id,
        riskLevel,
        reasons,
        stats: { totalAssignments, overdue, done, completion, frustrationSignals, weakAreas },
      })
    }
  }

  // sort by risk level (high first)
  const order = { high: 0, medium: 1, low: 2 }
  atRiskStudents.sort((a, b) => order[a.riskLevel as keyof typeof order] - order[b.riskLevel as keyof typeof order])

  return Response.json({ students: atRiskStudents })
}
