import { NextRequest } from 'next/server'
import { db } from '@/lib/db'

export const dynamic = 'force-dynamic'

// GET /api/parent/[parentId]/family
// Returns the family bundle: parents + students (with their progress summary)
export async function GET(_req: NextRequest, { params }: { params: Promise<{ parentId: string }> }) {
  const { parentId } = await params

  // 1. parent's family memberships (shallow)
  const memberships = await db.familyMember.findMany({
    where: { userId: parentId, role: 'PARENT' },
  })
  if (memberships.length === 0) return Response.json({ family: null })

  const familyId = memberships[0].familyId

  // 2. the family
  const family = await db.family.findUnique({ where: { id: familyId } })
  if (!family) return Response.json({ family: null })

  // 3. all members of this family
  const allMembers = await db.familyMember.findMany({ where: { familyId } })
  const memberUserIds = allMembers.map((m) => m.userId)
  const users = await db.user.findMany({ where: { id: { in: memberUserIds } } })
  const userMap = new Map(users.map((u) => [u.id, u]))

  const parentMembers = allMembers.filter((m) => m.role === 'PARENT')
  const studentMembers = allMembers.filter((m) => m.role === 'STUDENT')

  const parents = parentMembers
    .map((m) => userMap.get(m.userId))
    .filter(Boolean)
    .map((u) => ({ id: u!.id, name: u!.name, avatar: u!.avatar, email: u!.email }))

  // 4. per-student progress
  const studentSummaries = []
  for (const sm of studentMembers) {
    const s = userMap.get(sm.userId)
    if (!s) continue
    const enrollments = await db.enrollment.findMany({
      where: { studentId: s.id },
      include: { course: true },
    })
    const courseIds = enrollments.map((e) => e.courseId)
    const assignments = await db.assignment.findMany({
      where: { courseId: { in: courseIds } },
      include: { course: true, submissions: { where: { studentId: s.id } } },
      orderBy: { dueDate: 'asc' },
    })
    const now = new Date()
    let overdue = 0
    let dueSoon = 0
    let done = 0
    const upcoming: { title: string; course: string; due: string; daysUntilDue: number }[] = []
    for (const a of assignments) {
      const sub = a.submissions[0]
      const daysUntilDue = Math.ceil((a.dueDate.getTime() - now.getTime()) / 86400000)
      const status = sub?.status ?? 'NOT_STARTED'
      if (status === 'GRADED' || status === 'SUBMITTED') done++
      else if (daysUntilDue < 0) overdue++
      else if (daysUntilDue <= 3) dueSoon++
      if (daysUntilDue >= -1 && daysUntilDue <= 5 && status !== 'GRADED' && status !== 'SUBMITTED') {
        upcoming.push({
          title: a.title,
          course: a.course.name,
          due: a.dueDate.toISOString(),
          daysUntilDue,
        })
      }
    }
    studentSummaries.push({
      id: s.id,
      name: s.name,
      avatar: s.avatar,
      grade: s.grade,
      courses: enrollments.map((e) => e.course.name),
      stats: { total: assignments.length, overdue, dueSoon, done },
      upcoming: upcoming.slice(0, 4),
    })
  }

  return Response.json({
    family: {
      id: family.id,
      name: family.name,
      parents,
      students: studentSummaries,
    },
  })
}
