import { NextResponse } from 'next/server'
import bcrypt from 'bcryptjs'
import { db } from '@/lib/db'
import { requireAdmin, toSafeUser } from '@/lib/auth'
import type { Role } from '@/lib/types'

export const dynamic = 'force-dynamic'

const ALLOWED_ROLES: Role[] = ['STUDENT', 'PARENT', 'TEACHER', 'ADMIN']

function pickAvatar(s: string | null | undefined): string | null {
  if (!s) return null
  const trimmed = s.trim()
  return trimmed.length > 0 ? trimmed.slice(0, 8) : null
}

/** PATCH /api/admin/users/[id] — edit user (name/email/role/avatar/grade/password). */
export async function PATCH(
  req: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const guard = await requireAdmin()
  if (!guard.ok) return guard.response

  const { id } = await params

  let body: any
  try {
    body = await req.json()
  } catch {
    return NextResponse.json({ error: 'Invalid JSON' }, { status: 400 })
  }

  try {
    const existing = await db.user.findUnique({ where: { id } })
    if (!existing) {
      return NextResponse.json({ error: 'User not found' }, { status: 404 })
    }

    const data: any = {}
    if (typeof body?.name === 'string' && body.name.trim()) {
      data.name = body.name.trim()
    }
    if (typeof body?.email === 'string' && body.email.trim()) {
      const email = body.email.trim().toLowerCase()
      if (!/^[^@\s]+@[^@\s]+\.[^@\s]+$/.test(email)) {
        return NextResponse.json({ error: 'A valid email is required' }, { status: 400 })
      }
      if (email !== existing.email) {
        const clash = await db.user.findUnique({ where: { email } })
        if (clash) {
          return NextResponse.json({ error: 'That email is already in use' }, { status: 409 })
        }
      }
      data.email = email
    }
    if (typeof body?.role === 'string') {
      const role = body.role.toUpperCase() as Role
      if (!ALLOWED_ROLES.includes(role)) {
        return NextResponse.json({ error: 'Invalid role' }, { status: 400 })
      }
      data.role = role
      // only students keep a grade
      data.grade = role === 'STUDENT' ? (body.grade ?? existing.grade) : null
    } else if (typeof body?.grade !== 'undefined') {
      // grade-only edit (only meaningful for students)
      data.grade = existing.role === 'STUDENT' ? (body.grade ? String(body.grade).trim() : null) : null
    }
    if (typeof body?.avatar !== 'undefined') {
      data.avatar = pickAvatar(body.avatar)
    }
    if (typeof body?.password === 'string' && body.password.length > 0) {
      if (body.password.length < 6) {
        return NextResponse.json({ error: 'Password must be at least 6 characters' }, { status: 400 })
      }
      data.password = bcrypt.hashSync(body.password, 10)
    }

    const updated = await db.user.update({
      where: { id },
      data,
      select: {
        id: true,
        email: true,
        name: true,
        role: true,
        avatar: true,
        grade: true,
        createdAt: true,
      },
    })
    return NextResponse.json({ user: toSafeUser(updated) })
  } catch (e: any) {
    return NextResponse.json(
      { error: e?.message ?? 'unknown' },
      { status: 500 }
    )
  }
}

/** DELETE /api/admin/users/[id] — with guards: can't delete self, can't delete last admin. */
export async function DELETE(
  _req: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const guard = await requireAdmin()
  if (!guard.ok) return guard.response

  const { id } = await params

  if (id === guard.user.id) {
    return NextResponse.json(
      { error: "You can't delete your own admin account while signed in" },
      { status: 400 }
    )
  }

  try {
    const target = await db.user.findUnique({ where: { id } })
    if (!target) {
      return NextResponse.json({ error: 'User not found' }, { status: 404 })
    }
    if (target.role === 'ADMIN') {
      const adminCount = await db.user.count({ where: { role: 'ADMIN' } })
      if (adminCount <= 1) {
        return NextResponse.json(
          { error: "You can't delete the last admin account" },
          { status: 400 }
        )
      }
    }
    await db.user.delete({ where: { id } })
    return NextResponse.json({ ok: true })
  } catch (e: any) {
    return NextResponse.json(
      { error: e?.message ?? 'unknown' },
      { status: 500 }
    )
  }
}
