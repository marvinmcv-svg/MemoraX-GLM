import { NextRequest } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { db } from '@/lib/db'
import { hashPassword } from '@/lib/auth-crypto'

export const dynamic = 'force-dynamic'

export async function POST(req: NextRequest) {
  const session = await getServerSession(authOptions)
  if (!session || (session.user as any)?.role !== 'ADMIN') return Response.json({ error: 'Unauthorized' }, { status: 403 })
  const { email, name, role, password, grade, avatar, subscriptionTier } = await req.json()
  if (!email || !name || !password || !role) return Response.json({ error: 'email, name, password, role required' }, { status: 400 })
  if (!['STUDENT', 'PARENT', 'TEACHER'].includes(role)) return Response.json({ error: 'Invalid role' }, { status: 400 })
  const tier = subscriptionTier && ['FREE', 'SCHOLAR', 'FAMILY', 'EDUCATOR'].includes(subscriptionTier) ? subscriptionTier : 'FREE'
  if (password.length < 6) return Response.json({ error: 'Password must be 6+ chars' }, { status: 400 })
  const existing = await db.user.findUnique({ where: { email: email.toLowerCase() } })
  if (existing) return Response.json({ error: 'Email already exists' }, { status: 409 })
  const hash = await hashPassword(password)
  const user = await db.user.create({ data: { email: email.toLowerCase(), name, role, grade: grade || null, avatar: avatar || (role === 'STUDENT' ? '🎓' : role === 'PARENT' ? '👨‍👩‍👧' : '👩‍🏫'), passwordHash: hash, subscriptionTier: tier } })
  if (role === 'STUDENT') await db.studentProfile.upsert({ where: { studentId: user.id }, update: {}, create: { studentId: user.id } })
  return Response.json({ ok: true, user: { id: user.id, email: user.email, name: user.name, role: user.role, avatar: user.avatar, grade: user.grade } })
}
