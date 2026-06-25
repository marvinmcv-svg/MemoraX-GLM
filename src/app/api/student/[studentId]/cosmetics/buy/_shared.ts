import { db } from '@/lib/db'
import { ACHIEVEMENTS, type AchievementContext } from '@/lib/gamify'

// shared between routes that need to check achievements without awarding XP
export async function checkAchievementsSync(studentId: string, ctx: AchievementContext) {
  const existing = await db.achievement.findMany({ where: { studentId } })
  const existingKeys = new Set(existing.map((a) => a.key))
  const newlyUnlocked = []
  for (const def of ACHIEVEMENTS) {
    if (existingKeys.has(def.key)) continue
    if (def.check(ctx)) {
      await db.achievement.upsert({
        where: { studentId_key: { studentId, key: def.key } },
        update: {},
        create: { studentId, key: def.key },
      })
      await db.studentProfile.update({
        where: { studentId },
        data: { coins: { increment: def.coinReward } },
      })
      newlyUnlocked.push(def)
    }
  }
  return newlyUnlocked
}
