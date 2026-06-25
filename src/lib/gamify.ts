import 'server-only'
import { db } from '@/lib/db'

// ============================================================
// Cosmetic catalog — the shop inventory
// ============================================================

export type CosmeticType = 'SCENE' | 'CHARACTER' | 'PET' | 'ACCESSORY'
export type Rarity = 'common' | 'rare' | 'epic' | 'legendary'

export interface Cosmetic {
  id: string
  type: CosmeticType
  name: string
  emoji: string
  cost: number
  rarity: Rarity
  levelReq: number // student must be this level to buy
  // for scenes: a tailwind gradient class
  gradient?: string
  decor?: string[] // extra emoji scattered in the scene
}

export const COSMETICS: Cosmetic[] = [
  // ---------- SCENES (background) ----------
  { id: 'bedroom', type: 'SCENE', name: 'Cozy Bedroom', emoji: '🛏️', cost: 0, rarity: 'common', levelReq: 1, gradient: 'from-amber-100 to-orange-200', decor: ['📚', '🪴'] },
  { id: 'library', type: 'SCENE', name: 'Quiet Library', emoji: '📖', cost: 100, rarity: 'common', levelReq: 2, gradient: 'from-amber-200 to-yellow-100', decor: ['📜', '🕯️'] },
  { id: 'forest', type: 'SCENE', name: 'Forest Glade', emoji: '🌲', cost: 120, rarity: 'common', levelReq: 2, gradient: 'from-emerald-200 to-green-300', decor: ['🍃', '🦋'] },
  { id: 'beach', type: 'SCENE', name: 'Sunny Beach', emoji: '🏖️', cost: 150, rarity: 'rare', levelReq: 3, gradient: 'from-cyan-200 to-amber-100', decor: ['🐚', '⛅'] },
  { id: 'cafe', type: 'SCENE', name: 'Study Café', emoji: '☕', cost: 180, rarity: 'rare', levelReq: 3, gradient: 'from-amber-200 to-orange-300', decor: ['🥐', '🎧'] },
  { id: 'space', type: 'SCENE', name: 'Outer Space', emoji: '🚀', cost: 250, rarity: 'epic', levelReq: 5, gradient: 'from-indigo-900 to-purple-900', decor: ['⭐', '🪐', '✨'] },
  { id: 'gamer', type: 'SCENE', name: 'Gamer Den', emoji: '🎮', cost: 250, rarity: 'epic', levelReq: 5, gradient: 'from-fuchsia-600 to-cyan-600', decor: ['🕹️', '💡'] },
  { id: 'mountain', type: 'SCENE', name: 'Mountain Peak', emoji: '🏔️', cost: 300, rarity: 'epic', levelReq: 6, gradient: 'from-sky-200 to-slate-300', decor: ['🦅', '❄️'] },
  { id: 'castle', type: 'SCENE', name: 'Royal Castle', emoji: '🏰', cost: 500, rarity: 'legendary', levelReq: 8, gradient: 'from-violet-400 to-fuchsia-400', decor: ['👑', '💎'] },

  // ---------- CHARACTERS ----------
  { id: 'student', type: 'CHARACTER', name: 'Student', emoji: '🧑‍🎓', cost: 0, rarity: 'common', levelReq: 1 },
  { id: 'athlete', type: 'CHARACTER', name: 'Athlete', emoji: '🏃', cost: 80, rarity: 'common', levelReq: 2 },
  { id: 'artist', type: 'CHARACTER', name: 'Artist', emoji: '🧑‍🎨', cost: 100, rarity: 'common', levelReq: 2 },
  { id: 'chef', type: 'CHARACTER', name: 'Chef', emoji: '👨‍🍳', cost: 130, rarity: 'rare', levelReq: 3 },
  { id: 'scientist', type: 'CHARACTER', name: 'Scientist', emoji: '🧑‍🔬', cost: 120, rarity: 'rare', levelReq: 3 },
  { id: 'musician', type: 'CHARACTER', name: 'Musician', emoji: '🧑‍🎤', cost: 150, rarity: 'rare', levelReq: 4 },
  { id: 'detective', type: 'CHARACTER', name: 'Detective', emoji: '🕵️', cost: 200, rarity: 'epic', levelReq: 5 },
  { id: 'ninja', type: 'CHARACTER', name: 'Ninja', emoji: '🥷', cost: 220, rarity: 'epic', levelReq: 5 },
  { id: 'superhero', type: 'CHARACTER', name: 'Superhero', emoji: '🦸', cost: 280, rarity: 'epic', levelReq: 6 },
  { id: 'wizard', type: 'CHARACTER', name: 'Wizard', emoji: '🧙', cost: 250, rarity: 'epic', levelReq: 6 },
  { id: 'astronaut', type: 'CHARACTER', name: 'Astronaut', emoji: '👩‍🚀', cost: 350, rarity: 'legendary', levelReq: 7 },
  { id: 'pirate', type: 'CHARACTER', name: 'Pirate', emoji: '🏴‍☠️', cost: 400, rarity: 'legendary', levelReq: 8 },

  // ---------- PETS ----------
  { id: 'none', type: 'PET', name: 'No Pet', emoji: '', cost: 0, rarity: 'common', levelReq: 1 },
  { id: 'turtle', type: 'PET', name: 'Turtle', emoji: '🐢', cost: 70, rarity: 'common', levelReq: 2 },
  { id: 'cat', type: 'PET', name: 'Cat', emoji: '🐱', cost: 60, rarity: 'common', levelReq: 2 },
  { id: 'dog', type: 'PET', name: 'Dog', emoji: '🐶', cost: 60, rarity: 'common', levelReq: 2 },
  { id: 'rabbit', type: 'PET', name: 'Rabbit', emoji: '🐰', cost: 80, rarity: 'common', levelReq: 2 },
  { id: 'fox', type: 'PET', name: 'Fox', emoji: '🦊', cost: 100, rarity: 'rare', levelReq: 3 },
  { id: 'owl', type: 'PET', name: 'Wisdom Owl', emoji: '🦉', cost: 120, rarity: 'rare', levelReq: 3 },
  { id: 'penguin', type: 'PET', name: 'Penguin', emoji: '🐧', cost: 150, rarity: 'rare', levelReq: 4 },
  { id: 'panda', type: 'PET', name: 'Panda', emoji: '🐼', cost: 180, rarity: 'epic', levelReq: 5 },
  { id: 'bat', type: 'PET', name: 'Bat', emoji: '🦇', cost: 200, rarity: 'epic', levelReq: 5 },
  { id: 'dragon', type: 'PET', name: 'Dragon', emoji: '🐉', cost: 400, rarity: 'legendary', levelReq: 7 },
  { id: 'unicorn', type: 'PET', name: 'Unicorn', emoji: '🦄', cost: 500, rarity: 'legendary', levelReq: 8 },

  // ---------- ACCESSORIES ----------
  { id: 'none_acc', type: 'ACCESSORY', name: 'No Accessory', emoji: '', cost: 0, rarity: 'common', levelReq: 1 },
  { id: 'bow', type: 'ACCESSORY', name: 'Bow', emoji: '🎀', cost: 30, rarity: 'common', levelReq: 1 },
  { id: 'glasses', type: 'ACCESSORY', name: 'Glasses', emoji: '👓', cost: 40, rarity: 'common', levelReq: 1 },
  { id: 'cap', type: 'ACCESSORY', name: 'Cap', emoji: '🧢', cost: 50, rarity: 'common', levelReq: 2 },
  { id: 'party', type: 'ACCESSORY', name: 'Party Hat', emoji: '🥳', cost: 50, rarity: 'common', levelReq: 2 },
  { id: 'scarf', type: 'ACCESSORY', name: 'Scarf', emoji: '🧣', cost: 60, rarity: 'common', levelReq: 2 },
  { id: 'sunglasses', type: 'ACCESSORY', name: 'Sunglasses', emoji: '🕶️', cost: 70, rarity: 'rare', levelReq: 3 },
  { id: 'headphones', type: 'ACCESSORY', name: 'Headphones', emoji: '🎧', cost: 90, rarity: 'rare', levelReq: 3 },
  { id: 'gradcap', type: 'ACCESSORY', name: 'Graduation Cap', emoji: '🎓', cost: 100, rarity: 'rare', levelReq: 4 },
  { id: 'halo', type: 'ACCESSORY', name: 'Halo', emoji: '😇', cost: 250, rarity: 'epic', levelReq: 5 },
  { id: 'crown', type: 'ACCESSORY', name: 'Crown', emoji: '👑', cost: 300, rarity: 'legendary', levelReq: 6 },
]

export const COSMETIC_MAP = new Map(COSMETICS.map((c) => [c.id, c]))

export function getCosmetic(id: string): Cosmetic | undefined {
  return COSMETIC_MAP.get(id) ?? COSMETIC_MAP.get(id === 'none' ? 'none' : 'none_acc')
}

// ============================================================
// Level math
// ============================================================

// level = floor(sqrt(xp / 100)) + 1
// level 1: 0 XP, level 2: 100, level 3: 400, level 4: 900, level 5: 1600, level 10: 8100
export function levelFromXp(xp: number): number {
  return Math.floor(Math.sqrt(Math.max(0, xp) / 100)) + 1
}

export function xpForLevel(level: number): number {
  // xp needed to REACH this level
  return Math.pow(level - 1, 2) * 100
}

export function levelProgress(xp: number): {
  level: number
  currentLevelXp: number
  nextLevelXp: number
  intoLevel: number
  levelSpan: number
  pct: number
} {
  const level = levelFromXp(xp)
  const currentLevelXp = xpForLevel(level)
  const nextLevelXp = xpForLevel(level + 1)
  const intoLevel = xp - currentLevelXp
  const levelSpan = nextLevelXp - currentLevelXp
  const pct = levelSpan > 0 ? Math.min(100, Math.round((intoLevel / levelSpan) * 100)) : 100
  return { level, currentLevelXp, nextLevelXp, intoLevel, levelSpan, pct }
}

// ============================================================
// Achievements
// ============================================================

export interface AchievementDef {
  key: string
  name: string
  desc: string
  emoji: string
  coinReward: number
  check: (s: AchievementContext) => boolean
}

export interface AchievementContext {
  xp: number
  level: number
  totalChats: number
  totalHomework: number
  totalReviews: number
  streakDays: number
  cosmeticsOwned: number
  examPlans: number
  conceptsMastered: number
}

export const ACHIEVEMENTS: AchievementDef[] = [
  { key: 'first_chat', name: 'First Words', desc: 'Sent your first tutor message', emoji: '💬', coinReward: 10, check: (s) => s.totalChats >= 1 },
  { key: 'chat_10', name: 'Chatterbox', desc: 'Sent 10 tutor messages', emoji: '🗨️', coinReward: 20, check: (s) => s.totalChats >= 10 },
  { key: 'chat_50', name: 'Conversationalist', desc: 'Sent 50 tutor messages', emoji: '🗣️', coinReward: 50, check: (s) => s.totalChats >= 50 },
  { key: 'homework_1', name: 'Snap!', desc: 'Uploaded your first homework photo', emoji: '📸', coinReward: 15, check: (s) => s.totalHomework >= 1 },
  { key: 'homework_10', name: 'Shutterbug', desc: 'Scanned 10 homework photos', emoji: '📷', coinReward: 40, check: (s) => s.totalHomework >= 10 },
  { key: 'review_1', name: 'Recaller', desc: 'Completed your first review', emoji: '🔁', coinReward: 15, check: (s) => s.totalReviews >= 1 },
  { key: 'review_25', name: 'Memory Keeper', desc: 'Completed 25 reviews', emoji: '🧠', coinReward: 50, check: (s) => s.totalReviews >= 25 },
  { key: 'streak_3', name: 'Warming Up', desc: '3-day study streak', emoji: '🔥', coinReward: 20, check: (s) => s.streakDays >= 3 },
  { key: 'streak_7', name: 'Week Warrior', desc: '7-day study streak', emoji: '⚡', coinReward: 50, check: (s) => s.streakDays >= 7 },
  { key: 'streak_30', name: 'Unstoppable', desc: '30-day study streak', emoji: '🌟', coinReward: 200, check: (s) => s.streakDays >= 30 },
  { key: 'level_5', name: 'Rising Star', desc: 'Reached level 5', emoji: '⭐', coinReward: 50, check: (s) => s.level >= 5 },
  { key: 'level_10', name: 'Scholar Supreme', desc: 'Reached level 10', emoji: '🏆', coinReward: 150, check: (s) => s.level >= 10 },
  { key: 'exam_1', name: 'Planner', desc: 'Created your first exam plan', emoji: '📅', coinReward: 25, check: (s) => s.examPlans >= 1 },
  { key: 'polymath', name: 'Polymath', desc: 'Mastered 5 concepts', emoji: '🧩', coinReward: 60, check: (s) => s.conceptsMastered >= 5 },
  { key: 'fresh_fit', name: 'Fresh Fit', desc: 'Bought your first cosmetic', emoji: '👕', coinReward: 15, check: (s) => s.cosmeticsOwned >= 1 },
  { key: 'collector', name: 'Collector', desc: 'Own 5 cosmetics', emoji: '🎁', coinReward: 50, check: (s) => s.cosmeticsOwned >= 5 },
]

// ============================================================
// Core: ensure profile + award XP + check achievements + streak
// ============================================================

export async function getOrCreateProfile(studentId: string) {
  // Use upsert to avoid race conditions when multiple concurrent calls
  // (e.g. touchStreak + awardXp) try to create the same profile.
  const profile = await db.studentProfile.upsert({
    where: { studentId },
    update: {},
    create: { studentId },
  })
  // Grant default free cosmetics on first creation (idempotent via try/catch)
  const owned = await db.studentCosmetic.count({ where: { studentId } })
  if (owned === 0) {
    const freeCosmetics = COSMETICS.filter((c) => c.cost === 0).map((c) => c.id)
    try {
      await db.studentCosmetic.createMany({
        data: freeCosmetics.map((cid) => ({ studentId, cosmeticId: cid })),
      })
    } catch {
      /* already created by a concurrent call — fine */
    }
  }
  return profile
}

/**
 * Update the student's streak based on today's activity.
 * - same day as lastActiveDate: no change
 * - yesterday: streak + 1
 * - else: streak resets to 1
 */
export async function touchStreak(studentId: string): Promise<{ streakDays: number; streakBonus: number }> {
  const profile = await getOrCreateProfile(studentId)
  const now = new Date()
  const today = new Date(now.getFullYear(), now.getMonth(), now.getDate())
  const last = profile.lastActiveDate ? new Date(profile.lastActiveDate) : null
  const lastDay = last ? new Date(last.getFullYear(), last.getMonth(), last.getDate()) : null

  if (lastDay && lastDay.getTime() === today.getTime()) {
    // already active today, no streak change
    return { streakDays: profile.streakDays, streakBonus: 0 }
  }

  let newStreak = 1
  if (lastDay) {
    const diffDays = Math.round((today.getTime() - lastDay.getTime()) / 86400000)
    if (diffDays === 1) newStreak = profile.streakDays + 1
    else if (diffDays === 0) newStreak = profile.streakDays
    else newStreak = 1 // missed a day or more
  }

  // streak bonus XP: +5 per streak day, capped at 50
  const streakBonus = Math.min(50, newStreak * 5)
  await db.studentProfile.update({
    where: { studentId },
    data: { streakDays: newStreak, lastActiveDate: now },
  })
  return { streakDays: newStreak, streakBonus }
}

export interface AwardResult {
  xp: number
  level: number
  coins: number
  leveledUp: boolean
  newLevel?: number
  unlockedAchievements: AchievementDef[]
}

/**
 * Award XP + coins to a student, then check achievements.
 * Does NOT touch streak (call touchStreak separately for daily activity).
 */
export async function awardXp(
  studentId: string,
  xpAmount: number,
  opts: { coins?: number; reason?: string } = {}
): Promise<AwardResult> {
  const profile = await getOrCreateProfile(studentId)
  const oldLevel = levelFromXp(profile.xp)
  const newCoins = (opts.coins ?? Math.floor(xpAmount / 10)) + 0

  const updated = await db.studentProfile.update({
    where: { studentId },
    data: {
      xp: { increment: xpAmount },
      coins: { increment: newCoins },
    },
  })

  const newLevel = levelFromXp(updated.xp)
  const leveledUp = newLevel > oldLevel

  // level-up bonus coins
  if (leveledUp) {
    const bonus = (newLevel - oldLevel) * 20
    await db.studentProfile.update({
      where: { studentId },
      data: { coins: { increment: bonus } },
    })
    updated.coins += bonus
  }

  // check achievements
  const unlocked = await checkAchievements(studentId, {
    xp: updated.xp,
    level: newLevel,
    totalChats: updated.totalChats,
    totalHomework: updated.totalHomework,
    totalReviews: updated.totalReviews,
    streakDays: updated.streakDays,
    cosmeticsOwned: await db.studentCosmetic.count({ where: { studentId } }),
    examPlans: await db.examPlan.count({ where: { studentId } }),
    conceptsMastered: await db.memory.count({ where: { studentId, type: 'CONCEPT', importance: { gte: 4 } } }),
  })

  return {
    xp: updated.xp,
    level: newLevel,
    coins: updated.coins,
    leveledUp,
    newLevel: leveledUp ? newLevel : undefined,
    unlockedAchievements: unlocked,
  }
}

async function checkAchievements(studentId: string, ctx: AchievementContext): Promise<AchievementDef[]> {
  const existing = await db.achievement.findMany({ where: { studentId } })
  const existingKeys = new Set(existing.map((a) => a.key))
  const newlyUnlocked: AchievementDef[] = []

  for (const def of ACHIEVEMENTS) {
    if (existingKeys.has(def.key)) continue
    if (def.check(ctx)) {
      await db.achievement.upsert({
        where: { studentId_key: { studentId, key: def.key } },
        update: {},
        create: { studentId, key: def.key },
      })
      // award coin reward
      await db.studentProfile.update({
        where: { studentId },
        data: { coins: { increment: def.coinReward } },
      })
      newlyUnlocked.push(def)
    }
  }
  return newlyUnlocked
}

/** Increment a counter on the profile (chat, homework, review). */
export async function incrementCounter(
  studentId: string,
  field: 'totalChats' | 'totalHomework' | 'totalReviews'
): Promise<void> {
  await db.studentProfile.update({
    where: { studentId },
    data: { [field]: { increment: 1 } },
  })
}

// ============================================================
// Parent notifications: celebrations + frustration signals
// ============================================================

/**
 * After awarding XP, notify the student's family of any level-ups or achievements.
 * Creates CELEBRATION reminders that land in the parent inbox.
 */
export async function notifyFamilyOfCelebration(
  studentId: string,
  award: AwardResult
): Promise<void> {
  if (!award.leveledUp && award.unlockedAchievements.length === 0) return

  // find the student's family
  const membership = await db.familyMember.findFirst({
    where: { userId: studentId, role: 'STUDENT' },
  })
  if (!membership) return
  const familyId = membership.familyId

  const student = await db.user.findUnique({ where: { id: studentId } })
  const name = student?.name ?? 'Your child'

  const parts: string[] = []
  if (award.leveledUp && award.newLevel) {
    parts.push(`🎉 ${name} reached **Level ${award.newLevel}**! That's real progress.`)
  }
  for (const a of award.unlockedAchievements) {
    parts.push(`🏅 ${name} unlocked the **${a.name}** badge — ${a.desc.toLowerCase()}`)
  }

  await db.reminder.create({
    data: {
      studentId,
      familyId,
      type: 'CELEBRATION',
      title: `🎉 ${name} ${award.leveledUp ? `hit Level ${award.newLevel}!` : 'earned a new badge!'}`,
      body: parts.join('\n\n'),
      scheduledFor: new Date(),
      sentAt: new Date(),
    },
  })
}

/**
 * Lightweight frustration detection from a chat exchange.
 * Returns a frustration score 0-1 and a short reason if frustrated.
 * Uses keyword heuristics to avoid an extra LLM call on every message.
 */
const FRUSTRATION_KEYWORDS = [
  "i don't get it", "i dont get it", "this is hard", "i'm confused", "im confused",
  "i give up", "this is stupid", "i hate this", "i can't do this", "i cant do this",
  "help me", "i'm stuck", "im stuck", "frustrated", "angry", "ugh", "argh",
  "makes no sense", "too hard", "i'm lost", "im lost", "confusing",
]

export function detectFrustrationHeuristic(userMessage: string): { frustrated: boolean; score: number } {
  const lower = userMessage.toLowerCase()
  let score = 0
  for (const kw of FRUSTRATION_KEYWORDS) {
    if (lower.includes(kw)) score += 0.35
  }
  // exclamation marks + short messages often signal frustration
  const excCount = (userMessage.match(/!/g) || []).length
  if (excCount >= 2) score += 0.2
  if (userMessage.trim().length < 15 && excCount >= 1) score += 0.15
  score = Math.min(1, score)
  return { frustrated: score >= 0.5, score }
}

/**
 * If frustration detected, create a gentle FRUSTRATION_SIGNAL reminder for the parent.
 */
export async function maybeNotifyFrustration(
  studentId: string,
  userMessage: string
): Promise<void> {
  const { frustrated } = detectFrustrationHeuristic(userMessage)
  if (!frustrated) return

  const membership = await db.familyMember.findFirst({
    where: { userId: studentId, role: 'STUDENT' },
  })
  if (!membership) return
  const familyId = membership.familyId
  const student = await db.user.findUnique({ where: { id: studentId } })
  const name = student?.name ?? 'Your child'

  await db.reminder.create({
    data: {
      studentId,
      familyId,
      type: 'FRUSTRATION_SIGNAL',
      title: `💛 ${name} seemed stuck just now`,
      body: `${name} sent a message that sounded a bit frustrated during tutoring. A gentle check-in or offer to help might go a long way. (This is an automated heads-up — not surveillance.)`,
      scheduledFor: new Date(),
      sentAt: new Date(),
    },
  })
}

/**
 * Send a parent's "So proud!" encouragement as a chat message to the student.
 */
export async function sendParentEncouragement(
  studentId: string,
  parentName: string,
  customMessage?: string
): Promise<void> {
  const content = customMessage?.trim() || `💬 ${parentName} sent you a message: "I'm so proud of your hard work! Keep it up 💪"`

  await db.chatMessage.create({
    data: {
      studentId,
      role: 'assistant',
      content,
      mode: 'socratic',
    },
  })
}

