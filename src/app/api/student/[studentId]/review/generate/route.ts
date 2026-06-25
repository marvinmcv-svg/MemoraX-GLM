import { NextRequest } from 'next/server'
import { db } from '@/lib/db'
import { chatOnce } from '@/lib/ai'

export const dynamic = 'force-dynamic'

// POST /api/student/[studentId]/review/generate
// Generates review cards from the student's memory layer using the LLM.
// Each memory becomes a front/back card.
export async function POST(_req: NextRequest, { params }: { params: Promise<{ studentId: string }> }) {
  const { studentId } = await params
  const memories = await db.memory.findMany({
    where: { studentId, type: { in: ['CONCEPT', 'WEAK_AREA', 'HOMEWORK', 'STUDY_TIP'] } },
    orderBy: { importance: 'desc' },
    take: 12,
  })

  if (memories.length === 0) {
    return Response.json({ created: 0, message: 'No memories to make cards from yet. Chat with your tutor first!' })
  }

  // Build a single LLM call that turns memories into Q/A pairs
  const memoryList = memories.map((m, i) => `${i + 1}. [${m.type}] ${m.content}`).join('\n')
  const prompt = `You are creating spaced-repetition review flashcards for a student based on their memory layer.
Each memory should become ONE concise flashcard with a question (front) and answer (back).
Return STRICT JSON only (no markdown fences):
{"cards": [{"front": "short question", "back": "concise answer", "memoryIndex": <1-based number>}]}

Memories:
${memoryList}`

  const out = await chatOnce([
    { role: 'system', content: 'You generate educational flashcards. Return JSON only.' },
    { role: 'user', content: prompt },
  ])

  let cardsToCreate: { front: string; back: string; memoryId: string | null }[] = []
  const match = out.match(/\{[\s\S]*\}/)
  if (match) {
    try {
      const parsed = JSON.parse(match[0])
      if (Array.isArray(parsed.cards)) {
        cardsToCreate = parsed.cards
          .filter((c: any) => c.front && c.back)
          .map((c: any) => ({
            front: String(c.front).slice(0, 300),
            back: String(c.back).slice(0, 500),
            memoryId: c.memoryIndex ? memories[c.memoryIndex - 1]?.id ?? null : null,
          }))
      }
    } catch {
      /* fall through */
    }
  }

  if (cardsToCreate.length === 0) {
    // fallback: simple front/back from memory content
    cardsToCreate = memories.map((m) => ({
      front: `Recall: ${m.content.slice(0, 80)}…`,
      back: m.content,
      memoryId: m.id,
    }))
  }

  // dedupe: skip if a card with the same front already exists
  const existingFronts = new Set(
    (await db.reviewCard.findMany({ where: { studentId }, select: { front: true } })).map((c) => c.front)
  )
  const fresh = cardsToCreate.filter((c) => !existingFronts.has(c.front))

  if (fresh.length > 0) {
    await db.reviewCard.createMany({
      data: fresh.map((c) => ({
        studentId,
        memoryId: c.memoryId,
        front: c.front,
        back: c.back,
        dueDate: new Date(),
      })),
    })
  }

  return Response.json({ created: fresh.length, skipped: cardsToCreate.length - fresh.length })
}
