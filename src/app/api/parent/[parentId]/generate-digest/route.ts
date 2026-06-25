import { NextRequest } from 'next/server'
import { db } from '@/lib/db'

export const dynamic = 'force-dynamic'

// POST /api/parent/[parentId]/generate-digest
// Computes a fresh 7PM daily digest for every student in the parent's family and stores it.
export async function POST(_req: NextRequest, { params }: { params: Promise<{ parentId: string }> }) {
  const { parentId } = await params

  const memberships = await db.familyMember.findMany({
    where: { userId: parentId, role: 'PARENT' },
    include: { family: { include: { members: true } } },
  })
  if (memberships.length === 0) return Response.json({ created: 0 })

  const family = memberships[0].family
  const students = family.members.filter((m) => m.role === 'STUDENT')

  const now = new Date()
  // 7 PM today in local time
  const scheduledFor = new Date(now)
  scheduledFor.setHours(19, 0, 0, 0)
  if (scheduledFor < now) scheduledFor.setDate(scheduledFor.getDate() + 1)

  let created = 0
  for (const sm of students) {
    const s = await db.user.findUnique({ where: { id: sm.userId } })
    if (!s) continue
    const enrollments = await db.enrollment.findMany({
      where: { studentId: s.id },
      include: { course: true },
    })
    const courseIds = enrollments.map((e) => e.courseId)
    const assignments = await db.assignment.findMany({
      where: { courseId: { in: courseIds } },
      include: { submissions: { where: { studentId: s.id } } },
      orderBy: { dueDate: 'asc' },
    })

    const lines: string[] = []
    let overdueCount = 0
    for (const a of assignments) {
      const sub = a.submissions[0]
      const status = sub?.status ?? 'NOT_STARTED'
      const daysUntilDue = Math.ceil((a.dueDate.getTime() - now.getTime()) / 86400000)
      if (status === 'GRADED' || status === 'SUBMITTED') continue
      if (daysUntilDue < 0) {
        overdueCount++
        lines.push(`• ⚠️ OVERDUE: ${a.title} (${a.course.name})`)
      } else if (daysUntilDue <= 7) {
        const when = daysUntilDue === 0 ? 'TODAY' : daysUntilDue === 1 ? 'tomorrow' : `in ${daysUntilDue}d`
        lines.push(`• ${a.title} (${a.course.name}) — due ${when}, ${status.replace('_', ' ').toLowerCase()}`)
      }
    }

    const body =
      lines.length === 0
        ? `${s.name} is all caught up — no assignments due this week. 🎉`
        : `${s.name} has ${lines.length} assignment${lines.length > 1 ? 's' : ''} due this week:\n\n${lines.join('\n')}` +
          (overdueCount > 0 ? `\n\n⚠️ ${overdueCount} overdue — might need a nudge.` : '')

    await db.reminder.create({
      data: {
        studentId: s.id,
        familyId: family.id,
        type: 'DAILY_DIGEST',
        title: `📚 ${s.name}'s homework digest — 7:00 PM`,
        body,
        scheduledFor,
        sentAt: now,
      },
    })
    created++
  }

  return Response.json({ created, familyName: family.name })
}
