import { NextRequest } from 'next/server'
import { db } from '@/lib/db'
import { chatOnce } from '@/lib/ai'

export const dynamic = 'force-dynamic'

// GET /api/teacher/[teacherId]/conference-report?studentId=...
// Generates a parent-teacher conference narrative summary from the student's memory layer.
export async function GET(req: NextRequest, { params }: { params: Promise<{ teacherId: string }> }) {
  const { teacherId } = await params
  const url = new URL(req.url)
  const studentId = url.searchParams.get('studentId')
  if (!studentId) return Response.json({ error: 'studentId required' }, { status: 400 })

  const [student, memories, submissions, profile] = await Promise.all([
    db.user.findUnique({ where: { id: studentId } }),
    db.memory.findMany({ where: { studentId }, orderBy: { importance: 'desc' }, take: 15 }),
    db.submission.findMany({
      where: { studentId, assignment: { course: { teacherId } } },
      include: { assignment: { include: { course: true } } },
    }),
    db.studentProfile.findUnique({ where: { studentId } }),
  ])
  if (!student) return Response.json({ error: 'student not found' }, { status: 404 })

  const now = new Date()
  const memoryBlock = memories
    .map((m) => `- [${m.type}] ${m.content}${m.tags ? ` (${m.tags})` : ''}`)
    .join('\n') || '(no memories yet)'
  const assignmentBlock = submissions
    .map((s) => `- ${s.assignment.title} (${s.assignment.course.name}) — ${s.status}${s.score !== null ? `, ${s.score}/${s.assignment.maxPoints}` : ''}, due ${s.assignment.dueDate.toISOString().slice(0, 10)}`)
    .join('\n') || '(no assignments)'

  const level = profile ? Math.floor(Math.sqrt(Math.max(0, profile.xp) / 100)) + 1 : 1
  const streak = profile?.streakDays ?? 0

  const prompt = `You are preparing a parent-teacher conference narrative for ${student.name} (${student.grade ?? 'a student'}).
Write a warm, specific, 3-paragraph summary a teacher could read aloud to the parent. Cover:
1. Strengths and recent wins (draw from CONCEPT, STUDY_TIP, TUTOR_SESSION memories)
2. Growth areas (draw from WEAK_AREA memories) — frame positively, never as failure
3. A specific, actionable next step the parent can support at home

Keep it human and concrete — no generic platitudes. ~200 words total.

Student's memory layer:
${memoryBlock}

Assignment progress:
${assignmentBlock}

Engagement: Level ${level}, ${streak}-day streak, ${profile?.totalChats ?? 0} tutor chats, ${profile?.totalReviews ?? 0} reviews.

Write the narrative in plain text (no markdown headers). Address the parent as "you" and the student by first name.`

  const narrative = await chatOnce([
    { role: 'system', content: 'You write warm, specific parent-teacher conference summaries. Plain text, no markdown.' },
    { role: 'user', content: prompt },
  ])

  return Response.json({
    student: { id: student.id, name: student.name, avatar: student.avatar, grade: student.grade },
    narrative,
    stats: {
      level,
      streak,
      totalChats: profile?.totalChats ?? 0,
      totalReviews: profile?.totalReviews ?? 0,
      totalHomework: profile?.totalHomework ?? 0,
      completion: submissions.length > 0
        ? Math.round((submissions.filter((s) => s.status === 'GRADED' || s.status === 'SUBMITTED').length / submissions.length) * 100)
        : 0,
    },
  })
}
