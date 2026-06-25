import { NextRequest } from 'next/server'
import { db } from '@/lib/db'
import { chatOnce } from '@/lib/ai'

export const dynamic = 'force-dynamic'

// GET /api/teacher/[teacherId]/lesson-plans — list saved lesson plans
export async function GET(req: NextRequest, { params }: { params: Promise<{ teacherId: string }> }) {
  const { teacherId } = await params
  const url = new URL(req.url)
  const courseId = url.searchParams.get('courseId')

  const where: any = { teacherId }
  if (courseId) where.courseId = courseId

  const plans = await db.lessonPlan.findMany({
    where,
    include: { course: true },
    orderBy: { createdAt: 'desc' },
  })
  return Response.json({
    plans: plans.map((p) => ({
      id: p.id,
      topic: p.topic,
      content: p.content,
      courseName: p.course.name,
      createdAt: p.createdAt.toISOString(),
    })),
  })
}

// POST — generate a new lesson plan from the class's weak spots
// body: { courseId, topic? }
export async function POST(req: NextRequest, { params }: { params: Promise<{ teacherId: string }> }) {
  const { teacherId } = await params
  const { courseId, topic } = await req.json()
  if (!courseId) return Response.json({ error: 'courseId required' }, { status: 400 })

  const course = await db.course.findUnique({
    where: { id: courseId },
    include: { enrollments: { include: { student: true } } },
  })
  if (!course) return Response.json({ error: 'course not found' }, { status: 404 })

  const studentIds = course.enrollments.map((e) => e.studentId)

  // gather weak areas + concepts for this class
  const memories = await db.memory.findMany({
    where: { studentId: { in: studentIds }, type: { in: ['WEAK_AREA', 'CONCEPT'] } },
    orderBy: { importance: 'desc' },
    take: 15,
  })

  const weakAreas = memories.filter((m) => m.type === 'WEAK_AREA').map((m) => m.content)
  const concepts = memories.filter((m) => m.type === 'CONCEPT').map((m) => m.content)

  const lessonTopic = topic || (weakAreas[0] ? deriveTopic(weakAreas[0]) : `${course.name} review`)

  const prompt = `You are creating a 45-minute lesson plan for a ${course.name} class (${course.subject ?? 'General'}).

Topic: ${lessonTopic}

Class context — known weak areas (from the MemoraX memory layer):
${weakAreas.length > 0 ? weakAreas.map((w) => `- ${w}`).join('\n') : '(no specific weak areas recorded yet)'}

Concepts the class has covered:
${concepts.length > 0 ? concepts.map((c) => `- ${c}`).join('\n') : '(none yet)'}

Create a structured lesson plan in Markdown with:
- ## Learning objective (1 sentence)
- ## Materials needed (bullet list)
- ## Warm-up (5 min) — a hook question or quick activity
- ## Direct instruction (15 min) — key points to teach, tied to the weak areas
- ## Guided practice (15 min) — a specific activity or problem set
- ## Independent practice (8 min) — what students do on their own
- ## Closure (2 min) — exit ticket or summary question
- ## Differentiation — 1-2 adjustments for struggling vs. advanced students

Be concrete and specific. Reference the weak areas where relevant. Keep each section tight.`

  const content = await chatOnce([
    { role: 'system', content: 'You create practical, classroom-ready lesson plans in Markdown.' },
    { role: 'user', content: prompt },
  ])

  const plan = await db.lessonPlan.create({
    data: { courseId, teacherId, topic: lessonTopic, content },
  })

  return Response.json({
    plan: {
      id: plan.id,
      topic: plan.topic,
      content: plan.content,
      courseName: course.name,
      createdAt: plan.createdAt.toISOString(),
    },
  })
}

function deriveTopic(weakArea: string): string {
  // extract a short topic from a weak-area memory sentence
  const lower = weakArea.toLowerCase()
  const keywords = ['factoring', 'fractions', 'discriminant', 'quadratic', 'mitosis', 'essay', 'grammar', 'fractions', 'rock cycle', 'enlightenment']
  for (const k of keywords) {
    if (lower.includes(k)) return k.charAt(0).toUpperCase() + k.slice(1)
  }
  return weakArea.split(/[.,;]/)[0].slice(0, 40)
}
