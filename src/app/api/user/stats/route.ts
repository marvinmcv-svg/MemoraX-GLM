import { NextRequest } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { db } from '@/lib/db'
import { levelFromXp, levelProgress } from '@/lib/gamify'
import { ACHIEVEMENTS } from '@/lib/gamify-catalog'

export const dynamic = 'force-dynamic'

const TIER_LIMITS = { FREE: { dailyChats: 20, monthlyScans: 3, voiceNotes: false, solutionMode: false, label: 'Starter' }, SCHOLAR: { dailyChats: -1, monthlyScans: 50, voiceNotes: true, solutionMode: true, label: 'Scholar' }, FAMILY: { dailyChats: -1, monthlyScans: -1, voiceNotes: true, solutionMode: true, label: 'Family' }, EDUCATOR: { dailyChats: -1, monthlyScans: -1, voiceNotes: true, solutionMode: true, label: 'Educator' } } as const

export async function GET(req: NextRequest) {
  const session = await getServerSession(authOptions)
  const url = new URL(req.url)
  const userIdParam = url.searchParams.get('userId')
  let userId: string | null = null
  if (session?.user) userId = (session.user as any).id
  else if (userIdParam && (process.env.NODE_ENV !== 'production')) userId = userIdParam
  if (!userId) return Response.json({ error: 'Unauthorized' }, { status: 401 })
  const user = await db.user.findUnique({ where: { id: userId }, select: { id: true, email: true, name: true, role: true, avatar: true, grade: true, subscriptionTier: true, createdAt: true } })
  if (!user) return Response.json({ error: 'Not found' }, { status: 404 })
  const [profile, achievements, chatCount, memoryCount, homeworkCount, reviewCount, examPlans, cosmetics, enrollments] = await Promise.all([
    db.studentProfile.findUnique({ where: { studentId: userId } }), db.achievement.findMany({ where: { studentId: userId } }),
    db.chatMessage.count({ where: { studentId: userId, role: 'user' } }), db.memory.count({ where: { studentId: userId } }),
    db.memory.count({ where: { studentId: userId, type: 'HOMEWORK' } }), db.reviewCard.count({ where: { studentId: userId } }),
    db.examPlan.count({ where: { studentId: userId } }), db.studentCosmetic.count({ where: { studentId: userId } }),
    db.enrollment.count({ where: { studentId: userId } }),
  ])
  const xp = profile?.xp ?? 0; const prog = levelProgress(xp)
  const unlockedKeys = new Set(achievements.map(a => a.key))
  return Response.json({ user: { ...user, createdAt: user.createdAt.toISOString() }, gamification: { xp, level: prog.level, levelProgress: prog, coins: profile?.coins ?? 0, streakDays: profile?.streakDays ?? 0, lastActive: profile?.lastActiveDate?.toISOString() ?? null }, usage: { chatMessages: chatCount, memories: memoryCount, homeworkScans: homeworkCount, reviewCards: reviewCount, examPlans, courses: enrollments }, achievements: { unlocked: achievements.length, total: ACHIEVEMENTS.length, list: ACHIEVEMENTS.map(a => ({ ...a, unlocked: unlockedKeys.has(a.key) })) }, cosmetics: { owned: cosmetics }, tier: { current: user.subscriptionTier, limits: TIER_LIMITS[user.subscriptionTier as keyof typeof TIER_LIMITS] ?? TIER_LIMITS.FREE } })
}
