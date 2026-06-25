'use client'

import * as React from 'react'
import { CalendarClock, CheckCircle2, Circle, Clock, AlertTriangle, FileText, FlaskConical, BookOpen, ClipboardList } from 'lucide-react'
import { Card } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Progress } from '@/components/ui/progress'
import { useSession } from '@/lib/session'
import { api } from '@/lib/api-client'
import type { AssignmentLite, SubmissionStatus } from '@/lib/types'
import { cn } from '@/lib/utils'
import { toast } from 'sonner'

const STATUS_META: Record<SubmissionStatus, { label: string; color: string; icon: React.ElementType }> = {
  NOT_STARTED: { label: 'Not started', color: 'text-muted-foreground', icon: Circle },
  IN_PROGRESS: { label: 'In progress', color: 'text-[var(--mx-warm)]', icon: Clock },
  SUBMITTED: { label: 'Submitted', color: 'text-primary', icon: CheckCircle2 },
  GRADED: { label: 'Graded', color: 'text-primary', icon: CheckCircle2 },
}

const TYPE_ICON: Record<string, React.ElementType> = {
  HOMEWORK: ClipboardList,
  QUIZ: FileText,
  PROJECT: FlaskConical,
  ESSAY: FileText,
  READING: BookOpen,
}

export function StudentClassroom() {
  const { user } = useSession()
  const [assignments, setAssignments] = React.useState<AssignmentLite[]>([])
  const [loading, setLoading] = React.useState(true)

  const load = React.useCallback(async () => {
    if (!user) return
    setLoading(true)
    try {
      const r = await api.studentAssignments(user.id)
      setAssignments(r.assignments)
    } catch {
      toast.error('Could not load assignments')
    } finally {
      setLoading(false)
    }
  }, [user])

  React.useEffect(() => {
    load()
  }, [load])

  const overdue = assignments.filter((a) => a.daysUntilDue < 0 && a.status !== 'GRADED' && a.status !== 'SUBMITTED')
  const dueSoon = assignments.filter((a) => a.daysUntilDue >= 0 && a.daysUntilDue <= 3)
  const upcoming = assignments.filter((a) => a.daysUntilDue > 3)
  const done = assignments.filter((a) => a.status === 'GRADED' || a.status === 'SUBMITTED')

  return (
    <div className="space-y-5">
      {/* Google Classroom banner */}
      <Card className="overflow-hidden border-border/60">
        <div className="flex items-center gap-4 p-5 bg-gradient-to-r from-[var(--mx-emerald-soft)] to-[var(--mx-warm-soft)]/50">
          <div className="h-12 w-12 rounded-xl bg-card grid place-items-center shadow-sm shrink-0">
            <CalendarClock className="h-6 w-6 text-primary" />
          </div>
          <div className="flex-1 min-w-0">
            <h2 className="font-semibold text-lg">Google Classroom</h2>
            <p className="text-sm text-muted-foreground">
              Assignments sync automatically from your classes. <span className="text-primary">(Demo sync — real OAuth ready)</span>
            </p>
          </div>
          <Badge variant="secondary" className="hidden sm:flex gap-1">
            <span className="h-1.5 w-1.5 rounded-full bg-primary" /> Synced just now
          </Badge>
        </div>
      </Card>

      {/* Summary cards */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
        <SummaryCard label="Overdue" value={overdue.length} tone="clay" />
        <SummaryCard label="Due in ≤ 3 days" value={dueSoon.length} tone="amber" />
        <SummaryCard label="Upcoming" value={upcoming.length} tone="emerald" />
        <SummaryCard label="Done" value={done.length} tone="muted" />
      </div>

      {/* Lists */}
      <Section title="Overdue" items={overdue} loading={loading} empty="Nothing overdue. 🎉" highlight="clay" />
      <Section title="Due soon" items={dueSoon} loading={loading} empty="No assignments due in the next 3 days." highlight="amber" />
      <Section title="Upcoming" items={upcoming} loading={loading} empty="No upcoming assignments." />
      <Section title="Completed" items={done} loading={loading} empty="No completed assignments yet." />

      {/* progress footer */}
      <Card className="p-5">
        <div className="flex items-center justify-between mb-2">
          <p className="text-sm font-medium">Term completion</p>
          <p className="text-sm text-muted-foreground">
            {done.length} / {assignments.length} done
          </p>
        </div>
        <Progress value={assignments.length ? (done.length / assignments.length) * 100 : 0} className="h-2" />
      </Card>
    </div>
  )
}

function SummaryCard({ label, value, tone }: { label: string; value: number; tone: 'clay' | 'amber' | 'emerald' | 'muted' }) {
  const tones = {
    clay: 'text-[var(--mx-clay)] bg-[var(--mx-clay)]/10',
    amber: 'text-[var(--mx-warm)] bg-[var(--mx-warm)]/10',
    emerald: 'text-primary bg-primary/10',
    muted: 'text-muted-foreground bg-muted',
  }
  return (
    <Card className="p-4">
      <div className={cn('inline-flex items-center justify-center h-8 w-8 rounded-lg mb-2', tones[tone])}>
        <span className="font-bold text-sm">{value}</span>
      </div>
      <p className="text-xs text-muted-foreground leading-tight">{label}</p>
    </Card>
  )
}

function Section({
  title,
  items,
  loading,
  empty,
  highlight,
}: {
  title: string
  items: AssignmentLite[]
  loading: boolean
  empty: string
  highlight?: 'clay' | 'amber'
}) {
  return (
    <div>
      <div className="flex items-center gap-2 mb-2">
        <h3 className="font-semibold text-sm">{title}</h3>
        <Badge variant="outline" className="text-[11px]">{items.length}</Badge>
        {highlight === 'clay' && items.length > 0 && <AlertTriangle className="h-3.5 w-3.5 text-[var(--mx-clay)]" />}
        {highlight === 'amber' && items.length > 0 && <Clock className="h-3.5 w-3.5 text-[var(--mx-warm)]" />}
      </div>
      {loading ? (
        <div className="space-y-2">
          {[...Array(2)].map((_, i) => (
            <div key={i} className="h-20 rounded-xl bg-muted animate-pulse" />
          ))}
        </div>
      ) : items.length === 0 ? (
        <p className="text-sm text-muted-foreground py-3 pl-1">{empty}</p>
      ) : (
        <div className="space-y-2">
          {items.map((a) => (
            <AssignmentRow key={a.id} a={a} />
          ))}
        </div>
      )}
    </div>
  )
}

function AssignmentRow({ a }: { a: AssignmentLite }) {
  const meta = STATUS_META[a.status as SubmissionStatus]
  const Icon = TYPE_ICON[a.type] ?? FileText
  const SIcon = meta.icon
  const dueLabel =
    a.daysUntilDue < 0
      ? `${Math.abs(a.daysUntilDue)}d overdue`
      : a.daysUntilDue === 0
      ? 'Due today'
      : `Due in ${a.daysUntilDue}d`
  const dueColor =
    a.daysUntilDue < 0
      ? 'text-[var(--mx-clay)]'
      : a.daysUntilDue <= 1
      ? 'text-[var(--mx-warm)]'
      : 'text-muted-foreground'

  return (
    <Card className="p-4 hover:shadow-sm transition-shadow">
      <div className="flex items-start gap-3">
        <div className={cn('h-10 w-10 rounded-lg grid place-items-center shrink-0 bg-muted')}>
          <Icon className="h-5 w-5 text-muted-foreground" />
        </div>
        <div className="flex-1 min-w-0">
          <div className="flex items-start justify-between gap-2">
            <div className="min-w-0">
              <p className="font-medium text-sm truncate">{a.title}</p>
              <p className="text-xs text-muted-foreground">{a.courseName}</p>
            </div>
            <div className="flex items-center gap-1.5 shrink-0">
              <SIcon className={cn('h-3.5 w-3.5', meta.color)} />
              <span className={cn('text-xs font-medium', meta.color)}>{meta.label}</span>
            </div>
          </div>
          {a.description && (
            <p className="text-xs text-muted-foreground mt-1.5 line-clamp-2">{a.description}</p>
          )}
          <div className="flex items-center gap-3 mt-2 text-xs">
            <span className={cn('font-medium', dueColor)}>{dueLabel}</span>
            <span className="text-muted-foreground">·</span>
            <span className="text-muted-foreground">{a.type}</span>
            {a.score !== null && (
              <>
                <span className="text-muted-foreground">·</span>
                <span className="text-primary font-medium">{a.score}/{a.maxPoints}</span>
              </>
            )}
          </div>
        </div>
      </div>
    </Card>
  )
}
