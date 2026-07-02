import { NextRequest } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { db } from '@/lib/db'

export const dynamic = 'force-dynamic'

// GET /api/user/data-export — export all user data as JSON (GDPR right to data portability)
export async function GET(req: NextRequest) {
  const session = await getServerSession(authOptions)
  const url = new URL(req.url)
  const userIdParam = url.searchParams.get('userId')
  let userId: string | null = null
  if (session?.user) userId = (session.user as any).id
  else if (userIdParam) userId = userIdParam
  if (!userId) return Response.json({ error: 'Unauthorized' }, { status: 401 })

  const [user, profile, chatMessages, memories, achievements, cosmetics, reviewCards, examPlans, submissions, enrollments] = await Promise.all([
    db.user.findUnique({ where: { id: userId }, select: { id: true, email: true, name: true, role: true, grade: true, subscriptionTier: true, createdAt: true } }),
    db.studentProfile.findUnique({ where: { studentId: userId } }),
    db.chatMessage.findMany({ where: { studentId: userId }, orderBy: { createdAt: 'asc' } }),
    db.memory.findMany({ where: { studentId: userId } }),
    db.achievement.findMany({ where: { studentId: userId } }),
    db.studentCosmetic.findMany({ where: { studentId: userId } }),
    db.reviewCard.findMany({ where: { studentId: userId } }),
    db.examPlan.findMany({ where: { studentId: userId } }),
    db.submission.findMany({ where: { studentId: userId }, include: { assignment: true } }),
    db.enrollment.findMany({ where: { studentId: userId }, include: { course: true } }),
  ])

  return Response.json({
    exportedAt: new Date().toISOString(),
    user, profile,
    chatMessages: chatMessages.map(m => ({ ...m, imageUrl: m.imageUrl ? '[image data omitted]' : null })),
    memories, achievements, cosmetics, reviewCards, examPlans, submissions, enrollments,
  })
}

// DELETE /api/user/data-export — delete user account and all data (GDPR right to erasure)
export async function DELETE(req: NextRequest) {
  const session = await getServerSession(authOptions)
  const url = new URL(req.url)
  const userIdParam = url.searchParams.get('userId')
  let userId: string | null = null
  if (session?.user) userId = (session.user as any).id
  else if (userIdParam) userId = userIdParam
  if (!userId) return Response.json({ error: 'Unauthorized' }, { status: 401 })

  // Cascade delete will handle all related data
  await db.user.delete({ where: { id: userId } })
  return Response.json({ ok: true, message: 'Account and all data deleted' })
}
