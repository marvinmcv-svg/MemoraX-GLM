import { NextRequest } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { fetchClassroomCourses } from '@/lib/google-classroom'

export const dynamic = 'force-dynamic'

// GET /api/classroom/courses — fetch courses from Google Classroom
// body: { accessToken }
export async function GET(req: NextRequest) {
  const session = await getServerSession(authOptions)
  if (!session?.user) return Response.json({ error: 'Unauthorized' }, { status: 401 })

  const url = new URL(req.url)
  const accessToken = url.searchParams.get('token')
  if (!accessToken) return Response.json({ error: 'token required' }, { status: 400 })

  try {
    const courses = await fetchClassroomCourses(accessToken)
    return Response.json({ courses })
  } catch (e: any) {
    return Response.json({ error: e?.message || 'Failed to fetch courses' }, { status: 500 })
  }
}
