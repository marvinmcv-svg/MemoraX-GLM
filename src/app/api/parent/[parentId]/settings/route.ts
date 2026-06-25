import { NextRequest } from 'next/server'
import { db } from '@/lib/db'
import { getOrCreateProfile } from '@/lib/gamify'

export const dynamic = 'force-dynamic'

// GET /api/parent/[parentId]/settings?studentId=...
// Returns the parent's settings for a specific student (study hours, focus areas)
export async function GET(req: NextRequest, { params }: { params: Promise<{ parentId: string }> }) {
  const { parentId } = await params
  const url = new URL(req.url)
  const studentId = url.searchParams.get('studentId')
  if (!studentId) return Response.json({ settings: null })

  // verify this parent is in the same family as the student
  const parentMembership = await db.familyMember.findFirst({
    where: { userId: parentId, role: 'PARENT' },
  })
  const studentMembership = await db.familyMember.findFirst({
    where: { userId: studentId, role: 'STUDENT' },
  })
  if (!parentMembership || !studentMembership || parentMembership.familyId !== studentMembership.familyId) {
    return Response.json({ error: 'not authorized' }, { status: 403 })
  }

  const profile = await getOrCreateProfile(studentId)
  return Response.json({
    settings: {
      studyHours: profile.studyHours ? JSON.parse(profile.studyHours) : null,
      focusAreas: profile.focusAreas ?? null,
    },
  })
}

// POST — update settings
// body: { studentId, studyHours?, focusAreas? }
export async function POST(req: NextRequest, { params }: { params: Promise<{ parentId: string }> }) {
  const { parentId } = await params
  const { studentId, studyHours, focusAreas } = await req.json()
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

  const updates: any = {}
  if (studyHours !== undefined) updates.studyHours = JSON.stringify(studyHours)
  if (focusAreas !== undefined) updates.focusAreas = focusAreas || null

  await getOrCreateProfile(studentId)
  await db.studentProfile.update({ where: { studentId }, data: updates })
  return Response.json({ ok: true })
}
