import { NextRequest } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { syncClassroomToMemoraX, getGoogleClassroomAuthUrl } from '@/lib/google-classroom'

export const dynamic = 'force-dynamic'

// GET /api/classroom/sync — returns the Google OAuth URL for Classroom
export async function GET(req: NextRequest) {
  const session = await getServerSession(authOptions)
  const url = new URL(req.url)
  const userIdParam = url.searchParams.get('userId')
  let userId: string | null = null
  if (session?.user) userId = (session.user as any).id
  else if (userIdParam) userId = userIdParam
  if (!userId) return Response.json({ error: 'Unauthorized' }, { status: 401 })

  if (!process.env.GOOGLE_CLIENT_ID) {
    return Response.json({ error: 'Google Classroom integration is not configured. Add GOOGLE_CLIENT_ID to .env' }, { status: 503 })
  }

  const authUrl = getGoogleClassroomAuthUrl(userId)
  return Response.json({ authUrl })
}

// POST /api/classroom/sync — sync courses from Google Classroom (after OAuth)
// body: { accessToken }
export async function POST(req: NextRequest) {
  const session = await getServerSession(authOptions)
  if (!session?.user) return Response.json({ error: 'Unauthorized' }, { status: 401 })

  const { accessToken } = await req.json()
  if (!accessToken) return Response.json({ error: 'accessToken required' }, { status: 400 })

  try {
    const result = await syncClassroomToMemoraX((session.user as any).id, accessToken)
    return Response.json({ ok: true, synced: result })
  } catch (e: any) {
    return Response.json({ error: e?.message || 'Sync failed' }, { status: 500 })
  }
}
