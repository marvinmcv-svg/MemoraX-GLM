import { NextRequest } from 'next/server'
import { db } from '@/lib/db'
import { awardXp, incrementCounter, notifyFamilyOfCelebration } from '@/lib/gamify'

export const dynamic = 'force-dynamic'

// POST /api/student/[studentId]/review/answer
// body: { cardId, quality }  quality: 0=again, 1=hard, 2=good, 3=easy
// SM-2 lite scheduling + XP award
export async function POST(req: NextRequest, { params }: { params: Promise<{ studentId: string }> }) {
  const { studentId } = await params
  const { cardId, quality } = await req.json()
  if (!cardId || quality === undefined) {
    return Response.json({ error: 'cardId and quality required' }, { status: 400 })
  }
  const q = Math.max(0, Math.min(3, Number(quality)))
  const card = await db.reviewCard.findUnique({ where: { id: cardId } })
  if (!card || card.studentId !== studentId) {
    return Response.json({ error: 'card not found' }, { status: 404 })
  }

  // SM-2 lite
  let ease = card.ease
  let interval: number
  let repetitions: number
  if (q === 0) {
    // again — reset
    repetitions = 0
    interval = 1 // review again tomorrow (well, today+1 day)
    ease = Math.max(1.3, ease - 0.2)
  } else {
    repetitions = card.repetitions + 1
    if (repetitions === 1) interval = 1
    else if (repetitions === 2) interval = 3
    else interval = Math.round(card.interval * ease)
    ease = ease + (q === 3 ? 0.15 : q === 2 ? 0 : -0.15)
    ease = Math.max(1.3, Math.min(2.8, ease))
  }

  const dueDate = new Date()
  dueDate.setDate(dueDate.getDate() + interval)

  const updated = await db.reviewCard.update({
    where: { id: cardId },
    data: { ease, interval, repetitions, dueDate },
  })

  // XP: +5 for hard/again, +10 good, +15 easy
  const xp = q === 0 ? 5 : q === 1 ? 5 : q === 2 ? 10 : 15
  await incrementCounter(studentId, 'totalReviews')
  const award = await awardXp(studentId, xp, { coins: 1, reason: 'review' })

  // notify family of any celebrations (non-blocking)
  notifyFamilyOfCelebration(studentId, award).catch(() => {})

  return Response.json({
    ok: true,
    card: { id: updated.id, interval: updated.interval, repetitions: updated.repetitions, dueDate: updated.dueDate.toISOString() },
    award: { xp: award.xp, level: award.level, leveledUp: award.leveledUp, newAchievements: award.unlockedAchievements },
  })
}
