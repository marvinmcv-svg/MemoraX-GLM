import { NextRequest } from 'next/server'
import { db } from '@/lib/db'

export const dynamic = 'force-dynamic'

// GET /api/parent/[parentId]/reminders
// Returns all reminders for the family this parent belongs to, joined with student info.
export async function GET(_req: NextRequest, { params }: { params: Promise<{ parentId: string }> }) {
  const { parentId } = await params

  // find families this parent is in
  const memberships = await db.familyMember.findMany({
    where: { userId: parentId, role: 'PARENT' },
    include: { family: { include: { members: true } } },
  })

  const familyIds = memberships.map((m) => m.familyId)
  if (familyIds.length === 0) return Response.json({ reminders: [] })

  const reminders = await db.reminder.findMany({
    where: { familyId: { in: familyIds } },
    orderBy: [{ sentAt: 'desc' }, { scheduledFor: 'desc' }],
  })

  // attach student info
  const studentIds = [...new Set(reminders.map((r) => r.studentId))]
  const students = await db.user.findMany({ where: { id: { in: studentIds } } })
  const studentMap = new Map(students.map((s) => [s.id, s]))

  const result = reminders.map((r) => {
    const s = studentMap.get(r.studentId)
    return {
      id: r.id,
      studentId: r.studentId,
      studentName: s?.name ?? 'Student',
      studentAvatar: s?.avatar ?? null,
      type: r.type,
      title: r.title,
      body: r.body,
      scheduledFor: r.scheduledFor.toISOString(),
      sentAt: r.sentAt?.toISOString() ?? null,
      readAt: r.readAt?.toISOString() ?? null,
      createdAt: r.createdAt.toISOString(),
    }
  })

  return Response.json({ reminders: result })
}
