import { NextRequest } from 'next/server'
import { db } from '@/lib/db'

export const dynamic = 'force-dynamic'

// GET /api/parent/[parentId]/messages?teacherId=...
// Returns the message thread between this parent and a teacher (or all teachers)
export async function GET(req: NextRequest, { params }: { params: Promise<{ parentId: string }> }) {
  const { parentId } = await params
  const url = new URL(req.url)
  const teacherId = url.searchParams.get('teacherId')

  // find this parent's family + their kids' teachers
  const memberships = await db.familyMember.findMany({
    where: { userId: parentId, role: 'PARENT' },
  })
  if (memberships.length === 0) return Response.json({ threads: [], messages: [] })
  const familyId = memberships[0].familyId
  const familyMembers = await db.familyMember.findMany({ where: { familyId } })
  const studentIds = familyMembers.filter((m) => m.role === 'STUDENT').map((m) => m.userId)

  // find teachers of those students
  const enrollments = await db.enrollment.findMany({
    where: { studentId: { in: studentIds } },
    include: { course: { include: { teacher: true } } },
  })
  const teacherMap = new Map<string, { id: string; name: string; avatar: string | null; courseName: string }>()
  for (const e of enrollments) {
    if (!teacherMap.has(e.course.teacherId)) {
      teacherMap.set(e.course.teacherId, {
        id: e.course.teacherId,
        name: e.course.teacher.name,
        avatar: e.course.teacher.avatar,
        courseName: e.course.name,
      })
    }
  }
  const teachers = Array.from(teacherMap.values())

  // if a specific teacher, get the full thread
  let messages: any[] = []
  if (teacherId) {
    const msgs = await db.parentTeacherMessage.findMany({
      where: { parentId, teacherId },
      orderBy: { createdAt: 'asc' },
    })
    messages = msgs.map((m) => ({
      id: m.id,
      direction: m.direction,
      content: m.content,
      readAt: m.readAt?.toISOString() ?? null,
      createdAt: m.createdAt.toISOString(),
    }))
  }

  // also get unread counts per teacher
  const threads = await Promise.all(
    teachers.map(async (t) => {
      const unread = await db.parentTeacherMessage.count({
        where: { parentId, teacherId: t.id, direction: 'TEACHER_TO_PARENT', readAt: null },
      })
      const lastMsg = await db.parentTeacherMessage.findFirst({
        where: { parentId, teacherId: t.id },
        orderBy: { createdAt: 'desc' },
      })
      return {
        ...t,
        unread,
        lastMessage: lastMsg
          ? { content: lastMsg.content, direction: lastMsg.direction, createdAt: lastMsg.createdAt.toISOString() }
          : null,
      }
    })
  )

  return Response.json({ threads, messages })
}

// POST — parent sends a message to a teacher
export async function POST(req: NextRequest, { params }: { params: Promise<{ parentId: string }> }) {
  const { parentId } = await params
  const { teacherId, studentId, content } = await req.json()
  if (!teacherId || !content?.trim()) {
    return Response.json({ error: 'teacherId and content required' }, { status: 400 })
  }
  const msg = await db.parentTeacherMessage.create({
    data: {
      parentId,
      teacherId,
      studentId: studentId ?? null,
      direction: 'PARENT_TO_TEACHER',
      content: content.trim(),
    },
  })
  return Response.json({ ok: true, id: msg.id })
}
