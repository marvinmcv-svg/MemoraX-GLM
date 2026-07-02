import { NextRequest } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { db } from '@/lib/db'
import { levelFromXp } from '@/lib/gamify'

export const dynamic = 'force-dynamic'

export async function GET(_req: NextRequest) {
  const session = await getServerSession(authOptions)
  if (!session || (session.user as any)?.role !== 'ADMIN') return Response.json({ error: 'Unauthorized' }, { status: 403 })
  const users = await db.user.findMany({ select: { id: true, email: true, name: true, role: true, avatar: true, grade: true, status: true, subscriptionTier: true, createdAt: true }, orderBy: { createdAt: 'desc' }, take: 100 })
  const statsPromises = users.map(async (u) => {
    const [profile, chatCount, memoryCount, homeworkCount, reviewCount, examPlanCount, achievementCount, cosmeticCount, courseCount, enrollmentCount] = await Promise.all([
      db.studentProfile.findUnique({ where: { studentId: u.id } }),
      db.chatMessage.count({ where: { studentId: u.id, role: 'user' } }),
      db.memory.count({ where: { studentId: u.id } }),
      db.memory.count({ where: { studentId: u.id, type: 'HOMEWORK' } }),
      db.reviewCard.count({ where: { studentId: u.id } }),
      db.examPlan.count({ where: { studentId: u.id } }),
      db.achievement.count({ where: { studentId: u.id } }),
      db.studentCosmetic.count({ where: { studentId: u.id } }),
      db.course.count({ where: { teacherId: u.id } }),
      db.enrollment.count({ where: { studentId: u.id } }),
    ])
    const xp = profile?.xp ?? 0
    return { ...u, createdAt: u.createdAt.toISOString(), gamification: u.role === 'STUDENT' ? { xp, level: levelFromXp(xp), coins: profile?.coins ?? 0, streakDays: profile?.streakDays ?? 0, totalChats: profile?.totalChats ?? 0, totalHomework: profile?.totalHomework ?? 0, totalReviews: profile?.totalReviews ?? 0, achievements: achievementCount, cosmetics: cosmeticCount, lastActive: profile?.lastActiveDate?.toISOString() ?? null } : null, usage: { chatMessages: chatCount, memories: memoryCount, homeworkScans: homeworkCount, reviewCards: reviewCount, examPlans: examPlanCount, courses: u.role === 'TEACHER' ? courseCount : enrollmentCount } }
  })
  const usersWithStats = await Promise.all(statsPromises)
  const totals = {
    users: users.length, students: users.filter(u => u.role === 'STUDENT').length, parents: users.filter(u => u.role === 'PARENT').length, teachers: users.filter(u => u.role === 'TEACHER').length,
    activeToday: usersWithStats.filter(u => { if (!u.gamification?.lastActive) return false; return new Date(u.gamification.lastActive) > new Date(Date.now() - 86400000) }).length,
    totalChats: usersWithStats.reduce((s, u) => s + (u.usage.chatMessages || 0), 0), totalHomework: usersWithStats.reduce((s, u) => s + (u.usage.homeworkScans || 0), 0),
    byTier: { FREE: users.filter(u => u.subscriptionTier === 'FREE').length, SCHOLAR: users.filter(u => u.subscriptionTier === 'SCHOLAR').length, FAMILY: users.filter(u => u.subscriptionTier === 'FAMILY').length, EDUCATOR: users.filter(u => u.subscriptionTier === 'EDUCATOR').length },
  }
  return Response.json({ users: usersWithStats, totals })
}
