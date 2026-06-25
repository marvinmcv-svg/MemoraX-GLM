import { NextRequest } from 'next/server'
import { db } from '@/lib/db'

export const dynamic = 'force-dynamic'

// POST /api/student/[studentId]/groups/join
// body: { groupId }
export async function POST(req: NextRequest, { params }: { params: Promise<{ studentId: string }> }) {
  const { studentId } = await params
  const { groupId } = await req.json()
  if (!groupId) return Response.json({ error: 'groupId required' }, { status: 400 })

  try {
    await db.studyGroupMember.create({ data: { studentId, groupId } })
  } catch {
    return Response.json({ error: 'already a member or group not found' }, { status: 409 })
  }
  return Response.json({ ok: true })
}
