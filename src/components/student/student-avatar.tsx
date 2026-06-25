'use client'

import * as React from 'react'
import { Coins, Flame, Star, ShoppingBag, Trophy, Lock, Check, Sparkles } from 'lucide-react'
import { Card } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Progress } from '@/components/ui/progress'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { Avatar, RarityBadge } from '@/components/gamification/avatar'
import { useSession } from '@/lib/session'
import { api } from '@/lib/api-client'
import { COSMETICS, ACHIEVEMENTS, type Cosmetic } from '@/lib/gamify-catalog'
import { cn } from '@/lib/utils'
import { toast } from 'sonner'

interface ProfileData {
  profile: {
    xp: number
    level: number
    levelProgress: { pct: number; intoLevel: number; levelSpan: number; nextLevelXp: number }
    coins: number
    streakDays: number
    totalChats: number
    totalHomework: number
    totalReviews: number
    reviewDueCount: number
    examPlanCount: number
    conceptsMastered: number
  }
  avatar: { scene: string; character: string; pet: string; accessory: string }
  ownedCosmeticIds: string[]
  achievements: { key: string; unlockedAt: string }[]
}

export function StudentAvatar() {
  const { user } = useSession()
  const [data, setData] = React.useState<ProfileData | null>(null)
  const [loading, setLoading] = React.useState(true)
  const [shopTab, setShopTab] = React.useState<'SCENE' | 'CHARACTER' | 'PET' | 'ACCESSORY'>('CHARACTER')
  const [buying, setBuying] = React.useState<string | null>(null)

  const load = React.useCallback(async () => {
    if (!user) return
    setLoading(true)
    try {
      const r = await api.studentProfile(user.id)
      setData(r)
    } catch {
      toast.error('Could not load profile')
    } finally {
      setLoading(false)
    }
  }, [user])

  React.useEffect(() => {
    load()
  }, [load])

  const equip = async (field: 'scene' | 'character' | 'pet' | 'accessory', id: string) => {
    if (!user || !data) return
    // optimistic
    setData((d) => (d ? { ...d, avatar: { ...d.avatar, [field]: id } } : d))
    try {
      await api.equipAvatar(user.id, { [field]: id })
    } catch {
      toast.error('Could not equip')
      load()
    }
  }

  const buy = async (c: Cosmetic) => {
    if (!user || !data) return
    setBuying(c.id)
    try {
      const res = await api.buyCosmetic(user.id, c.id)
      setData((d) =>
        d
          ? {
              ...d,
              profile: { ...d.profile, coins: res.coins },
              ownedCosmeticIds: [...d.ownedCosmeticIds, c.id],
            }
          : d
      )
      toast.success(`Unlocked ${c.name} ${c.emoji}!`, {
        description: c.rarity === 'legendary' ? '✨ Legendary drop!' : c.rarity === 'epic' ? '💜 Epic!' : 'Added to your collection.',
      })
      // refresh to pick up new achievements
      load()
    } catch (e: any) {
      const msg = e?.message ?? 'Could not buy'
      toast.error(msg)
    } finally {
      setBuying(null)
    }
  }

  if (loading || !data) {
    return (
      <div className="space-y-4">
        <div className="h-48 rounded-xl bg-muted animate-pulse" />
        <div className="grid sm:grid-cols-2 gap-4">
          <div className="h-64 rounded-xl bg-muted animate-pulse" />
          <div className="h-64 rounded-xl bg-muted animate-pulse" />
        </div>
      </div>
    )
  }

  const { profile, avatar, ownedCosmeticIds, achievements } = data
  const ownedSet = new Set(ownedCosmeticIds)
  const unlockedAchKeys = new Set(achievements.map((a) => a.key))

  return (
    <div className="space-y-5">
      {/* Hero: avatar + stats */}
      <Card className="overflow-hidden">
        <div className="grid md:grid-cols-[auto_1fr] gap-6 p-5 sm:p-6">
          <div className="flex flex-col items-center gap-3">
            <Avatar config={avatar} size="xl" />
            <div className="text-center">
              <p className="font-semibold text-lg flex items-center gap-1.5 justify-center">
                {user?.name}
              </p>
              <p className="text-sm text-muted-foreground">Level {profile.level} Scholar</p>
            </div>
          </div>

          <div className="flex flex-col gap-4">
            {/* level + XP */}
            <div>
              <div className="flex items-center justify-between mb-1.5">
                <div className="flex items-center gap-2">
                  <div className="h-8 w-8 rounded-lg bg-primary text-primary-foreground grid place-items-center font-bold text-sm">
                    {profile.level}
                  </div>
                  <div>
                    <p className="text-sm font-medium">Level {profile.level}</p>
                    <p className="text-[11px] text-muted-foreground">
                      {profile.levelProgress.intoLevel} / {profile.levelProgress.levelSpan} XP to level {profile.level + 1}
                    </p>
                  </div>
                </div>
                <Badge variant="secondary" className="gap-1">
                  <Star className="h-3 w-3" /> {profile.xp} XP
                </Badge>
              </div>
              <Progress value={profile.levelProgress.pct} className="h-2.5" />
            </div>

            {/* stat chips */}
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
              <StatChip icon={Coins} value={profile.coins} label="coins" tone="amber" />
              <StatChip icon={Flame} value={profile.streakDays} label="day streak" tone="clay" />
              <StatChip icon={Trophy} value={achievements.length} label="badges" tone="emerald" />
              <StatChip icon={Sparkles} value={ownedCosmeticIds.length} label="items" tone="muted" />
            </div>

            {/* quick stats */}
            <div className="grid grid-cols-3 gap-2 text-center">
              <MiniStat value={profile.totalChats} label="tutor chats" />
              <MiniStat value={profile.totalHomework} label="homework scans" />
              <MiniStat value={profile.totalReviews} label="reviews" />
            </div>
          </div>
        </div>
      </Card>

      <Tabs value={shopTab} onValueChange={(v) => setShopTab(v as any)}>
        <TabsList className="grid grid-cols-4 w-full">
          <TabsTrigger value="CHARACTER" className="gap-1.5"><span className="text-base">🧑‍🎓</span> Outfits</TabsTrigger>
          <TabsTrigger value="PET" className="gap-1.5"><span className="text-base">🐾</span> Pets</TabsTrigger>
          <TabsTrigger value="ACCESSORY" className="gap-1.5"><span className="text-base">🎓</span> Accessories</TabsTrigger>
          <TabsTrigger value="SCENE" className="gap-1.5"><span className="text-base">🏞️</span> Scenes</TabsTrigger>
        </TabsList>

        {(['CHARACTER', 'PET', 'ACCESSORY', 'SCENE'] as const).map((type) => (
          <TabsContent key={type} value={type} className="mt-4">
            <ShopGrid
              cosmetics={COSMETICS.filter((c) => c.type === type)}
              ownedSet={ownedSet}
              equipped={avatar[type === 'CHARACTER' ? 'character' : type === 'PET' ? 'pet' : type === 'ACCESSORY' ? 'accessory' : 'scene'].toLowerCase() === type.toLowerCase() ? avatar[type.toLowerCase() as keyof typeof avatar] : ''}
              avatar={avatar}
              equipField={type === 'CHARACTER' ? 'character' : type === 'PET' ? 'pet' : type === 'ACCESSORY' ? 'accessory' : 'scene'}
              level={profile.level}
              coins={profile.coins}
              buying={buying}
              onEquip={equip}
              onBuy={buy}
            />
          </TabsContent>
        ))}
      </Tabs>

      {/* Achievements */}
      <Card className="p-5">
        <div className="flex items-center gap-2 mb-4">
          <Trophy className="h-5 w-5 text-[var(--mx-warm)]" />
          <h3 className="font-semibold">Achievements</h3>
          <Badge variant="outline" className="text-[11px]">{achievements.length}/{ACHIEVEMENTS.length}</Badge>
        </div>
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
          {ACHIEVEMENTS.map((a) => {
            const unlocked = unlockedAchKeys.has(a.key)
            return (
              <div
                key={a.key}
                className={cn(
                  'rounded-xl border p-3 text-center transition-all',
                  unlocked ? 'border-[var(--mx-warm)]/30 bg-[var(--mx-warm-soft)]/30' : 'border-border/60 opacity-50'
                )}
              >
                <div className={cn('text-3xl mb-1', !unlocked && 'grayscale')}>{a.emoji}</div>
                <p className="text-xs font-medium leading-tight">{a.name}</p>
                <p className="text-[10px] text-muted-foreground mt-0.5 leading-tight">{a.desc}</p>
                {unlocked ? (
                  <Badge variant="outline" className="mt-1.5 text-[10px] text-primary py-0">+{a.coinReward} 🪙</Badge>
                ) : (
                  <div className="mt-1.5 inline-flex items-center gap-0.5 text-[10px] text-muted-foreground">
                    <Lock className="h-2.5 w-2.5" /> locked
                  </div>
                )}
              </div>
            )
          })}
        </div>
      </Card>
    </div>
  )
}

function StatChip({ icon: Icon, value, label, tone }: { icon: React.ElementType; value: number; label: string; tone: 'amber' | 'clay' | 'emerald' | 'muted' }) {
  const tones = {
    amber: 'bg-[var(--mx-warm)]/10 text-[var(--mx-warm)]',
    clay: 'bg-[var(--mx-clay)]/10 text-[var(--mx-clay)]',
    emerald: 'bg-primary/10 text-primary',
    muted: 'bg-muted text-muted-foreground',
  }
  return (
    <div className={cn('rounded-lg p-2.5 flex items-center gap-2', tones[tone])}>
      <Icon className="h-4 w-4 shrink-0" />
      <div className="min-w-0">
        <p className="font-bold leading-none truncate">{value}</p>
        <p className="text-[10px] mt-0.5 leading-tight">{label}</p>
      </div>
    </div>
  )
}

function MiniStat({ value, label }: { value: number; label: string }) {
  return (
    <div className="rounded-lg border border-border/60 p-2.5">
      <p className="text-lg font-bold leading-none">{value}</p>
      <p className="text-[10px] text-muted-foreground mt-1 leading-tight">{label}</p>
    </div>
  )
}

function ShopGrid({
  cosmetics,
  ownedSet,
  avatar,
  equipField,
  level,
  coins,
  buying,
  onEquip,
  onBuy,
}: {
  cosmetics: Cosmetic[]
  ownedSet: Set<string>
  equipped: string
  avatar: { scene: string; character: string; pet: string; accessory: string }
  equipField: 'scene' | 'character' | 'pet' | 'accessory'
  level: number
  coins: number
  buying: string | null
  onEquip: (field: 'scene' | 'character' | 'pet' | 'accessory', id: string) => void
  onBuy: (c: Cosmetic) => void
}) {
  return (
    <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-3">
      {cosmetics.map((c) => {
        const owned = ownedSet.has(c.id)
        const equipped = avatar[equipField] === c.id
        const levelLocked = level < c.levelReq
        const cantAfford = !owned && !levelLocked && coins < c.cost
        return (
          <Card
            key={c.id}
            className={cn(
              'p-3 flex flex-col items-center text-center transition-all',
              equipped && 'ring-2 ring-primary',
              !owned && !levelLocked && 'opacity-90'
            )}
          >
            <div className="relative">
              {c.type === 'SCENE' ? (
                <div className={cn('h-20 w-20 rounded-xl bg-gradient-to-br grid place-items-center text-4xl', c.gradient)}>
                  {c.emoji}
                </div>
              ) : (
                <div className="h-20 w-20 rounded-xl bg-muted/40 grid place-items-center text-5xl">
                  {c.emoji || '—'}
                </div>
              )}
              {equipped && (
                <div className="absolute -top-1 -right-1 h-6 w-6 rounded-full bg-primary text-primary-foreground grid place-items-center">
                  <Check className="h-3.5 w-3.5" />
                </div>
              )}
            </div>
            <p className="text-xs font-medium mt-2 leading-tight">{c.name}</p>
            <div className="flex items-center gap-1 mt-1">
              <RarityBadge rarity={c.rarity} />
            </div>

            <div className="mt-2 w-full">
              {owned ? (
                <Button
                  size="sm"
                  variant={equipped ? 'secondary' : 'outline'}
                  className="w-full"
                  disabled={equipped}
                  onClick={() => onEquip(equipField, c.id)}
                >
                  {equipped ? 'Equipped' : 'Equip'}
                </Button>
              ) : levelLocked ? (
                <Button size="sm" variant="ghost" className="w-full gap-1 text-muted-foreground" disabled>
                  <Lock className="h-3 w-3" /> Lvl {c.levelReq}
                </Button>
              ) : (
                <Button
                  size="sm"
                  className="w-full gap-1.5"
                  disabled={cantAfford || buying === c.id}
                  onClick={() => onBuy(c)}
                >
                  {buying === c.id ? (
                    <div className="h-3.5 w-3.5 rounded-full border-2 border-primary-foreground/40 border-t-primary-foreground animate-spin" />
                  ) : (
                    <Coins className="h-3.5 w-3.5" />
                  )}
                  {c.cost}
                </Button>
              )}
            </div>
          </Card>
        )
      })}
    </div>
  )
}
