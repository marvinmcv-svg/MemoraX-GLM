'use client'

import * as React from 'react'
import { BellRing, CheckCheck, Clock, AlertTriangle, TrendingUp, BookOpen, Sparkles, RefreshCw } from 'lucide-react'
import { Card } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { useSession } from '@/lib/session'
import { api } from '@/lib/api-client'
import type { ReminderLite, ReminderType } from '@/lib/types'
import { cn } from '@/lib/utils'
import { toast } from 'sonner'

const TYPE_META: Record<ReminderType, { icon: React.ElementType; color: string; ring: string }> = {
  DAILY_DIGEST: { icon: BookOpen, color: 'text-primary', ring: 'ring-[var(--mx-emerald-soft)]' },
  DUE_TODAY: { icon: Clock, color: 'text-[var(--mx-warm)]', ring: 'ring-[var(--mx-warm-soft)]' },
  DUE_SOON: { icon: Clock, color: 'text-[var(--mx-warm)]', ring: 'ring-[var(--mx-warm-soft)]' },
  OVERDUE: { icon: AlertTriangle, color: 'text-[var(--mx-clay)]', ring: 'ring-[var(--mx-clay)]/30' },
  PROGRESS_UPDATE: { icon: TrendingUp, color: 'text-emerald-600', ring: 'ring-[var(--mx-emerald-soft)]' },
}

export function ParentInbox({ refreshKey }: { refreshKey: number }) {
  const { user } = useSession()
  const [reminders, setReminders] = React.useState<ReminderLite[]>([])
  const [loading, setLoading] = React.useState(true)

  const load = React.useCallback(async () => {
    if (!user) return
    setLoading(true)
    try {
      const r = await api.parentReminders(user.id)
      setReminders(r.reminders)
    } catch {
      toast.error('Could not load reminders')
    } finally {
      setLoading(false)
    }
  }, [user])

  React.useEffect(() => {
    load()
  }, [load, refreshKey])

  const markRead = async (id: string) => {
    setReminders((rs) => rs.map((r) => (r.id === id ? { ...r, readAt: new Date().toISOString() } : r)))
    try {
      await api.markReminderRead(id)
    } catch {
      /* best-effort */
    }
  }

  const markAllRead = async () => {
    const unread = reminders.filter((r) => !r.readAt)
    if (unread.length === 0) return
    setReminders((rs) => rs.map((r) => ({ ...r, readAt: r.readAt ?? new Date().toISOString() })))
    await Promise.all(unread.map((r) => api.markReminderRead(r.id).catch(() => {})))
    toast.success(`Marked ${unread.length} as read`)
  }

  const unread = reminders.filter((r) => !r.readAt).length

  return (
    <div className="grid lg:grid-cols-[1fr_320px] gap-5">
      {/* WhatsApp-style inbox */}
      <Card className="overflow-hidden flex flex-col h-[calc(100vh-220px)] min-h-[480px]">
        {/* inbox header */}
        <div className="flex items-center gap-3 px-4 py-3 border-b bg-[var(--mx-emerald-soft)]/50">
          <div className="relative h-10 w-10 rounded-full bg-primary grid place-items-center text-primary-foreground shrink-0">
            <BellRing className="h-5 w-5" />
          </div>
          <div className="flex-1 min-w-0">
            <p className="font-medium leading-tight">MemoraX Family</p>
            <p className="text-[11px] text-muted-foreground">
              {unread > 0 ? `${unread} unread reminder${unread > 1 ? 's' : ''}` : 'all caught up ✓'}
            </p>
          </div>
          {unread > 0 && (
            <Button variant="ghost" size="sm" className="gap-1.5" onClick={markAllRead}>
              <CheckCheck className="h-3.5 w-3.5" /> Mark all read
            </Button>
          )}
        </div>

        {/* message list */}
        <div className="flex-1 overflow-y-auto chat-bg scroll-thin">
          {loading ? (
            <div className="space-y-3 p-4">
              {[...Array(4)].map((_, i) => (
                <div key={i} className="flex gap-3">
                  <div className="h-10 w-10 rounded-full bg-muted animate-pulse shrink-0" />
                  <div className="flex-1 space-y-2">
                    <div className="h-4 w-1/2 bg-muted animate-pulse rounded" />
                    <div className="h-16 bg-muted animate-pulse rounded-xl" />
                  </div>
                </div>
              ))}
            </div>
          ) : reminders.length === 0 ? (
            <div className="h-full flex flex-col items-center justify-center text-center px-6 py-10">
              <BellRing className="h-10 w-10 text-muted-foreground mb-3" />
              <p className="font-medium">No reminders yet</p>
              <p className="text-sm text-muted-foreground mt-1 max-w-xs">
                Tap “Refresh digest” to generate today&apos;s 7 PM homework digest for your kids.
              </p>
            </div>
          ) : (
            <div className="p-3 sm:p-4 space-y-4">
              {reminders.map((r) => (
                <ReminderMessage key={r.id} r={r} onRead={() => markRead(r.id)} />
              ))}
            </div>
          )}
        </div>
      </Card>

      {/* Side panel — digest schedule */}
      <div className="space-y-4">
        <Card className="p-5">
          <div className="flex items-center gap-2 mb-3">
            <Clock className="h-4 w-4 text-primary" />
            <h3 className="font-semibold text-sm">Reminder schedule</h3>
          </div>
          <ul className="space-y-2.5 text-sm">
            <ScheduleItem time="7:00 PM daily" label="Homework digest" desc="Everything due this week, per kid." tone="emerald" />
            <ScheduleItem time="Morning of due date" label="Due-today alert" desc="A reminder lands at 7 AM if something's due that day." tone="amber" />
            <ScheduleItem time="As they happen" label="Overdue alerts" desc="When an assignment slips past its due date." tone="clay" />
            <ScheduleItem time="Weekly" label="Progress update" desc="How your kid is trending — improvements and weak spots." tone="emerald" />
          </ul>
        </Card>

        <Card className="p-5 bg-[var(--mx-emerald-soft)]/30">
          <div className="flex items-start gap-3">
            <div className="h-9 w-9 rounded-lg bg-primary/10 text-primary grid place-items-center shrink-0">
              <Sparkles className="h-4.5 w-4.5" />
            </div>
            <div>
              <p className="font-medium text-sm">Two parents, one inbox</p>
              <p className="text-xs text-muted-foreground mt-1 leading-relaxed">
                Both parents in the family bundle see the same reminders — so nobody misses a due
                date. Toggle who gets pinged per kid in settings.
              </p>
            </div>
          </div>
        </Card>
      </div>
    </div>
  )
}

function ReminderMessage({ r, onRead }: { r: ReminderLite; onRead: () => void }) {
  const meta = TYPE_META[r.type as ReminderType] ?? TYPE_META.DAILY_DIGEST
  const Icon = meta.icon
  const unread = !r.readAt
  return (
    <div className={cn('flex gap-3 msg-in', !unread && 'opacity-70')}>
      <div className="h-10 w-10 rounded-full bg-card border grid place-items-center text-lg shrink-0 shadow-sm">
        {r.studentAvatar ?? '🎒'}
      </div>
      <div className="flex-1 min-w-0">
        <div className="flex items-center gap-2 mb-1">
          <span className="text-sm font-medium truncate">{r.studentName}</span>
          {unread && <span className="h-2 w-2 rounded-full bg-primary shrink-0" />}
          <span className="text-[10px] text-muted-foreground ml-auto shrink-0">
            {r.sentAt ? new Date(r.sentAt).toLocaleString(undefined, { month: 'short', day: 'numeric', hour: 'numeric', minute: '2-digit' }) : 'scheduled'}
          </span>
        </div>
        <div
          className={cn(
            'rounded-2xl rounded-tl-md px-3.5 py-2.5 shadow-sm border bg-card',
            meta.ring,
            unread && 'ring-1'
          )}
        >
          <div className="flex items-center gap-1.5 mb-1">
            <Icon className={cn('h-3.5 w-3.5', meta.color)} />
            <p className="text-xs font-medium">{r.title}</p>
          </div>
          <p className="text-sm leading-relaxed whitespace-pre-line">{r.body}</p>
        </div>
        {unread && (
          <button onClick={onRead} className="text-[11px] text-primary hover:underline mt-1 ml-1">
            Mark as read
          </button>
        )}
      </div>
    </div>
  )
}

function ScheduleItem({ time, label, desc, tone }: { time: string; label: string; desc: string; tone: 'emerald' | 'amber' | 'clay' }) {
  const dot = tone === 'emerald' ? 'bg-primary' : tone === 'amber' ? 'bg-[var(--mx-warm)]' : 'bg-[var(--mx-clay)]'
  return (
    <li className="flex gap-3">
      <span className={cn('h-2 w-2 rounded-full mt-1.5 shrink-0', dot)} />
      <div className="min-w-0">
        <p className="text-xs text-muted-foreground">{time}</p>
        <p className="text-sm font-medium">{label}</p>
        <p className="text-xs text-muted-foreground leading-relaxed">{desc}</p>
      </div>
    </li>
  )
}
