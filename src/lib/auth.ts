import type { NextAuthOptions } from 'next-auth'
import CredentialsProvider from 'next-auth/providers/credentials'
import { getServerSession } from 'next-auth'
import bcrypt from 'bcryptjs'
import { db } from '@/lib/db'
import type { Role, SafeUser } from '@/lib/types'

/**
 * MemoraX NextAuth config — Credentials provider that verifies email + password
 * against the database (bcrypt.compareSync). Only users with a `password` field
 * set can log in here (in practice: admins; demo users also have hashes so they
 * could log in, but the landing-page role cards short-circuit that flow).
 *
 * JWT strategy — keeps things simple for the demo, no DB session table needed.
 */

export interface MemoraXToken {
  uid: string
  email: string
  name: string
  role: Role
  avatar: string | null
  grade: string | null
}

declare module 'next-auth' {
  interface Session {
    user: {
      id: string
      email: string
      name: string
      role: Role
      avatar: string | null
      grade: string | null
    }
  }
  interface User {
    id: string
    email: string
    name: string
    role: Role
    avatar: string | null
    grade: string | null
  }
}

declare module 'next-auth/jwt' {
  // Extend the default JWT with MemoraX-specific fields (uid, role, avatar, …).
  interface JWT extends MemoraXToken {
    // satisfies the "no-empty-object-type" rule with a marker field
    memorax?: true
  }
}

function toSafeUser(u: {
  id: string
  email: string
  name: string
  role: string
  avatar: string | null
  grade: string | null
}): SafeUser {
  return {
    id: u.id,
    email: u.email,
    name: u.name,
    role: u.role as Role,
    avatar: u.avatar,
    grade: u.grade,
  }
}

export const authOptions: NextAuthOptions = {
  session: { strategy: 'jwt' },
  pages: {
    // We don't use NextAuth's built-in sign-in page — the in-app AdminLogin
    // component calls signIn('credentials', ...) directly.
    signIn: '/',
  },
  providers: [
    CredentialsProvider({
      name: 'MemoraX',
      credentials: {
        email: { label: 'Email', type: 'email' },
        password: { label: 'Password', type: 'password' },
      },
      async authorize(credentials) {
        const email = credentials?.email?.trim().toLowerCase()
        const password = credentials?.password ?? ''
        if (!email || !password) return null

        const user = await db.user.findUnique({ where: { email } })
        if (!user || !user.password) return null

        const ok = bcrypt.compareSync(password, user.password)
        if (!ok) return null

        return {
          id: user.id,
          email: user.email,
          name: user.name,
          role: user.role as Role,
          avatar: user.avatar,
          grade: user.grade,
        }
      },
    }),
  ],
  callbacks: {
    async jwt({ token, user }) {
      if (user) {
        token.uid = user.id
        token.email = user.email
        token.name = user.name
        token.role = user.role
        token.avatar = user.avatar
        token.grade = user.grade
      }
      return token
    },
    async session({ session, token }) {
      if (session.user) {
        session.user.id = token.uid
        session.user.email = token.email ?? ''
        session.user.name = token.name ?? ''
        session.user.role = token.role
        session.user.avatar = token.avatar
        session.user.grade = token.grade
      }
      return session
    },
  },
}

/** Get the current NextAuth server session (or null). */
export async function getAuthSession() {
  return getServerSession(authOptions)
}

/**
 * Admin guard for API routes.
 * Returns the session if the logged-in user is an ADMIN.
 * Otherwise returns a 401/403 Response — caller should `return` it directly.
 */
export async function requireAdmin():
  Promise<
    | { ok: true; session: NonNullable<Awaited<ReturnType<typeof getAuthSession>>>; user: SafeUser }
    | { ok: false; response: Response }
  > {
  const session = await getAuthSession()
  if (!session?.user) {
    return {
      ok: false,
      response: new Response(JSON.stringify({ error: 'Not authenticated' }), {
        status: 401,
        headers: { 'Content-Type': 'application/json' },
      }),
    }
  }
  if (session.user.role !== 'ADMIN') {
    return {
      ok: false,
      response: new Response(JSON.stringify({ error: 'Admin access required' }), {
        status: 403,
        headers: { 'Content-Type': 'application/json' },
      }),
    }
  }
  return {
    ok: true,
    session,
    user: toSafeUser({
      id: session.user.id,
      email: session.user.email,
      name: session.user.name,
      role: session.user.role,
      avatar: session.user.avatar,
      grade: session.user.grade,
    }),
  }
}

export { toSafeUser }
