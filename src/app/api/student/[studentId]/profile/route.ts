import { NextRequest } from 'next/server'
import { db } from '@/lib/db'
import { getOrCreateProfile, levelProgress, COSMETICS, ACHIEVEMENTS } from '@/lib/gamify'

export const dynamic = 'force-dynamic'

// GET /api/student/[studentId]/profile — full gamification profile
export async function GET(_req: NextRequest, { params }: { params: Promise<{ studentId: string }> }) {
  const { studentId } = await params
  const profile = await getOrCreateProfile(studentId)
  const [ownedCosmetics, achievements, reviewDueCount, examPlanCount, conceptsMastered] = await Promise.all([
    db.studentCosmetic.findMany({ where: { studentId } }),
    db.achievement.findMany({ where: { studentId } }),
    db.reviewCard.count({ where: { studentId, dueDate: { lte: new Date() } } }),
    db.examPlan.count({ where: { studentId } }),
    db.memory.count({ where: { studentId, type: 'CONCEPT', importance: { gte: 4 } } }),
  ])

  const ownedIds = new Set(ownedCosmetics.map((c) => c.cosmeticId))
  const prog = levelProgress(profile.xp)

  return Response.json({
    profile: {
      xp: profile.xp,
      level: prog.level,
      levelProgress: prog,
      coins: profile.coins,
      streakDays: profile.streakDays,
      lastActiveDate: profile.lastActiveDate?.toISOString() ?? null,
      totalChats: profile.totalChats,
      totalHomework: profile.totalHomework,
      totalReviews: profile.totalReviews,
      reviewDueCount,
      examPlanCount,
      conceptsMastered,
    },
    avatar: {
      scene: profile.scene,
      character: profile.character,
      pet: profile.pet,
      accessory: profile.accessory,
    },
    ownedCosmeticIds: Array.from(ownedIds),
    achievements: achievements.map((a) => ({
      key: a.key,
      unlockedAt: a.unlockedAt.toISOString(),
      def: ACHIEVEMENTS.find((d) => d.key === a.key),
    })),
    catalog: COSMETICS,
    achievementDefs: ACHIEVEMENTS,
  })
}
