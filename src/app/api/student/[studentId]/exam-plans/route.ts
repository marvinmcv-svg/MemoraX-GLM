import { NextRequest } from 'next/server'
import { db } from '@/lib/db'
import { chatOnce } from '@/lib/ai'
import { awardXp } from '@/lib/gamify'

export const dynamic = 'force-dynamic'

// GET /api/student/[studentId]/exam-plans
export async function GET(_req: NextRequest, { params }: { params: Promise<{ studentId: string }> }) {
  const { studentId } = await params
  const plans = await db.examPlan.findMany({
    where: { studentId },
    orderBy: { createdAt: 'desc' },
  })
  return Response.json({
    plans: plans.map((p) => ({
      id: p.id,
      title: p.title,
      examDate: p.examDate.toISOString(),
      plan: JSON.parse(p.generatedPlan),
      createdAt: p.createdAt.toISOString(),
    })),
  })
}

// POST /api/student/[studentId]/exam-plans
// body: { title, examDate (ISO), subject? }
// Generates a multi-day study plan using the LLM, based on the student's
// memory layer + upcoming assignments for that subject.
export async function POST(req: NextRequest, { params }: { params: Promise<{ studentId: string }> }) {
  const { studentId } = await params
  const { title, examDate, subject } = await req.json()
  if (!title || !examDate) {
    return Response.json({ error: 'title and examDate required' }, { status: 400 })
  }

  const exam = new Date(examDate)
  const daysUntil = Math.max(1, Math.ceil((exam.getTime() - Date.now()) / 86400000))

  // gather context: memories + assignments
  const [memories, assignments] = await Promise.all([
    db.memory.findMany({
      where: studentId ? { studentId } : {},
      orderBy: { importance: 'desc' },
      take: 10,
    }),
    db.assignment.findMany({
      where: {
        course: { enrollments: { some: { studentId } } },
        dueDate: { gte: new Date() },
      },
      include: { course: true },
      orderBy: { dueDate: 'asc' },
      take: 8,
    }),
  ])

  const student = await db.user.findUnique({ where: { id: studentId } })

  const memoryBlock = memories.map((m) => `- [${m.type}] ${m.content}`).join('\n') || '(no memories yet)'
  const assignmentBlock = assignments.map((a) => `- ${a.title} (${a.course.name}, due ${a.dueDate.toISOString().slice(0, 10)})`).join('\n') || '(none)'

  const prompt = `You are creating a study plan for ${student?.name ?? 'a student'} for their upcoming exam.
Exam: "${title}"${subject ? ` (Subject: ${subject})` : ''}
Days until exam: ${daysUntil}

Student's memory layer (what they know / struggle with):
${memoryBlock}

Upcoming assignments (work around these):
${assignmentBlock}

Create a ${Math.min(daysUntil, 7)}-day study plan leading up to the exam. Each day should have 2-3 focused tasks.
Return STRICT JSON only (no markdown fences):
{"days": [{"day": 1, "date": "YYYY-MM-DD", "theme": "short theme", "tasks": ["specific task 1", "task 2", "task 3"], "estimatedMinutes": 45}]}

Guidelines:
- Space harder topics earlier; reserve the last day for light review.
- Tie tasks to the student's weak areas from memory where possible.
- Keep tasks concrete and actionable (e.g. "Do 5 quadratic formula problems" not "study math").
- estimatedMinutes should be realistic (30-60).`

  const out = await chatOnce([
    { role: 'system', content: 'You are a study planner. Return JSON only.' },
    { role: 'user', content: prompt },
  ])

  let plan: any = { days: [] }
  const match = out.match(/\{[\s\S]*\}/)
  if (match) {
    try {
      plan = JSON.parse(match[0])
    } catch {
      plan = { days: [{ day: 1, date: examDate.slice(0, 10), theme: title, tasks: ['Review your notes', 'Practice problems', 'Self-quiz'], estimatedMinutes: 45 }] }
    }
  }

  const created = await db.examPlan.create({
    data: {
      studentId,
      title,
      examDate: exam,
      generatedPlan: JSON.stringify(plan),
    },
  })

  // XP for creating a plan
  const award = await awardXp(studentId, 25, { coins: 5, reason: 'exam-plan' })

  return Response.json({
    plan: {
      id: created.id,
      title: created.title,
      examDate: created.examDate.toISOString(),
      plan,
      createdAt: created.createdAt.toISOString(),
    },
    award: { xp: award.xp, level: award.level, leveledUp: award.leveledUp, newAchievements: award.unlockedAchievements },
  })
}
