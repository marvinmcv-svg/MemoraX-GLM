'use client'

import * as React from 'react'
import { Sparkles, Flame, Star, Trophy, TrendingUp, Heart, MessageCircle, Award, Brain, AlertCircle } from 'lucide-react'
import { Card } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Progress } from '@/components/ui/progress'
import { Avatar } from '@/components/gamification/avatar'
import { useSession } from '@/lib/session'
import { api } from '@/lib/api-client'
import { cn } from '@/lib/utils'
import { toast } from 'sonner'

interface StudentInsight {
  id: string
  name: string
  avatar: string | null
  grade: string | null
  gamification: {
    xp: number
    level: number
    levelProgress: { pct: number; intoLevel: number; levelSpan: number }
    coins: number
    streakDays: number
    totalChats: number
    totalHomework: number
    totalReviews: number
    cosmeticsOwned: number
    achievementsCount: number
    recentAchievements: { key: string; def?: { emoji: string; name: string; desc: string }; unlockedAt: string }[]
  }
  avatarConfig: { scene: string; character: string; pet: string; accessory: string }
  mood: { frustrationSignals: number; recentTopics: string[] }
  recentCelebrations: { id: string; title: string; body: string; createdAt: string; readAt: string | null }[]
  focusAreas: string | null
}

interface SiblingComparison {
  students: string[]
  notes: string[]
  gradeNote: string
}

export function ParentInsights() {
  const { user } = useSession()
  const [students, setStudents] = React.useState<StudentInsight[]>([])
  const [sibling, setSibling] = React.useState<SiblingComparison[]>([])
  const [loading, setLoading] = React.useState(true)
  const [encouraging, setEncouraging] = React.useState<string | null>(null)

  const load = React.useCallback(async () => {
    if (!user) return
    setLoading(true)
    try {
      const r = await api.parentInsights(user.id)
      setStudents(r.students)
      setSibling(r.siblingComparison)
    } catch {
      toast.error('Could not load insights')
    } finally {
      setLoading(false)
    }
  }, [user])

  React.useEffect(() => {
    load()
  }, [load])

  const encourage = async (studentId: string, name: string) => {
    if (!user) return
    setEncouraging(studentId)
    try {
      await api.parentEncourage(user.id, studentId)
      toast.success(`Sent "${name}" a "So proud!" message 💪`, {
        description: "It'll appear in their tutor chat as a little surprise.",
      })
    } catch {
      toast.error('Could not send encouragement')
    } finally {
      setEncouraging(null)
    }
  }

  if (loading) {
    return (
      <div className="space-y-5">
        {/* Header skeleton */}
        <div className="h-24 rounded-xl bg-muted animate-pulse" />
        {/* Per-student cards skeleton */}
        <div className="grid lg:grid-cols-2 gap-5">
          {[...Array(2)].map((_, i) => (
            <div key={i} className="rounded-xl border border-border/60 p-5 space-y-4">
              <div className="flex items-center gap-4">
                <div className="h-28 w-28 rounded-2xl bg-muted animate-pulse shrink-0" />
                <div className="flex-1 space-y-2">
                  <div className="h-5 w-32 bg-muted animate-pulse rounded" />
                  <div className="h-3 w-24 bg-muted animate-pulse rounded" />
                  <div className="h-1.5 w-full bg-muted animate-pulse rounded-full mt-2" />
                </div>
              </div>
              <div className="grid grid-cols-4 gap-2">
                {[...Array(4)].map((_, j) => (
                  <div key={j} className="h-14 rounded-lg bg-muted animate-pulse" />
                ))}
              </div>
              <div className="h-16 rounded-lg bg-muted animate-pulse" />
              <div className="h-9 rounded-md bg-muted animate-pulse" />
            </div>
          ))}
        </div>
      </div>
    )
  }

  if (students.length === 0) {
    return (
      <Card className="p-10 text-center">
        <div className="h-14 w-14 mx-auto rounded-2xl bg-primary/10 text-primary grid place-items-center mb-3">
          <Sparkles className="h-7 w-7" />
        </div>
        <p className="font-medium">No insights yet</p>
        <p className="text-sm text-muted-foreground mt-1 max-w-sm mx-auto">
          Once your kids chat with the tutor, complete homework, or earn XP, their growth — streaks,
          badges, mood, and milestones — will show up here.
        </p>
      </Card>
    )
  }

  return (
    <div className="space-y-5">
      {/* Header */}
      <Card className="overflow-hidden">
        <div className="flex items-center gap-4 p-5 bg-gradient-to-r from-[var(--mx-emerald-soft)] to-[var(--mx-warm-soft)]/40">
          <div className="h-12 w-12 rounded-xl bg-card grid place-items-center shadow-sm shrink-0">
            <Sparkles className="h-6 w-6 text-primary" />
          </div>
          <div className="flex-1 min-w-0">
            <h2 className="font-semibold text-lg">Family insights</h2>
            <p className="text-sm text-muted-foreground">
              See how your kids are growing — streaks, badges, mood, and milestones. Not surveillance — celebration.
            </p>
          </div>
        </div>
      </Card>

      {/* Per-student insight cards */}
      <div className="grid lg:grid-cols-2 gap-5">
        {students.map((s) => (
          <StudentInsightCard
            key={s.id}
            s={s}
            encouraging={encouraging === s.id}
            onEncourage={() => encourage(s.id, s.name.split(' ')[0])}
          />
        ))}
      </div>

      {/* Sibling comparison */}
      {sibling.length > 0 && (
        <Card className="p-5">
          <div className="flex items-center gap-2 mb-3">
            <TrendingUp className="h-4 w-4 text-primary" />
            <h3 className="font-semibold text-sm">How they compare</h3>
          </div>
          <div className="space-y-3">
            {sibling.map((c, i) => (
              <div key={i} className="rounded-lg bg-muted/30 p-3">
                <p className="text-xs font-medium mb-1">{c.students.join(' vs ')}</p>
                {c.notes.length > 0 ? (
                  <ul className="space-y-1">
                    {c.notes.map((n, j) => (
                      <li key={j} className="text-sm text-muted-foreground flex gap-2">
                        <span className="text-primary">•</span> {n}
                      </li>
                    ))}
                  </ul>
                ) : (
                  <p className="text-sm text-muted-foreground">Tracking evenly — great balance!</p>
                )}
                {c.gradeNote && <p className="text-xs text-muted-foreground mt-1.5">{c.gradeNote}</p>}
              </div>
            ))}
          </div>
          <p className="text-xs text-muted-foreground mt-3 italic">
            Not a competition — just context. Every kid learns at their own pace.
          </p>
        </Card>
      )}
    </div>
  )
}

function StudentInsightCard({
  s,
  encouraging,
  onEncourage,
}: {
  s: StudentInsight
  encouraging: boolean
  onEncourage: () => void
}) {
  const g = s.gamification
  return (
    <Card className="p-5 hover:shadow-md transition-shadow">
      {/* Header: avatar + name + level */}
      <div className="flex items-start gap-4 mb-4">
        <Avatar config={s.avatarConfig} size="md" />
        <div className="flex-1 min-w-0">
          <p className="font-semibold text-lg flex items-center gap-1.5">
            {s.avatar && <span>{s.avatar}</span>}
            {s.name}
          </p>
          <p className="text-xs text-muted-foreground">{s.grade} · Level {g.level}</p>
          <div className="mt-2">
            <div className="flex items-center justify-between text-[11px] text-muted-foreground mb-1">
              <span>{g.levelProgress.intoLevel} / {g.levelProgress.levelSpan} XP</span>
              <span>{g.levelProgress.pct}%</span>
            </div>
            <Progress value={g.levelProgress.pct} className="h-1.5" />
          </div>
        </div>
      </div>

      {/* Stat chips */}
      <div className="grid grid-cols-4 gap-2 mb-4">
        <MiniStat icon={Flame} value={g.streakDays} label="streak" tone="clay" />
        <MiniStat icon={Star} value={g.xp} label="XP" tone="emerald" />
        <MiniStat icon={Trophy} value={g.achievementsCount} label="badges" tone="amber" />
        <MiniStat icon={Award} value={g.cosmeticsOwned} label="items" tone="muted" />
      </div>

      {/* Recent achievements */}
      {g.recentAchievements.length > 0 && (
        <div className="mb-4">
          <p className="text-xs font-medium text-muted-foreground mb-2">Recent badges</p>
          <div className="flex flex-wrap gap-2">
            {g.recentAchievements.map((a, i) => (
              <div key={i} className="flex items-center gap-1.5 rounded-full bg-[var(--mx-warm-soft)]/50 px-2.5 py-1">
                <span className="text-sm">{a.def?.emoji ?? '🏅'}</span>
                <span className="text-xs font-medium">{a.def?.name ?? a.key}</span>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Mood + topics */}
      <div className="grid grid-cols-2 gap-3 mb-4">
        <div className="rounded-lg bg-muted/30 p-3">
          <p className="text-xs font-medium text-muted-foreground mb-1.5 flex items-center gap-1.5">
            <Brain className="h-3 w-3" /> Recent topics
          </p>
          {s.mood.recentTopics.length > 0 ? (
            <div className="flex flex-wrap gap-1">
              {s.mood.recentTopics.map((t) => (
                <span key={t} className="text-[11px] bg-card rounded-full px-2 py-0.5 border capitalize">{t}</span>
              ))}
            </div>
          ) : (
            <p className="text-xs text-muted-foreground">No recent activity</p>
          )}
        </div>
        <div className={cn('rounded-lg p-3', s.mood.frustrationSignals > 0 ? 'bg-[var(--mx-clay)]/10' : 'bg-primary/5')}>
          <p className="text-xs font-medium text-muted-foreground mb-1.5 flex items-center gap-1.5">
            <AlertCircle className="h-3 w-3" /> Mood signals
          </p>
          {s.mood.frustrationSignals > 0 ? (
            <p className="text-xs text-[var(--mx-clay)]">
              {s.mood.frustrationSignals} moment{s.mood.frustrationSignals > 1 ? 's' : ''} of frustration this week
            </p>
          ) : (
            <p className="text-xs text-primary">All smooth sailing 🌿</p>
          )}
        </div>
      </div>

      {/* Celebrations */}
      {s.recentCelebrations.length > 0 && (
        <div className="mb-4">
          <p className="text-xs font-medium text-muted-foreground mb-2 flex items-center gap-1.5">
            <Sparkles className="h-3 w-3" /> Recent wins
          </p>
          <div className="space-y-1.5">
            {s.recentCelebrations.slice(0, 2).map((c) => (
              <div key={c.id} className="text-xs rounded-lg bg-[var(--mx-emerald-soft)]/40 p-2.5">
                <p className="font-medium">{c.title}</p>
                <p className="text-muted-foreground mt-0.5 line-clamp-2">{c.body.replace(/\*\*/g, '')}</p>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Encourage button */}
      <Button
        variant="outline"
        size="sm"
        className="w-full gap-1.5"
        onClick={onEncourage}
        disabled={encouraging}
      >
        <Heart className={cn('h-3.5 w-3.5', !encouraging && 'animate-pulse')} />
        {encouraging ? 'Sending…' : `Send "${s.name.split(' ')[0]}" some love 💛`}
      </Button>
    </Card>
  )
}

function MiniStat({ icon: Icon, value, label, tone }: { icon: React.ElementType; value: number; label: string; tone: 'clay' | 'emerald' | 'amber' | 'muted' }) {
  const tones = {
    clay: 'bg-[var(--mx-clay)]/10 text-[var(--mx-clay)]',
    emerald: 'bg-primary/10 text-primary',
    amber: 'bg-[var(--mx-warm)]/10 text-[var(--mx-warm)]',
    muted: 'bg-muted text-muted-foreground',
  }
  return (
    <div className={cn('rounded-lg p-2.5 text-center', tones[tone])}>
      <Icon className="h-3.5 w-3.5 mx-auto mb-1" />
      <p className="font-bold text-sm leading-none">{value}</p>
      <p className="text-[10px] mt-0.5">{label}</p>
    </div>
  )
}
