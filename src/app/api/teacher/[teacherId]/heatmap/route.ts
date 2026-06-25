import { NextRequest } from 'next/server'
import { db } from '@/lib/db'

export const dynamic = 'force-dynamic'

// GET /api/teacher/[teacherId]/heatmap?courseId=...
// Returns a class-wide concept heatmap: which topics students struggle with.
// Aggregates WEAK_AREA + CONCEPT memories across enrolled students.
export async function GET(req: NextRequest, { params }: { params: Promise<{ teacherId: string }> }) {
  const { teacherId } = await params
  const url = new URL(req.url)
  const courseId = url.searchParams.get('courseId')

  const courses = await db.course.findMany({
    where: { teacherId },
    include: { enrollments: { include: { student: true } } },
  })

  const result = []
  for (const course of courses) {
    if (courseId && course.id !== courseId) continue
    const studentIds = course.enrollments.map((e) => e.studentId)
    if (studentIds.length === 0) continue

    // gather all memories for these students
    const memories = await db.memory.findMany({
      where: { studentId: { in: studentIds }, type: { in: ['WEAK_AREA', 'CONCEPT', 'HOMEWORK'] } },
    })

    // aggregate by tag
    const tagMap: Record<string, { count: number; weak: number; students: Set<string> }> = {}
    for (const m of memories) {
      if (!m.tags) continue
      const tags = m.tags.split(',').map((t) => t.trim()).filter(Boolean)
      for (const tag of tags) {
        if (!tagMap[tag]) tagMap[tag] = { count: 0, weak: 0, students: new Set() }
        tagMap[tag].count += 1
        if (m.type === 'WEAK_AREA') tagMap[tag].weak += 1
        tagMap[tag].students.add(m.studentId)
      }
    }

    const concepts = Object.entries(tagMap)
      .map(([tag, data]) => ({
        topic: tag,
        mentions: data.count,
        weakAreas: data.weak,
        studentsAffected: data.students.size,
        totalStudents: studentIds.length,
        pct: Math.round((data.students.size / studentIds.length) * 100),
        severity: data.weak >= 2 ? 'high' : data.weak >= 1 ? 'medium' : 'low',
      }))
      .sort((a, b) => b.weak - a.weak || b.mentions - a.mentions)
      .slice(0, 12)

    result.push({
      course: { id: course.id, name: course.name, subject: course.subject, studentCount: studentIds.length },
      concepts,
    })
  }

  return Response.json({ courses: result })
}
