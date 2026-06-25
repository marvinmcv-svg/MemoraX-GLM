import { NextRequest } from 'next/server'
import { db } from '@/lib/db'
import { COSMETICS, getOrCreateProfile, levelFromXp } from '@/lib/gamify'
import { checkAchievementsSync } from './_shared'

export const dynamic = 'force-dynamic'

// POST /api/student/[studentId]/cosmetics/buy
// body: { cosmeticId }
export async function POST(req: NextRequest, { params }: { params: Promise<{ studentId: string }> }) {
  const { studentId } = await params
  const { cosmeticId } = await req.json()
  const cosmetic = COSMETICS.find((c) => c.id === cosmeticId)
  if (!cosmetic) {
    return Response.json({ error: 'cosmetic not found' }, { status: 404 })
  }

  const profile = await getOrCreateProfile(studentId)
  const alreadyOwned = await db.studentCosmetic.findUnique({
    where: { studentId_cosmeticId: { studentId, cosmeticId } },
  })
  if (alreadyOwned) {
    return Response.json({ error: 'already owned', owned: true }, { status: 409 })
  }

  const level = levelFromXp(profile.xp)
  if (level < cosmetic.levelReq) {
    return Response.json({ error: `Reach level ${cosmetic.levelReq} to unlock this`, levelReq: cosmetic.levelReq }, { status: 403 })
  }
  if (profile.coins < cosmetic.cost) {
    return Response.json({ error: `Not enough coins (need ${cosmetic.cost}, have ${profile.coins})` }, { status: 403 })
  }

  // deduct coins + grant cosmetic
  const [updated] = await Promise.all([
    db.studentProfile.update({
      where: { studentId },
      data: { coins: { decrement: cosmetic.cost } },
    }),
    db.studentCosmetic.create({ data: { studentId, cosmeticId } }),
  ])

  // check fresh_fit / collector achievements
  const cosmeticsOwned = await db.studentCosmetic.count({ where: { studentId } })
  await checkAchievementsSync(studentId, {
    xp: updated.xp,
    level: levelFromXp(updated.xp),
    totalChats: updated.totalChats,
    totalHomework: updated.totalHomework,
    totalReviews: updated.totalReviews,
    streakDays: updated.streakDays,
    cosmeticsOwned,
    examPlans: await db.examPlan.count({ where: { studentId } }),
    conceptsMastered: await db.memory.count({ where: { studentId, type: 'CONCEPT', importance: { gte: 4 } } }),
  })

  return Response.json({ ok: true, coins: updated.coins, cosmetic })
}
