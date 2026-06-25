import { NextRequest } from 'next/server'
import { db } from '@/lib/db'

export const dynamic = 'force-dynamic'

// GET /api/student/[studentId]/review — due cards (dueDate <= now)
export async function GET(_req: NextRequest, { params }: { params: Promise<{ studentId: string }> }) {
  const { studentId } = await params
  const cards = await db.reviewCard.findMany({
    where: { studentId, dueDate: { lte: new Date() } },
    orderBy: { dueDate: 'asc' },
  })
  const totalCards = await db.reviewCard.count({ where: { studentId } })
  return Response.json({
    due: cards.map((c) => ({
      id: c.id,
      front: c.front,
      back: c.back,
      memoryId: c.memoryId,
      repetitions: c.repetitions,
      ease: c.ease,
      interval: c.interval,
    })),
    totalCards,
  })
}
