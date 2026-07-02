'use client'

import * as React from 'react'
import { signOut } from 'next-auth/react'
import { Star, Flame, Coins, MessageSquare, Camera, Brain, TrendingUp, Shield, Crown, Trophy, Calendar, LogOut, Loader2, Sparkles, ArrowLeft } from 'lucide-react'
import { DataControls } from '@/components/auth/privacy'
import { Logo } from '@/components/brand/logo'
import { ThemeToggle } from '@/components/brand/theme-toggle'
import { Card } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Progress } from '@/components/ui/progress'
import { Button } from '@/components/ui/button'
import { toast } from 'sonner'
import { cn } from '@/lib/utils'

const TIER_LABELS: Record<string, string> = { FREE: 'Starter', SCHOLAR: 'Scholar', FAMILY: 'Family', EDUCATOR: 'Educator' }
const TIER_COLORS: Record<string, string> = { FREE: 'bg-muted text-muted-foreground', SCHOLAR: 'bg-primary/10 text-primary', FAMILY: 'bg-[var(--mx-warm)]/10 text-[var(--mx-warm)]', EDUCATOR: 'bg-[var(--mx-emerald)]/10 text-[var(--mx-emerald)]' }

export function UserStatsPage() {
  const [data, setData] = React.useState<any>(null)
  const [loading, setLoading] = React.useState(true)

  React.useEffect(() => {
    const localSession = localStorage.getItem('memorax-session')
    let userId: string | null = null
    if (localSession) { try { userId = JSON.parse(localSession)?.state?.user?.id ?? null } catch {} }
    fetch(userId ? `/api/user/stats?userId=${userId}` : '/api/user/stats').then((r) => r.json()).then((d) => { if (!d.error) setData(d) }).catch(() => toast.error('Could not load stats')).finally(() => setLoading(false))
  }, [])

  if (loading) return <div className="min-h-screen flex flex-col items-center justify-center gap-4"><Loader2 className="h-6 w-6 text-primary animate-spin" /><p className="text-sm text-muted-foreground">Loading your stats…</p></div>
  if (!data) return <div className="min-h-screen flex items-center justify-center"><p className="text-muted-foreground">No stats available.</p></div>

  const { user, gamification, usage, achievements, tier } = data

  return (
    <div className="min-h-screen flex flex-col">
      <header className="sticky top-0 z-40 glass border-b border-border/60">
        <div className="mx-auto max-w-4xl px-4 sm:px-6 h-16 flex items-center justify-between">
          <div className="flex items-center gap-2"><Button variant="ghost" size="sm" className="gap-1.5" onClick={() => window.history.back()}><ArrowLeft className="h-3.5 w-3.5" /> Back</Button><Logo /></div>
          <div className="flex items-center gap-2"><ThemeToggle /><Button variant="ghost" size="sm" className="gap-1.5" onClick={() => { try { localStorage.removeItem('memorax-session') } catch {} signOut({ callbackUrl: '/', redirect: true }) }}><LogOut className="h-3.5 w-3.5" /> Sign out</Button></div>
        </div>
      </header>
      <main className="flex-1 mx-auto w-full max-w-4xl px-4 sm:px-6 py-8 space-y-5">
        <Card className="p-5"><div className="flex items-center gap-4"><div className="h-14 w-14 rounded-2xl bg-[var(--mx-emerald-soft)] grid place-items-center text-3xl">{user.avatar ?? '👤'}</div><div className="flex-1 min-w-0"><h1 className="text-xl font-bold">{user.name}</h1><p className="text-sm text-muted-foreground">{user.email}{user.grade ? ` · ${user.grade}` : ''}</p></div><span className={cn('text-xs font-medium px-2.5 py-1 rounded-full', TIER_COLORS[tier.current])}>{TIER_LABELS[tier.current]} Plan</span></div></Card>
        {gamification && <Card className="p-5"><h2 className="font-semibold mb-4 flex items-center gap-2"><Trophy className="h-4 w-4 text-[var(--mx-warm)]" /> Your Progress</h2><div className="flex items-center gap-4 mb-4"><div className="h-12 w-12 rounded-xl bg-primary text-primary-foreground grid place-items-center font-bold text-lg">{gamification.level}</div><div className="flex-1"><p className="text-sm font-medium">Level {gamification.level}</p><p className="text-xs text-muted-foreground">{gamification.levelProgress.intoLevel} / {gamification.levelProgress.levelSpan} XP to level {gamification.level + 1}</p><Progress value={gamification.levelProgress.pct} className="h-1.5 mt-1" /></div><Badge variant="secondary" className="gap-1"><Star className="h-3 w-3" /> {gamification.xp} XP</Badge></div><div className="grid grid-cols-4 gap-2"><StatBox icon={Coins} value={gamification.coins} label="coins" tone="amber" /><StatBox icon={Flame} value={gamification.streakDays} label="day streak" tone="clay" /><StatBox icon={Trophy} value={achievements.unlocked} label="badges" tone="emerald" /><StatBox icon={Crown} value={data.cosmetics.owned} label="items" tone="muted" /></div></Card>}
        <Card className="p-5"><h2 className="font-semibold mb-4 flex items-center gap-2"><TrendingUp className="h-4 w-4 text-primary" /> Usage Stats</h2><div className="grid grid-cols-2 sm:grid-cols-3 gap-3"><UsageBox icon={MessageSquare} value={usage.chatMessages} label="Tutor messages" /><UsageBox icon={Camera} value={usage.homeworkScans} label="Homework scans" /><UsageBox icon={Brain} value={usage.reviewCards} label="Review cards" /><UsageBox icon={Sparkles} value={usage.memories} label="Memories stored" /><UsageBox icon={Calendar} value={usage.examPlans} label="Exam plans" /><UsageBox icon={Shield} value={usage.courses} label={user.role === 'TEACHER' ? 'Classes teaching' : 'Classes enrolled'} /></div></Card>
        <Card className="p-5"><h2 className="font-semibold mb-4 flex items-center gap-2"><Crown className="h-4 w-4 text-[var(--mx-warm)]" /> Your Plan</h2><div className="flex items-center justify-between mb-3"><span className={cn('text-sm font-medium px-3 py-1 rounded-full', TIER_COLORS[tier.current])}>{tier.limits.label}</span><Button variant="outline" size="sm" onClick={() => window.location.href = '/#pricing'}>Upgrade</Button></div><div className="grid grid-cols-2 gap-2 text-sm"><PlanLimit label="Daily chats" value={tier.limits.dailyChats === -1 ? 'Unlimited' : `${tier.limits.dailyChats}/day`} /><PlanLimit label="Homework scans" value={tier.limits.monthlyScans === -1 ? 'Unlimited' : `${tier.limits.monthlyScans}/mo`} /><PlanLimit label="Voice notes" value={tier.limits.voiceNotes ? '✓ Included' : '✗ Not included'} /><PlanLimit label="Solution mode" value={tier.limits.solutionMode ? '✓ Included' : '✗ Not included'} /></div></Card>
        {achievements && <Card className="p-5"><h2 className="font-semibold mb-4 flex items-center gap-2"><Trophy className="h-4 w-4 text-[var(--mx-warm)]" /> Achievements ({achievements.unlocked}/{achievements.total})</h2><div className="grid grid-cols-2 sm:grid-cols-4 gap-3">{achievements.list?.map((a: any) => <div key={a.key} className={cn('rounded-xl border p-3 text-center', a.unlocked ? 'border-[var(--mx-warm)]/30 bg-[var(--mx-warm-soft)]/30' : 'border-border/60 opacity-50')}><div className={cn('text-2xl mb-1', !a.unlocked && 'grayscale')}>{a.emoji}</div><p className="text-xs font-medium leading-tight">{a.name}</p><p className="text-[10px] text-muted-foreground mt-0.5">{a.desc}</p></div>)}</div></Card>}
        <Card className="p-5"><h2 className="font-semibold mb-3 text-sm">Account</h2><div className="space-y-1.5 text-sm text-muted-foreground"><p>Member since: {new Date(user.createdAt).toLocaleDateString(undefined, { year: 'numeric', month: 'long', day: 'numeric' })}</p>{gamification?.lastActive && <p>Last active: {new Date(gamification.lastActive).toLocaleString()}</p>}</div></Card>
        <DataControls userId={user.id} />
      </main>
    </div>
  )
}

function StatBox({ icon: Icon, value, label, tone }: { icon: React.ElementType; value: number; label: string; tone: string }) {
  const tones: Record<string, string> = { amber: 'bg-[var(--mx-warm)]/10 text-[var(--mx-warm)]', clay: 'bg-[var(--mx-clay)]/10 text-[var(--mx-clay)]', emerald: 'bg-primary/10 text-primary', muted: 'bg-muted text-muted-foreground' }
  return <div className={cn('rounded-lg p-2.5 text-center', tones[tone])}><Icon className="h-4 w-4 mx-auto mb-1" /><p className="font-bold text-sm leading-none">{value}</p><p className="text-[10px] mt-0.5">{label}</p></div>
}
function UsageBox({ icon: Icon, value, label }: { icon: React.ElementType; value: number; label: string }) {
  return <div className="rounded-xl border border-border/60 p-4"><div className="h-8 w-8 rounded-lg bg-primary/10 text-primary grid place-items-center mb-2"><Icon className="h-4 w-4" /></div><p className="text-2xl font-bold leading-none">{value}</p><p className="text-xs text-muted-foreground mt-1">{label}</p></div>
}
function PlanLimit({ label, value }: { label: string; value: string }) {
  return <div className="flex items-center justify-between rounded-lg bg-muted/30 px-3 py-2"><span className="text-xs text-muted-foreground">{label}</span><span className="text-xs font-medium">{value}</span></div>
}
