'use client'

import * as React from 'react'
import { Users, Heart, GraduationCap, AlertTriangle, Clock, CheckCircle2, BookOpen } from 'lucide-react'
import { Card } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Progress } from '@/components/ui/progress'
import { Avatar, AvatarFallback } from '@/components/ui/avatar'
import { useSession } from '@/lib/session'
import { api } from '@/lib/api-client'
import { cn } from '@/lib/utils'
import { toast } from 'sonner'

interface FamilyData {
  id: string
  name: string
  parents: { id: string; name: string; avatar: string | null; email: string }[]
  students: {
    id: string
    name: string
    avatar: string | null
    grade: string | null
    courses: string[]
    stats: { total: number; overdue: number; dueSoon: number; done: number }
    upcoming: { title: string; course: string; due: string; daysUntilDue: number }[]
  }[]
}

export function ParentFamily() {
  const { user } = useSession()
  const [family, setFamily] = React.useState<FamilyData | null>(null)
  const [loading, setLoading] = React.useState(true)

  React.useEffect(() => {
    if (!user) return
    api
      .parentFamily(user.id)
      .then((r) => setFamily(r.family))
      .catch(() => toast.error('Could not load family'))
      .finally(() => setLoading(false))
  }, [user])

  if (loading) {
    return (
      <div className="space-y-4">
        <div className="h-24 rounded-xl bg-muted animate-pulse" />
        <div className="grid sm:grid-cols-2 gap-4">
          <div className="h-48 rounded-xl bg-muted animate-pulse" />
          <div className="h-48 rounded-xl bg-muted animate-pulse" />
        </div>
      </div>
    )
  }

  if (!family) {
    return (
      <Card className="p-10 text-center">
        <Users className="h-10 w-10 mx-auto text-muted-foreground mb-3" />
        <p className="font-medium">No family bundle found</p>
        <p className="text-sm text-muted-foreground mt-1">Contact support to set up your family.</p>
      </Card>
    )
  }

  return (
    <div className="space-y-5">
      {/* Family header */}
      <Card className="overflow-hidden">
        <div className="flex flex-col sm:flex-row items-start sm:items-center gap-4 p-5 bg-gradient-to-r from-[var(--mx-emerald-soft)] to-[var(--mx-warm-soft)]/40">
          <div className="h-14 w-14 rounded-2xl bg-card grid place-items-center shadow-sm shrink-0">
            <Heart className="h-7 w-7 text-[var(--mx-clay)]" />
          </div>
          <div className="flex-1 min-w-0">
            <h2 className="font-semibold text-xl">{family.name}</h2>
            <p className="text-sm text-muted-foreground">
              {family.parents.length} parents · {family.students.length} students
            </p>
          </div>
          <div className="flex items-center -space-x-2">
            {[...family.parents, ...family.students].map((m) => (
              <div
                key={m.id}
                className="h-9 w-9 rounded-full bg-card border-2 border-background grid place-items-center text-lg shadow-sm"
                title={m.name}
              >
                {m.avatar ?? m.name[0]}
              </div>
            ))}
          </div>
        </div>
      </Card>

      {/* Parents */}
      <div>
        <h3 className="font-semibold text-sm mb-2 flex items-center gap-2">
          <Heart className="h-4 w-4 text-[var(--mx-clay)]" /> Parents
          <Badge variant="outline" className="text-[11px]">{family.parents.length}/2</Badge>
        </h3>
        <div className="grid sm:grid-cols-2 gap-3">
          {family.parents.map((p) => (
            <Card key={p.id} className="p-4 flex items-center gap-3">
              <Avatar className="h-11 w-11">
                <AvatarFallback className="bg-[var(--mx-warm-soft)]">{p.avatar ?? p.name[0]}</AvatarFallback>
              </Avatar>
              <div className="min-w-0">
                <p className="font-medium text-sm truncate">{p.name}</p>
                <p className="text-xs text-muted-foreground truncate">{p.email}</p>
              </div>
              <Badge variant="secondary" className="ml-auto text-[11px]">Receives all reminders</Badge>
            </Card>
          ))}
          {family.parents.length < 2 && (
            <Card className="p-4 flex items-center gap-3 border-dashed">
              <div className="h-11 w-11 rounded-full bg-muted grid place-items-center text-muted-foreground">
                <Users className="h-5 w-5" />
              </div>
              <div>
                <p className="font-medium text-sm">Add a second parent</p>
                <p className="text-xs text-muted-foreground">Both parents see the same reminders.</p>
              </div>
            </Card>
          )}
        </div>
      </div>

      {/* Students */}
      <div>
        <h3 className="font-semibold text-sm mb-2 flex items-center gap-2">
          <GraduationCap className="h-4 w-4 text-primary" /> Students
          <Badge variant="outline" className="text-[11px]">{family.students.length}</Badge>
        </h3>
        <div className="grid lg:grid-cols-2 gap-4">
          {family.students.map((s) => (
            <StudentCard key={s.id} s={s} />
          ))}
        </div>
      </div>
    </div>
  )
}

function StudentCard({ s }: { s: FamilyData['students'][number] }) {
  const completion = s.stats.total ? Math.round((s.stats.done / s.stats.total) * 100) : 0
  return (
    <Card className="p-5">
      <div className="flex items-center gap-3 mb-4">
        <Avatar className="h-12 w-12">
          <AvatarFallback className="bg-[var(--mx-emerald-soft)] text-lg">{s.avatar ?? s.name[0]}</AvatarFallback>
        </Avatar>
        <div className="flex-1 min-w-0">
          <p className="font-semibold truncate">{s.name}</p>
          <p className="text-xs text-muted-foreground">{s.grade} · {s.courses.length} classes</p>
        </div>
      </div>

      {/* stat chips */}
      <div className="grid grid-cols-4 gap-2 mb-4">
        <StatChip icon={AlertTriangle} value={s.stats.overdue} label="overdue" tone="clay" />
        <StatChip icon={Clock} value={s.stats.dueSoon} label="due ≤3d" tone="amber" />
        <StatChip icon={CheckCircle2} value={s.stats.done} label="done" tone="emerald" />
        <StatChip icon={BookOpen} value={s.stats.total} label="total" tone="muted" />
      </div>

      {/* completion */}
      <div className="mb-4">
        <div className="flex justify-between text-xs mb-1">
          <span className="text-muted-foreground">Term completion</span>
          <span className="font-medium">{completion}%</span>
        </div>
        <Progress value={completion} className="h-1.5" />
      </div>

      {/* upcoming */}
      <div>
        <p className="text-xs font-medium text-muted-foreground mb-2">Coming up</p>
        {s.upcoming.length === 0 ? (
          <p className="text-sm text-muted-foreground">Nothing due soon. 🎉</p>
        ) : (
          <ul className="space-y-1.5">
            {s.upcoming.map((u, i) => (
              <li key={i} className="flex items-center gap-2 text-sm">
                <span
                  className={cn(
                    'h-1.5 w-1.5 rounded-full shrink-0',
                    u.daysUntilDue < 0 ? 'bg-[var(--mx-clay)]' : u.daysUntilDue <= 1 ? 'bg-[var(--mx-warm)]' : 'bg-primary'
                  )}
                />
                <span className="truncate flex-1">{u.title}</span>
                <span className="text-xs text-muted-foreground shrink-0">{u.course}</span>
                <span
                  className={cn(
                    'text-xs font-medium shrink-0',
                    u.daysUntilDue < 0 ? 'text-[var(--mx-clay)]' : u.daysUntilDue <= 1 ? 'text-[var(--mx-warm)]' : 'text-muted-foreground'
                  )}
                >
                  {u.daysUntilDue < 0 ? `${Math.abs(u.daysUntilDue)}d over` : u.daysUntilDue === 0 ? 'today' : `${u.daysUntilDue}d`}
                </span>
              </li>
            ))}
          </ul>
        )}
      </div>
    </Card>
  )
}

function StatChip({ icon: Icon, value, label, tone }: { icon: React.ElementType; value: number; label: string; tone: 'clay' | 'amber' | 'emerald' | 'muted' }) {
  const tones = {
    clay: 'text-[var(--mx-clay)] bg-[var(--mx-clay)]/10',
    amber: 'text-[var(--mx-warm)] bg-[var(--mx-warm)]/10',
    emerald: 'text-primary bg-primary/10',
    muted: 'text-muted-foreground bg-muted',
  }
  return (
    <div className={cn('rounded-lg p-2 text-center', tones[tone])}>
      <Icon className="h-3.5 w-3.5 mx-auto mb-0.5" />
      <p className="text-base font-bold leading-none">{value}</p>
      <p className="text-[10px] mt-0.5">{label}</p>
    </div>
  )
}
