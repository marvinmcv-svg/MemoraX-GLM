'use client'

import * as React from 'react'
import { CalendarPlus, Loader2, Calendar, Clock, CheckCircle2, Sparkles, BookOpen } from 'lucide-react'
import { Card } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from '@/components/ui/dialog'
import { useSession } from '@/lib/session'
import { api } from '@/lib/api-client'
import { cn } from '@/lib/utils'
import { toast } from 'sonner'

interface ExamPlanData {
  id: string
  title: string
  examDate: string
  plan: { days: { day: number; date: string; theme: string; tasks: string[]; estimatedMinutes: number }[] }
  createdAt: string
}

export function StudentExamPrep() {
  const { user } = useSession()
  const [plans, setPlans] = React.useState<ExamPlanData[]>([])
  const [loading, setLoading] = React.useState(true)
  const [showNew, setShowNew] = React.useState(false)
  const [expanded, setExpanded] = React.useState<string | null>(null)

  const load = React.useCallback(async () => {
    if (!user) return
    setLoading(true)
    try {
      const r = await api.examPlans(user.id)
      setPlans(r.plans)
    } catch {
      toast.error('Could not load exam plans')
    } finally {
      setLoading(false)
    }
  }, [user])

  React.useEffect(() => {
    load()
  }, [load])

  return (
    <div className="space-y-5">
      <Card className="overflow-hidden">
        <div className="flex items-center gap-4 p-5 bg-gradient-to-r from-[var(--mx-warm-soft)] to-[var(--mx-emerald-soft)]/40">
          <div className="h-12 w-12 rounded-xl bg-card grid place-items-center shadow-sm shrink-0">
            <CalendarPlus className="h-6 w-6 text-[var(--mx-warm)]" />
          </div>
          <div className="flex-1 min-w-0">
            <h2 className="font-semibold text-lg">Exam prep</h2>
            <p className="text-sm text-muted-foreground">
              The tutor builds a personalized study plan from your memory layer and assignments.
            </p>
          </div>
          <Button size="sm" className="gap-1.5 shrink-0" onClick={() => setShowNew(true)}>
            <CalendarPlus className="h-4 w-4" /> New plan
          </Button>
        </div>
      </Card>

      {loading ? (
        <div className="space-y-3">
          {[...Array(2)].map((_, i) => (
            <div key={i} className="h-32 rounded-xl bg-muted animate-pulse" />
          ))}
        </div>
      ) : plans.length === 0 ? (
        <Card className="p-10 text-center">
          <Calendar className="h-10 w-10 mx-auto text-muted-foreground mb-3" />
          <p className="font-medium">No exam plans yet</p>
          <p className="text-sm text-muted-foreground mt-1 max-w-sm mx-auto">
            Got a test coming up? Create a plan and the tutor will design a day-by-day study schedule
            based on what you already know and where you struggle.
          </p>
          <Button className="mt-5 gap-1.5" onClick={() => setShowNew(true)}>
            <Sparkles className="h-4 w-4" /> Create your first plan
          </Button>
        </Card>
      ) : (
        <div className="space-y-3">
          {plans.map((p) => {
            const daysUntil = Math.ceil((new Date(p.examDate).getTime() - Date.now()) / 86400000)
            const isOpen = expanded === p.id
            return (
              <Card key={p.id} className="overflow-hidden">
                <button
                  onClick={() => setExpanded(isOpen ? null : p.id)}
                  className="w-full flex items-center gap-4 p-4 text-left hover:bg-muted/30 transition-colors"
                >
                  <div className="h-11 w-11 rounded-xl bg-[var(--mx-warm-soft)] grid place-items-center shrink-0">
                    <BookOpen className="h-5 w-5 text-[var(--mx-warm)]" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="font-medium truncate">{p.title}</p>
                    <div className="flex items-center gap-3 mt-0.5 text-xs text-muted-foreground">
                      <span className="flex items-center gap-1">
                        <Calendar className="h-3 w-3" />
                        {new Date(p.examDate).toLocaleDateString(undefined, { month: 'short', day: 'numeric' })}
                      </span>
                      <span className={cn('font-medium', daysUntil < 0 ? 'text-[var(--mx-clay)]' : daysUntil <= 3 ? 'text-[var(--mx-warm)]' : '')}>
                        {daysUntil < 0 ? `${Math.abs(daysUntil)}d ago` : daysUntil === 0 ? 'today!' : `in ${daysUntil}d`}
                      </span>
                      <span>· {p.plan.days?.length ?? 0} days</span>
                    </div>
                  </div>
                  <Badge variant="outline" className="text-[11px] shrink-0">{p.plan.days?.length ?? 0} days</Badge>
                </button>
                {isOpen && (
                  <div className="border-t bg-muted/20 p-4 space-y-3">
                    {p.plan.days?.map((d) => (
                      <div key={d.day} className="rounded-lg bg-card border p-3">
                        <div className="flex items-center gap-2 mb-2">
                          <div className="h-7 w-7 rounded-lg bg-primary text-primary-foreground grid place-items-center text-xs font-bold shrink-0">
                            {d.day}
                          </div>
                          <div className="flex-1 min-w-0">
                            <p className="text-sm font-medium">{d.theme}</p>
                            <p className="text-[11px] text-muted-foreground">
                              {d.date} · ~{d.estimatedMinutes} min
                            </p>
                          </div>
                          <Clock className="h-3.5 w-3.5 text-muted-foreground" />
                        </div>
                        <ul className="space-y-1.5">
                          {d.tasks?.map((t, i) => (
                            <li key={i} className="flex items-start gap-2 text-sm">
                              <CheckCircle2 className="h-3.5 w-3.5 mt-0.5 text-muted-foreground/50 shrink-0" />
                              <span>{t}</span>
                            </li>
                          ))}
                        </ul>
                      </div>
                    ))}
                  </div>
                )}
              </Card>
            )
          })}
        </div>
      )}

      {showNew && (
        <NewPlanDialog
          onOpenChange={(o) => !o && setShowNew(false)}
          onCreated={() => {
            setShowNew(false)
            load()
            toast.success('Study plan created! +25 XP')
          }}
        />
      )}
    </div>
  )
}

function NewPlanDialog({ onOpenChange, onCreated }: { onOpenChange: (o: boolean) => void; onCreated: () => void }) {
  const { user } = useSession()
  const [title, setTitle] = React.useState('')
  const [examDate, setExamDate] = React.useState('')
  const [subject, setSubject] = React.useState('')
  const [saving, setSaving] = React.useState(false)

  const submit = async () => {
    if (!user || !title.trim() || !examDate) {
      toast.error('Title and exam date are required')
      return
    }
    setSaving(true)
    try {
      await api.createExamPlan(user.id, { title, examDate, subject })
      setTitle('')
      setExamDate('')
      setSubject('')
      onCreated()
    } catch {
      toast.error('Could not create plan')
    } finally {
      setSaving(false)
    }
  }

  // default date = 7 days from now
  React.useEffect(() => {
    if (!examDate) {
      const d = new Date()
      d.setDate(d.getDate() + 7)
      setExamDate(d.toISOString().slice(0, 10))
    }
  }, [examDate])

  return (
    <Dialog open onOpenChange={onOpenChange}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Create an exam study plan</DialogTitle>
          <DialogDescription>
            The tutor will design a day-by-day plan using your memory layer and upcoming assignments.
          </DialogDescription>
        </DialogHeader>
        <div className="space-y-4 py-2">
          <div className="space-y-1.5">
            <Label htmlFor="et">Exam title</Label>
            <Input id="et" value={title} onChange={(e) => setTitle(e.target.value)} placeholder="e.g. Biology Midterm" />
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-1.5">
              <Label htmlFor="ed">Exam date</Label>
              <Input id="ed" type="date" value={examDate} onChange={(e) => setExamDate(e.target.value)} />
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="es">Subject (optional)</Label>
              <Input id="es" value={subject} onChange={(e) => setSubject(e.target.value)} placeholder="Biology" />
            </div>
          </div>
        </div>
        <DialogFooter>
          <Button variant="ghost" onClick={() => onOpenChange(false)}>Cancel</Button>
          <Button onClick={submit} disabled={saving || !title.trim() || !examDate} className="gap-1.5">
            {saving ? <><Loader2 className="h-4 w-4 animate-spin" /> Generating plan…</> : <><Sparkles className="h-4 w-4" /> Generate plan</>}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}
