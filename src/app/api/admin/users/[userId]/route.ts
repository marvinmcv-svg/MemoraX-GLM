import { NextRequest } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { db } from '@/lib/db'
import { hashPassword } from '@/lib/auth-crypto'

export const dynamic = 'force-dynamic'

export async function PATCH(req: NextRequest, { params }: { params: Promise<{ userId: string }> }) {
  const { userId } = await params
  const session = await getServerSession(authOptions)
  if (!session || (session.user as any)?.role !== 'ADMIN') return Response.json({ error: 'Unauthorized' }, { status: 403 })
  const body = await req.json()
  const updates: Record<string, any> = {}
  if (body.subscriptionTier !== undefined && ['FREE', 'SCHOLAR', 'FAMILY', 'EDUCATOR'].includes(body.subscriptionTier)) updates.subscriptionTier = body.subscriptionTier
  if (body.status !== undefined && ['ACTIVE', 'SUSPENDED'].includes(body.status)) updates.status = body.status
  if (body.role !== undefined && ['STUDENT', 'PARENT', 'TEACHER'].includes(body.role)) updates.role = body.role
  if (body.password !== undefined) { if (body.password.length < 6) return Response.json({ error: 'Password too short' }, { status: 400 }); updates.passwordHash = await hashPassword(body.password) }
  if (Object.keys(updates).length === 0) return Response.json({ error: 'No updates' }, { status: 400 })
  const updated = await db.user.update({ where: { id: userId }, data: updates, select: { id: true, email: true, name: true, role: true, status: true, subscriptionTier: true } })
  return Response.json({ ok: true, user: updated })
}

export async function DELETE(_req: NextRequest, { params }: { params: Promise<{ userId: string }> }) {
  const { userId } = await params
  const session = await getServerSession(authOptions)
  if (!session || (session.user as any)?.role !== 'ADMIN') return Response.json({ error: 'Unauthorized' }, { status: 403 })
  if (userId === (session.user as any).id) return Response.json({ error: 'Cannot delete yourself' }, { status: 400 })
  await db.user.delete({ where: { id: userId } })
  return Response.json({ ok: true })
}
