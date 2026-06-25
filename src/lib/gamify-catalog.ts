// Client-safe cosmetic catalog (no server-only imports).
// Mirrors the catalog in src/lib/gamify.ts — keep in sync.

export type CosmeticType = 'SCENE' | 'CHARACTER' | 'PET' | 'ACCESSORY'
export type Rarity = 'common' | 'rare' | 'epic' | 'legendary'

export interface Cosmetic {
  id: string
  type: CosmeticType
  name: string
  emoji: string
  cost: number
  rarity: Rarity
  levelReq: number
  gradient?: string
  decor?: string[]
}

export const COSMETICS: Cosmetic[] = [
  { id: 'bedroom', type: 'SCENE', name: 'Cozy Bedroom', emoji: '🛏️', cost: 0, rarity: 'common', levelReq: 1, gradient: 'from-amber-100 to-orange-200', decor: ['📚', '🪴'] },
  { id: 'library', type: 'SCENE', name: 'Quiet Library', emoji: '📖', cost: 100, rarity: 'common', levelReq: 2, gradient: 'from-amber-200 to-yellow-100', decor: ['📜', '🕯️'] },
  { id: 'forest', type: 'SCENE', name: 'Forest Glade', emoji: '🌲', cost: 120, rarity: 'common', levelReq: 2, gradient: 'from-emerald-200 to-green-300', decor: ['🍃', '🦋'] },
  { id: 'beach', type: 'SCENE', name: 'Sunny Beach', emoji: '🏖️', cost: 150, rarity: 'rare', levelReq: 3, gradient: 'from-cyan-200 to-amber-100', decor: ['🐚', '⛅'] },
  { id: 'cafe', type: 'SCENE', name: 'Study Café', emoji: '☕', cost: 180, rarity: 'rare', levelReq: 3, gradient: 'from-amber-200 to-orange-300', decor: ['🥐', '🎧'] },
  { id: 'space', type: 'SCENE', name: 'Outer Space', emoji: '🚀', cost: 250, rarity: 'epic', levelReq: 5, gradient: 'from-indigo-900 to-purple-900', decor: ['⭐', '🪐', '✨'] },
  { id: 'gamer', type: 'SCENE', name: 'Gamer Den', emoji: '🎮', cost: 250, rarity: 'epic', levelReq: 5, gradient: 'from-fuchsia-600 to-cyan-600', decor: ['🕹️', '💡'] },
  { id: 'mountain', type: 'SCENE', name: 'Mountain Peak', emoji: '🏔️', cost: 300, rarity: 'epic', levelReq: 6, gradient: 'from-sky-200 to-slate-300', decor: ['🦅', '❄️'] },
  { id: 'castle', type: 'SCENE', name: 'Royal Castle', emoji: '🏰', cost: 500, rarity: 'legendary', levelReq: 8, gradient: 'from-violet-400 to-fuchsia-400', decor: ['👑', '💎'] },

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
  return COSMETIC_MAP.get(id) ?? (id === 'none' ? COSMETIC_MAP.get('none') : COSMETIC_MAP.get('none_acc'))
}

// level math (mirrors server)
export function levelFromXp(xp: number): number {
  return Math.floor(Math.sqrt(Math.max(0, xp) / 100)) + 1
}
export function xpForLevel(level: number): number {
  return Math.pow(level - 1, 2) * 100
}
export function levelProgress(xp: number) {
  const level = levelFromXp(xp)
  const currentLevelXp = xpForLevel(level)
  const nextLevelXp = xpForLevel(level + 1)
  const intoLevel = xp - currentLevelXp
  const levelSpan = nextLevelXp - currentLevelXp
  const pct = levelSpan > 0 ? Math.min(100, Math.round((intoLevel / levelSpan) * 100)) : 100
  return { level, currentLevelXp, nextLevelXp, intoLevel, levelSpan, pct }
}

export interface AchievementDef {
  key: string
  name: string
  desc: string
  emoji: string
  coinReward: number
}

export const ACHIEVEMENTS: AchievementDef[] = [
  { key: 'first_chat', name: 'First Words', desc: 'Sent your first tutor message', emoji: '💬', coinReward: 10 },
  { key: 'chat_10', name: 'Chatterbox', desc: 'Sent 10 tutor messages', emoji: '🗨️', coinReward: 20 },
  { key: 'chat_50', name: 'Conversationalist', desc: 'Sent 50 tutor messages', emoji: '🗣️', coinReward: 50 },
  { key: 'homework_1', name: 'Snap!', desc: 'Uploaded your first homework photo', emoji: '📸', coinReward: 15 },
  { key: 'homework_10', name: 'Shutterbug', desc: 'Scanned 10 homework photos', emoji: '📷', coinReward: 40 },
  { key: 'review_1', name: 'Recaller', desc: 'Completed your first review', emoji: '🔁', coinReward: 15 },
  { key: 'review_25', name: 'Memory Keeper', desc: 'Completed 25 reviews', emoji: '🧠', coinReward: 50 },
  { key: 'streak_3', name: 'Warming Up', desc: '3-day study streak', emoji: '🔥', coinReward: 20 },
  { key: 'streak_7', name: 'Week Warrior', desc: '7-day study streak', emoji: '⚡', coinReward: 50 },
  { key: 'streak_30', name: 'Unstoppable', desc: '30-day study streak', emoji: '🌟', coinReward: 200 },
  { key: 'level_5', name: 'Rising Star', desc: 'Reached level 5', emoji: '⭐', coinReward: 50 },
  { key: 'level_10', name: 'Scholar Supreme', desc: 'Reached level 10', emoji: '🏆', coinReward: 150 },
  { key: 'exam_1', name: 'Planner', desc: 'Created your first exam plan', emoji: '📅', coinReward: 25 },
  { key: 'polymath', name: 'Polymath', desc: 'Mastered 5 concepts', emoji: '🧩', coinReward: 60 },
  { key: 'fresh_fit', name: 'Fresh Fit', desc: 'Bought your first cosmetic', emoji: '👕', coinReward: 15 },
  { key: 'collector', name: 'Collector', desc: 'Own 5 cosmetics', emoji: '🎁', coinReward: 50 },
]
