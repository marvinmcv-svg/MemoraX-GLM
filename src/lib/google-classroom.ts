import 'server-only'
import { db } from '@/lib/db'

// Google Classroom API integration
// Requires GOOGLE_CLIENT_ID, GOOGLE_CLIENT_SECRET, and GOOGLE_REDIRECT_URI in .env
// with the classroom.courses.readonly and classroom.course-work.readonly scopes

const GOOGLE_CLASSROOM_SCOPES = [
  'https://www.googleapis.com/auth/classroom.courses.readonly',
  'https://www.googleapis.com/auth/classroom.course-work.readonly',
  'https://www.googleapis.com/auth/classroom.student-submissions.me.readonly',
  'https://www.googleapis.com/auth/classroom.rosters.readonly',
].join(' ')

export function getGoogleClassroomAuthUrl(state: string): string {
  const clientId = process.env.GOOGLE_CLIENT_ID
  const redirectUri = process.env.GOOGLE_REDIRECT_URI || `${process.env.NEXTAUTH_URL}/api/classroom/callback`
  return `https://accounts.google.com/o/oauth2/v2/auth?` +
    `client_id=${clientId}&` +
    `redirect_uri=${encodeURIComponent(redirectUri)}&` +
    `response_type=code&` +
    `scope=${encodeURIComponent(GOOGLE_CLASSROOM_SCOPES)}&` +
    `state=${state}&` +
    `access_type=offline&` +
    `prompt=consent`
}

export async function exchangeGoogleCode(code: string): Promise<{ access_token: string; refresh_token?: string; expires_in: number }> {
  const res = await fetch('https://oauth2.googleapis.com/token', {
    method: 'POST',
    headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
    body: new URLSearchParams({
      code,
      client_id: process.env.GOOGLE_CLIENT_ID!,
      client_secret: process.env.GOOGLE_CLIENT_SECRET!,
      redirect_uri: process.env.GOOGLE_REDIRECT_URI || `${process.env.NEXTAUTH_URL}/api/classroom/callback`,
      grant_type: 'authorization_code',
    }),
  })
  const data = await res.json()
  if (!data.access_token) throw new Error('Failed to exchange Google code')
  return data
}

export async function fetchClassroomCourses(accessToken: string) {
  const res = await fetch('https://classroom.googleapis.com/v1/courses?courseStates=ACTIVE', {
    headers: { Authorization: `Bearer ${accessToken}` },
  })
  const data = await res.json()
  return data.courses || []
}

export async function fetchClassroomCourseWork(accessToken: string, courseId: string) {
  const res = await fetch(`https://classroom.googleapis.com/v1/courses/${courseId}/courseWork`, {
    headers: { Authorization: `Bearer ${accessToken}` },
  })
  const data = await res.json()
  return data.courseWork || []
}

export async function syncClassroomToMemoraX(userId: string, accessToken: string) {
  const courses = await fetchClassroomCourses(accessToken)
  const synced: { courseName: string; assignmentCount: number }[] = []

  for (const gcCourse of courses) {
    // Find or create a MemoraX course matching this Google Classroom course
    let course = await db.course.findFirst({
      where: { name: gcCourse.name, teacherId: userId },
    })

    if (!course) {
      course = await db.course.create({
        data: {
          name: gcCourse.name,
          subject: gcCourse.section || null,
          teacherId: userId,
          color: 'emerald',
          room: gcCourse.room || null,
        },
      })
    }

    // Fetch and sync assignments
    const courseWork = await fetchClassroomCourseWork(accessToken, gcCourse.id)
    let assignmentCount = 0

    for (const work of courseWork) {
      const existing = await db.assignment.findFirst({
        where: { courseId: course.id, title: work.title },
      })

      if (!existing && work.dueDate) {
        const due = new Date(work.dueDate.year, (work.dueDate.month || 1) - 1, work.dueDate.day || 1)
        await db.assignment.create({
          data: {
            courseId: course.id,
            title: work.title,
            description: work.description || null,
            dueDate: due,
            maxPoints: work.maxPoints || 100,
            type: work.workType === 'ASSIGNMENT' ? 'HOMEWORK' : work.workType === 'QUIZ' ? 'QUIZ' : 'PROJECT',
          },
        })
        assignmentCount++
      }
    }

    synced.push({ courseName: gcCourse.name, assignmentCount })
  }

  return synced
}
