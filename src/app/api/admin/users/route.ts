import { NextResponse } from 'next/server'
import bcrypt from 'bcryptjs'
import { db } from '@/lib/db'
import { requireAdmin, toSafeUser } from '@/lib/auth'
import type { Role } from '@/lib/types'

export const dynamic = 'force-dynamic'

const ALLOWED_ROLES: Role[] = ['STUDENT', 'PARENT', 'TEACHER', 'ADMIN']

function pickAvatar(s: string | null | undefined): string | null {
  if (!s) return null
  // emoji-safe: trim, allow a single grapheme-ish
  const trimmed = s.trim()
  return trimmed.length > 0 ? trimmed.slice(0, 8) : null
}

/** GET /api/admin/users — list all users (safe fields, NO password). */
export async function GET() {
  const guard = await requireAdmin()
  if (!guard.ok) return guard.response

  try {
    const users = await db.user.findMany({
      orderBy: { createdAt: 'asc' },
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
    return NextResponse.json({
      users: users.map((u) => toSafeUser(u)),
    })
  } catch (e: any) {
    return NextResponse.json(
      { error: e?.message ?? 'unknown' },
      { status: 500 }
    )
  }
}

/** POST /api/admin/users — create a new user. Password >= 6 chars (hashed). */
export async function POST(req: Request) {
  const guard = await requireAdmin()
  if (!guard.ok) return guard.response

  let body: any
  try {
    body = await req.json()
  } catch {
    return NextResponse.json({ error: 'Invalid JSON' }, { status: 400 })
  }

  const email = String(body?.email ?? '').trim().toLowerCase()
  const name = String(body?.name ?? '').trim()
  const role = String(body?.role ?? '').toUpperCase() as Role
  const avatar = pickAvatar(body?.avatar)
  const grade = body?.grade ? String(body.grade).trim() : null
  const password = String(body?.password ?? '')

  if (!email || !/^[^@\s]+@[^@\s]+\.[^@\s]+$/.test(email)) {
    return NextResponse.json({ error: 'A valid email is required' }, { status: 400 })
  }
  if (!name) {
    return NextResponse.json({ error: 'Name is required' }, { status: 400 })
  }
  if (!ALLOWED_ROLES.includes(role)) {
    return NextResponse.json({ error: 'Invalid role' }, { status: 400 })
  }
  if (password.length < 6) {
    return NextResponse.json({ error: 'Password must be at least 6 characters' }, { status: 400 })
  }

  try {
    const existing = await db.user.findUnique({ where: { email } })
    if (existing) {
      return NextResponse.json({ error: 'A user with that email already exists' }, { status: 409 })
    }
    const passwordHash = bcrypt.hashSync(password, 10)
    const user = await db.user.create({
      data: {
        email,
        name,
        role,
        avatar,
        grade: role === 'STUDENT' ? grade : null,
        password: passwordHash,
      },
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
    return NextResponse.json({ user: toSafeUser(user) })
  } catch (e: any) {
    return NextResponse.json(
      { error: e?.message ?? 'unknown' },
      { status: 500 }
    )
  }
}
