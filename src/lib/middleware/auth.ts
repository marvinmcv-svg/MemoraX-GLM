import 'server-only'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { db } from '@/lib/db'

const TIER_LIMITS = {
  FREE: { label: 'Starter', dailyChatLimit: 20, monthlyScanLimit: 3, voiceNotes: false, solutionMode: false, examPrep: false },
  SCHOLAR: { label: 'Scholar', dailyChatLimit: -1, monthlyScanLimit: 50, voiceNotes: true, solutionMode: true, examPrep: true },
  FAMILY: { label: 'Family', dailyChatLimit: -1, monthlyScanLimit: -1, voiceNotes: true, solutionMode: true, examPrep: true },
  EDUCATOR: { label: 'Educator', dailyChatLimit: -1, monthlyScanLimit: -1, voiceNotes: true, solutionMode: true, examPrep: true },
} as const
export type TierCode = keyof typeof TIER_LIMITS

export interface AuthResult {
  userId: string
  user: { id: string; email: string; name: string; role: string; subscriptionTier: string; status: string }
  tier: typeof TIER_LIMITS[TierCode]
}

export async function requireAuth(req?: any): Promise<AuthResult | null> {
  // 1. NextAuth session (production)
  const session = await getServerSession(authOptions)
  if (session?.user) {
    const userId = (session.user as any).id
    if (userId) {
      const user = await db.user.findUnique({ where: { id: userId }, select: { id: true, email: true, name: true, role: true, subscriptionTier: true, status: true } })
      if (user && user.status !== 'SUSPENDED') {
        const tierCode = (user.subscriptionTier as TierCode) || 'FREE'
        return { userId: user.id, user, tier: TIER_LIMITS[tierCode] ?? TIER_LIMITS.FREE }
      }
    }
  }
  // 2. Demo mode fallback (non-production only)
  const isDemoMode = process.env.NODE_ENV !== 'production' && process.env.VERCEL_ENV !== 'production'
  if (isDemoMode && req) {
    let userIdParam: string | null = null
    try { const url = req.url ? new URL(req.url) : null; userIdParam = url?.searchParams?.get('userId') ?? null } catch {}
    if (userIdParam) {
      const user = await db.user.findUnique({ where: { id: userIdParam }, select: { id: true, email: true, name: true, role: true, subscriptionTier: true, status: true } })
      if (user && user.status !== 'SUSPENDED') {
        const tierCode = (user.subscriptionTier as TierCode) || 'FREE'
        return { userId: user.id, user, tier: TIER_LIMITS[tierCode] ?? TIER_LIMITS.FREE }
      }
    }
  }
  return null
}

export async function requireAdmin(): Promise<AuthResult | null> {
  const auth = await requireAuth()
  if (!auth || auth.user.role !== 'ADMIN') return null
  return auth
}

export async function checkChatLimit(userId: string, tier: typeof TIER_LIMITS[TierCode]): Promise<boolean> {
  if (tier.dailyChatLimit === -1) return true
  const today = new Date(); today.setHours(0, 0, 0, 0)
  const count = await db.chatMessage.count({ where: { studentId: userId, role: 'user', createdAt: { gte: today } } })
  return count < tier.dailyChatLimit
}

export async function checkScanLimit(userId: string, tier: typeof TIER_LIMITS[TierCode]): Promise<boolean> {
  if (tier.monthlyScanLimit === -1) return true
  const monthStart = new Date(); monthStart.setDate(1); monthStart.setHours(0, 0, 0, 0)
  const count = await db.memory.count({ where: { studentId: userId, type: 'HOMEWORK', createdAt: { gte: monthStart } } })
  return count < tier.monthlyScanLimit
}
