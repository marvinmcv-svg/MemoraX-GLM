import { NextRequest } from 'next/server'
import { db } from '@/lib/db'
import { chatOnce } from '@/lib/ai'

export const dynamic = 'force-dynamic'

// POST /api/student/[studentId]/explain-3-ways
// body: { content } — the last tutor reply or a concept to re-explain
// Returns 3 alternative explanations: visual, analogy, step-by-step
export async function POST(req: NextRequest, { params }: { params: Promise<{ studentId: string }> }) {
  const { studentId } = await params
  const { content } = await req.json()
  if (!content || content.trim().length < 3) {
    return Response.json({ error: 'content required' }, { status: 400 })
  }

  const student = await db.user.findUnique({ where: { id: studentId } })
  const memories = await db.memory.findMany({
    where: { studentId },
    orderBy: { importance: 'desc' },
    take: 5,
  })
  const memoryHint = memories.find((m) => m.type === 'STUDY_TIP')?.content

  const prompt = `A student (${student?.name ?? 'student'}) asked you to re-explain this concept in 3 different ways:

CONCEPT:
${content.slice(0, 800)}

${memoryHint ? `Learning style hint: ${memoryHint}` : ''}

Return STRICT JSON only (no markdown fences):
{
  "visual": "A visual/spatial explanation — describe it as if drawing a diagram. Use shapes, positions, arrows. 2-3 sentences.",
  "analogy": "An everyday analogy the student would relate to. 2-3 sentences.",
  "stepByStep": "A numbered step-by-step breakdown. 3-5 short steps."
}
Keep each explanation concise and friendly. Use plain language.`

  const out = await chatOnce([
    { role: 'system', content: 'You re-explain concepts in multiple ways for different learning styles. Return JSON only.' },
    { role: 'user', content: prompt },
  ])

  let result = { visual: '', analogy: '', stepByStep: '' }
  const match = out.match(/\{[\s\S]*\}/)
  if (match) {
    try {
      result = JSON.parse(match[0])
    } catch {
      result = { visual: out.slice(0, 200), analogy: '', stepByStep: '' }
    }
  }

  return Response.json({ explanations: result })
}
