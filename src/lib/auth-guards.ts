import 'server-only'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { db } from '@/lib/db'
import type { NextRequest } from 'next/server'

export interface AuthResult {
  userId: string
  role: string
  email: string
  name: string
  tier: string
}

/**
 * Require an authenticated NextAuth session.
 * Returns the user info or null if not authenticated.
 * In demo mode (no NextAuth), falls back to ?userId= query param.
 */
export async function requireAuth(req?: NextRequest): Promise<AuthResult | null> {
  // 1. Try NextAuth session first
  const session = await getServerSession(authOptions)
  if (session?.user) {
    const user = session.user as any
    // Fetch fresh tier from DB
    const dbUser = await db.user.findUnique({
      where: { id: user.id },
      select: { subscriptionTier: true, status: true },
    })
    if (dbUser?.status === 'SUSPENDED') return null
    return {
      userId: user.id,
      role: user.role,
      email: user.email,
      name: user.name,
      tier: dbUser?.subscriptionTier ?? 'FREE',
    }
  }

  // 2. Demo mode fallback — allow ?userId= for demo exploration
  if (req) {
    const url = new URL(req.url)
    const userIdParam = url.searchParams.get('userId')
    if (userIdParam) {
      const dbUser = await db.user.findUnique({
        where: { id: userIdParam },
        select: { id: true, role: true, email: true, name: true, subscriptionTier: true, status: true },
      })
      if (dbUser && dbUser.status !== 'SUSPENDED') {
        return {
          userId: dbUser.id,
          role: dbUser.role,
          email: dbUser.email,
          name: dbUser.name,
          tier: dbUser.subscriptionTier,
        }
      }
    }
  }

  return null
}

/**
 * Require admin role. Returns user info or null.
 */
export async function requireAdmin(): Promise<AuthResult | null> {
  const auth = await requireAuth()
  if (!auth || auth.role !== 'ADMIN') return null
  return auth
}

/**
 * Require a specific role (or admin, who can access everything).
 */
export async function requireRole(...roles: string[]): Promise<AuthResult | null> {
  const auth = await requireAuth()
  if (!auth) return null
  if (auth.role === 'ADMIN') return auth
  if (!roles.includes(auth.role)) return null
  return auth
}

/**
 * Check if a user owns a resource (e.g., student accessing their own profile).
 * Returns the auth result if they own it, null otherwise.
 */
export async function requireOwnership(resourceOwnerId: string, req?: NextRequest): Promise<AuthResult | null> {
  const auth = await requireAuth(req)
  if (!auth) return null
  // Admins can access everything
  if (auth.role === 'ADMIN') return auth
  // User must own the resource
  if (auth.userId !== resourceOwnerId) return null
  return auth
}

/**
 * Unauthorized response helper.
 */
export function unauthorized() {
  return Response.json({ error: 'Unauthorized' }, { status: 401 })
}

/**
 * Forbidden response helper.
 */
export function forbidden(message = 'Forbidden') {
  return Response.json({ error: message }, { status: 403 })
}

// ---------- Tier limit enforcement ----------

const TIER_LIMITS = {
  FREE: { dailyChats: 20, monthlyScans: 3, voiceNotes: false, solutionMode: false },
  SCHOLAR: { dailyChats: -1, monthlyScans: 50, voiceNotes: true, solutionMode: true },
  FAMILY: { dailyChats: -1, monthlyScans: -1, voiceNotes: true, solutionMode: true },
  EDUCATOR: { dailyChats: -1, monthlyScans: -1, voiceNotes: true, solutionMode: true },
} as const

/**
 * Check if a user can send more chat messages today.
 * Returns { allowed: boolean, remaining: number, limit: number }
 */
export async function checkChatLimit(userId: string, tier: string): Promise<{ allowed: boolean; remaining: number; limit: number }> {
  const limits = TIER_LIMITS[tier as keyof typeof TIER_LIMITS] ?? TIER_LIMITS.FREE
  if (limits.dailyChats === -1) return { allowed: true, remaining: -1, limit: -1 }

  // Count today's messages
  const today = new Date()
  today.setHours(0, 0, 0, 0)
  const todayCount = await db.chatMessage.count({
    where: { studentId: userId, role: 'user', createdAt: { gte: today } },
  })

  const remaining = Math.max(0, limits.dailyChats - todayCount)
  return { allowed: todayCount < limits.dailyChats, remaining, limit: limits.dailyChats }
}

/**
 * Check if a user can scan more homework this month.
 */
export async function checkScanLimit(userId: string, tier: string): Promise<{ allowed: boolean; remaining: number; limit: number }> {
  const limits = TIER_LIMITS[tier as keyof typeof TIER_LIMITS] ?? TIER_LIMITS.FREE
  if (limits.monthlyScans === -1) return { allowed: true, remaining: -1, limit: -1 }

  // Count this month's homework memories
  const monthStart = new Date()
  monthStart.setDate(1)
  monthStart.setHours(0, 0, 0, 0)
  const monthCount = await db.memory.count({
    where: { studentId: userId, type: 'HOMEWORK', createdAt: { gte: monthStart } },
  })

  const remaining = Math.max(0, limits.monthlyScans - monthCount)
  return { allowed: monthCount < limits.monthlyScans, remaining, limit: limits.monthlyScans }
}

/**
 * Check if a tier allows solution mode.
 */
export function canUseSolutionMode(tier: string): boolean {
  const limits = TIER_LIMITS[tier as keyof typeof TIER_LIMITS] ?? TIER_LIMITS.FREE
  return limits.solutionMode
}

/**
 * Check if a tier allows voice notes.
 */
export function canUseVoiceNotes(tier: string): boolean {
  const limits = TIER_LIMITS[tier as keyof typeof TIER_LIMITS] ?? TIER_LIMITS.FREE
  return limits.voiceNotes
}
