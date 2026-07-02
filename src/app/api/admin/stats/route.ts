import { NextResponse } from 'next/server'
import { db } from '@/lib/db'
import { requireAdmin } from '@/lib/auth'

export const dynamic = 'force-dynamic'

/**
 * GET /api/admin/stats — high-level platform counts.
 * Returns: { users, students, parents, teachers, admins, courses, assignments,
 *            submissions, memories, chats, reminders, families, activeStudents }
 * (activeStudents = students with at least one chat message OR submission in the last 7 days)
 */
export async function GET() {
  const guard = await requireAdmin()
  if (!guard.ok) return guard.response

  try {
    const [
      users,
      students,
      parents,
      teachers,
      admins,
      courses,
      assignments,
      submissions,
      memories,
      chats,
      reminders,
      families,
    ] = await Promise.all([
      db.user.count(),
      db.user.count({ where: { role: 'STUDENT' } }),
      db.user.count({ where: { role: 'PARENT' } }),
      db.user.count({ where: { role: 'TEACHER' } }),
      db.user.count({ where: { role: 'ADMIN' } }),
      db.course.count(),
      db.assignment.count(),
      db.submission.count(),
      db.memory.count(),
      db.chatMessage.count(),
      db.reminder.count(),
      db.family.count(),
    ])

    const sevenDaysAgo = new Date(Date.now() - 7 * 86400000)
    const [activeChats, activeSubs] = await Promise.all([
      db.chatMessage.findMany({
        where: { createdAt: { gte: sevenDaysAgo } },
        select: { studentId: true },
        distinct: ['studentId'],
      }),
      db.submission.findMany({
        where: { updatedAt: { gte: sevenDaysAgo } },
        select: { studentId: true },
        distinct: ['studentId'],
      }),
    ])
    const activeIds = new Set<string>([
      ...activeChats.map((c) => c.studentId),
      ...activeSubs.map((s) => s.studentId),
    ])

    return NextResponse.json({
      users,
      students,
      parents,
      teachers,
      admins,
      courses,
      assignments,
      submissions,
      memories,
      chats,
      reminders,
      families,
      activeStudents: activeIds.size,
    })
  } catch (e: any) {
    return NextResponse.json(
      { error: e?.message ?? 'unknown' },
      { status: 500 }
    )
  }
}
