import { NextRequest } from 'next/server'
import { db } from '@/lib/db'
import { levelProgress } from '@/lib/gamify'
import { ACHIEVEMENTS } from '@/lib/gamify-catalog'

export const dynamic = 'force-dynamic'

// GET /api/parent/[parentId]/insights
// Returns per-student gamification insights + sibling comparison + mood signals + recent wins
export async function GET(_req: NextRequest, { params }: { params: Promise<{ parentId: string }> }) {
  const { parentId } = await params

  const memberships = await db.familyMember.findMany({
    where: { userId: parentId, role: 'PARENT' },
  })
  if (memberships.length === 0) return Response.json({ students: [] })

  const familyId = memberships[0].familyId
  const allMembers = await db.familyMember.findMany({ where: { familyId } })
  const studentMembers = allMembers.filter((m) => m.role === 'STUDENT')
  const studentIds = studentMembers.map((m) => m.userId)
  const students = await db.user.findMany({ where: { id: { in: studentIds } } })
  const studentMap = new Map(students.map((s) => [s.id, s]))

  const studentInsights = []
  for (const sm of studentMembers) {
    const s = studentMap.get(sm.userId)
    if (!s) continue

    const profile = await db.studentProfile.findUnique({ where: { studentId: s.id } })
    const achievements = await db.achievement.findMany({ where: { studentId: s.id } })
    const cosmetics = await db.studentCosmetic.count({ where: { studentId: s.id } })
    const recentChats = await db.chatMessage.findMany({
      where: { studentId: s.id, role: 'user' },
      orderBy: { createdAt: 'desc' },
      take: 8,
      select: { content: true, createdAt: true },
    })
    const frustrationSignals = await db.reminder.count({
      where: { studentId: s.id, type: 'FRUSTRATION_SIGNAL' },
    })
    const recentCelebrations = await db.reminder.findMany({
      where: { studentId: s.id, type: 'CELEBRATION' },
      orderBy: { createdAt: 'desc' },
      take: 3,
    })

    const xp = profile?.xp ?? 0
    const prog = levelProgress(xp)

    // derive "recent topics" from chat (privacy-respecting: just keywords, not full transcript)
    const topics = deriveTopics(recentChats.map((c) => c.content))

    studentInsights.push({
      id: s.id,
      name: s.name,
      avatar: s.avatar,
      grade: s.grade,
      gamification: {
        xp,
        level: prog.level,
        levelProgress: prog,
        coins: profile?.coins ?? 0,
        streakDays: profile?.streakDays ?? 0,
        totalChats: profile?.totalChats ?? 0,
        totalHomework: profile?.totalHomework ?? 0,
        totalReviews: profile?.totalReviews ?? 0,
        cosmeticsOwned: cosmetics,
        achievementsCount: achievements.length,
        recentAchievements: achievements
          .slice(-3)
          .reverse()
          .map((a) => ({
            key: a.key,
            def: ACHIEVEMENTS.find((d) => d.key === a.key),
            unlockedAt: a.unlockedAt.toISOString(),
          })),
      },
      avatarConfig: {
        scene: profile?.scene ?? 'bedroom',
        character: profile?.character ?? 'student',
        pet: profile?.pet ?? 'none',
        accessory: profile?.accessory ?? 'none_acc',
      },
      mood: {
        frustrationSignals,
        recentTopics: topics,
      },
      recentCelebrations: recentCelebrations.map((c) => ({
        id: c.id,
        title: c.title,
        body: c.body,
        createdAt: c.createdAt.toISOString(),
        readAt: c.readAt?.toISOString() ?? null,
      })),
      focusAreas: profile?.focusAreas ?? null,
      studyHours: profile?.studyHours ? JSON.parse(profile.studyHours) : null,
    })
  }

  // Sibling comparison: compare students on a level-adjusted basis
  const siblingComparison = computeSiblingComparison(studentInsights)

  return Response.json({ students: studentInsights, siblingComparison })
}

function deriveTopics(messages: string[]): string[] {
  const topics: Record<string, number> = {}
  const subjectKeywords: Record<string, string[]> = {
    math: ['math', 'algebra', 'equation', 'fraction', 'calculus', 'geometry', 'quadratic', 'factor'],
    science: ['science', 'biology', 'chemistry', 'physics', 'cell', 'mitosis', 'force', 'energy'],
    history: ['history', 'essay', 'revolution', 'war', 'ancient', 'government'],
    english: ['english', 'essay', 'reading', 'grammar', 'writing', 'poem'],
  }
  for (const msg of messages) {
    const lower = msg.toLowerCase()
    for (const [subject, kws] of Object.entries(subjectKeywords)) {
      if (kws.some((k) => lower.includes(k))) {
        topics[subject] = (topics[subject] ?? 0) + 1
      }
    }
  }
  return Object.entries(topics)
    .sort((a, b) => b[1] - a[1])
    .slice(0, 3)
    .map(([s]) => s)
}

function computeSiblingComparison(students: any[]): any[] {
  if (students.length < 2) return []
  const comparisons = []
  for (let i = 0; i < students.length; i++) {
    for (let j = i + 1; j < students.length; j++) {
      const a = students[i]
      const b = students[j]
      // compare XP, streak, reviews, achievements
      const comparisons_a_b: string[] = []
      if (a.gamification.xp > b.gamification.xp) {
        comparisons_a_b.push(`${a.name} is ahead on XP (${a.gamification.xp} vs ${b.gamification.xp})`)
      } else if (b.gamification.xp > a.gamification.xp) {
        comparisons_a_b.push(`${b.name} is ahead on XP (${b.gamification.xp} vs ${a.gamification.xp})`)
      }
      if (a.gamification.streakDays > b.gamification.streakDays) {
        comparisons_a_b.push(`${a.name} has a longer streak (${a.gamification.streakDays}d vs ${b.gamification.streakDays}d)`)
      } else if (b.gamification.streakDays > a.gamification.streakDays) {
        comparisons_a_b.push(`${b.name} has a longer streak (${b.gamification.streakDays}d vs ${a.gamification.streakDays}d)`)
      }
      // note: different grades, so compare "at the same stage" framing
      const gradeNote =
        a.grade && b.grade && a.grade !== b.grade
          ? ` (Different grades — ${a.name} is in ${a.grade}, ${b.name} in ${b.grade}.)`
          : ''
      comparisons.push({
        students: [a.name, b.name],
        notes: comparisons_a_b,
        gradeNote,
      })
    }
  }
  return comparisons
}
