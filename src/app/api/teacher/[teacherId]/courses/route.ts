import { NextRequest } from 'next/server'
import { db } from '@/lib/db'

export const dynamic = 'force-dynamic'

// GET /api/teacher/[teacherId]/courses — list teacher's courses with student count + assignment count
export async function GET(_req: NextRequest, { params }: { params: Promise<{ teacherId: string }> }) {
  const { teacherId } = await params
  const courses = await db.course.findMany({
    where: { teacherId },
    include: {
      _count: { select: { enrollments: true, assignments: true } },
    },
    orderBy: { createdAt: 'asc' },
  })
  const result = courses.map((c) => ({
    id: c.id,
    name: c.name,
    subject: c.subject,
    color: c.color,
    room: c.room,
    studentCount: c._count.enrollments,
    assignmentCount: c._count.assignments,
  }))
  return Response.json({ courses: result })
}
