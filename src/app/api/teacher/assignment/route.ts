import { NextRequest } from 'next/server'
import { db } from '@/lib/db'

export const dynamic = 'force-dynamic'

// POST /api/teacher/assignment
// body: { courseId, title, description?, dueDate (ISO), maxPoints?, type? }
// Creates the assignment and a NOT_STARTED submission for every enrolled student.
export async function POST(req: NextRequest) {
  const { courseId, title, description, dueDate, maxPoints, type } = await req.json()
  if (!courseId || !title || !dueDate) {
    return Response.json({ error: 'courseId, title, dueDate required' }, { status: 400 })
  }
  const assignment = await db.assignment.create({
    data: {
      courseId,
      title,
      description: description || null,
      dueDate: new Date(dueDate),
      maxPoints: maxPoints ?? 100,
      type: type || 'HOMEWORK',
    },
  })

  // create NOT_STARTED submissions for all enrolled students
  const enrollments = await db.enrollment.findMany({ where: { courseId } })
  if (enrollments.length > 0) {
    await db.submission.createMany({
      data: enrollments.map((e) => ({
        assignmentId: assignment.id,
        studentId: e.studentId,
        status: 'NOT_STARTED',
      })),
    })
  }

  return Response.json({ assignment })
}
