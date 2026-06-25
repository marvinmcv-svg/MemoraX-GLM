import { NextRequest } from 'next/server'
import { db } from '@/lib/db'

export const dynamic = 'force-dynamic'

// GET /api/student/[studentId]/groups — groups this student is in + available classmate groups
export async function GET(_req: NextRequest, { params }: { params: Promise<{ studentId: string }> }) {
  const { studentId } = await params

  // student's groups
  const myMemberships = await db.studyGroupMember.findMany({
    where: { studentId },
    include: { group: { include: { members: { include: { student: true } }, createdBy: true } } },
  })

  // classmate groups (groups created by students in the same courses)
  const myCourses = await db.enrollment.findMany({
    where: { studentId },
    select: { studentId: true },
  })
  const classmateIds = new Set<string>()
  for (const e of myCourses) {
    // find other students in same courses
  }
  // simpler: get all student ids that share a course with me
  const myCourseIds = (await db.enrollment.findMany({ where: { studentId }, select: { courseId: true } })).map((e) => e.courseId)
  const classmateEnrollments = await db.enrollment.findMany({
    where: { courseId: { in: myCourseIds }, studentId: { not: studentId } },
    select: { studentId: true },
  })
  classmateEnrollments.forEach((e) => classmateIds.add(e.studentId))

  const availableGroups = await db.studyGroup.findMany({
    where: { createdById: { in: Array.from(classmateIds) } },
    include: { members: true, createdBy: true },
  })

  return Response.json({
    mine: myMemberships.map((m) => ({
      id: m.group.id,
      name: m.group.name,
      subject: m.group.subject,
      createdBy: m.group.createdBy.name,
      memberCount: m.group.members.length,
      members: m.group.members.map((mem) => ({ name: mem.student.name, avatar: mem.student.avatar })),
      joinedAt: m.joinedAt.toISOString(),
    })),
    available: availableGroups
      .filter((g) => !g.members.some((m) => m.studentId === studentId))
      .map((g) => ({
        id: g.id,
        name: g.name,
        subject: g.subject,
        createdBy: g.createdBy.name,
        memberCount: g.members.length,
      })),
  })
}

// POST — create a group
export async function POST(req: NextRequest, { params }: { params: Promise<{ studentId: string }> }) {
  const { studentId } = await params
  const { name, subject } = await req.json()
  if (!name?.trim()) {
    return Response.json({ error: 'name required' }, { status: 400 })
  }
  const group = await db.studyGroup.create({
    data: {
      name: name.trim(),
      subject: subject || null,
      createdById: studentId,
      members: { create: [{ studentId }] }, // creator auto-joins
    },
  })
  return Response.json({ group: { id: group.id, name: group.name, subject: group.subject } })
}
