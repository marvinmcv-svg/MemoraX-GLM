import { NextRequest } from 'next/server'
import { sendParentEncouragement } from '@/lib/gamify'
import { db } from '@/lib/db'

export const dynamic = 'force-dynamic'

// POST /api/parent/[parentId]/encourage
// body: { studentId, message? }
// Sends a "So proud!" encouragement from the parent to the student's tutor chat.
export async function POST(req: NextRequest, { params }: { params: Promise<{ parentId: string }> }) {
  const { parentId } = await params
  const { studentId, message } = await req.json()
  if (!studentId) return Response.json({ error: 'studentId required' }, { status: 400 })

  // verify family
  const parentMembership = await db.familyMember.findFirst({
    where: { userId: parentId, role: 'PARENT' },
  })
  const studentMembership = await db.familyMember.findFirst({
    where: { userId: studentId, role: 'STUDENT' },
  })
  if (!parentMembership || !studentMembership || parentMembership.familyId !== studentMembership.familyId) {
    return Response.json({ error: 'not authorized' }, { status: 403 })
  }

  const parent = await db.user.findUnique({ where: { id: parentId } })
  const parentName = parent?.name?.split(' ')[0] ?? 'Your parent'

  await sendParentEncouragement(studentId, parentName, message)
  return Response.json({ ok: true })
}
