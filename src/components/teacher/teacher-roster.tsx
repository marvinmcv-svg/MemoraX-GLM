'use client'

import * as React from 'react'
import { ArrowLeft, Users, AlertTriangle, CheckCircle2, Clock, Brain, MessageSquare, Send, ChevronDown } from 'lucide-react'
import { Card } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Progress } from '@/components/ui/progress'
import { Avatar, AvatarFallback } from '@/components/ui/avatar'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from '@/components/ui/dialog'
import { Textarea } from '@/components/ui/textarea'
import { Label } from '@/components/ui/label'
import { useSession } from '@/lib/session'
import { api } from '@/lib/api-client'
import { cn } from '@/lib/utils'
import { toast } from 'sonner'

interface RosterStudent {
  id: string
  name: string
  avatar: string | null
  grade: string | null
  stats: { total: number; done: number; inProgress: number; overdue: number; completion: number }
  assignments: {
    assignmentId: string
    title: string
    dueDate: string
    daysUntilDue: number
    status: string
    score: number | null
    maxPoints: number
  }[]
  recentMemories: { type: string; content: string; tags: string | null }[]
}

const STATUS_META: Record<string, { label: string; color: string }> = {
  NOT_STARTED: { label: 'Not started', color: 'text-muted-foreground' },
  IN_PROGRESS: { label: 'In progress', color: 'text-[var(--mx-warm)]' },
  SUBMITTED: { label: 'Submitted', color: 'text-primary' },
  GRADED: { label: 'Graded', color: 'text-primary' },
}

export function TeacherRoster({
  courseId,
  onClearCourse,
  onPickCourse,
}: {
  courseId: string | null
  onClearCourse: () => void
  onPickCourse: (id: string) => void
}) {
  const { user } = useSession()
  const [courses, setCourses] = React.useState<{ id: string; name: string }[]>([])
  const [activeId, setActiveId] = React.useState<string | null>(courseId)
  const [course, setCourse] = React.useState<{ name: string; subject: string | null } | null>(null)
  const [students, setStudents] = React.useState<RosterStudent[]>([])
  const [loading, setLoading] = React.useState(true)
  const [messageTo, setMessageTo] = React.useState<RosterStudent | null>(null)

  // load teacher's courses for the selector
  React.useEffect(() => {
    if (!user) return
    api.teacherCourses(user.id).then((r) => {
      setCourses(r.courses.map((c) => ({ id: c.id, name: c.name })))
      if (!activeId && r.courses.length > 0) setActiveId(r.courses[0].id)
    })
  }, [user, activeId])

  React.useEffect(() => {
    setActiveId(courseId)
  }, [courseId])

  // load roster
  React.useEffect(() => {
    if (!activeId) return
    setLoading(true)
    api
      .teacherStudents(activeId)
      .then((r) => {
        setCourse(r.course)
        setStudents(r.students)
      })
      .catch(() => toast.error('Could not load roster'))
      .finally(() => setLoading(false))
  }, [activeId])

  const pickCourse = (id: string) => {
    setActiveId(id)
    onPickCourse(id)
  }

  return (
    <div className="space-y-5">
      {/* header with course selector */}
      <div className="flex flex-col sm:flex-row sm:items-center gap-3">
        <Button variant="ghost" size="sm" className="gap-1.5 w-fit" onClick={onClearCourse}>
          <ArrowLeft className="h-4 w-4" /> Back to classes
        </Button>
        <div className="flex items-center gap-2 flex-1">
          {courses.length > 0 && (
            <Select value={activeId ?? undefined} onValueChange={pickCourse}>
              <SelectTrigger className="w-full sm:w-64">
                <SelectValue placeholder="Select a class" />
              </SelectTrigger>
              <SelectContent>
                {courses.map((c) => (
                  <SelectItem key={c.id} value={c.id}>{c.name}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          )}
          {course && (
            <Badge variant="secondary" className="hidden sm:flex">
              {students.length} students
            </Badge>
          )}
        </div>
      </div>

      {!activeId ? (
        <Card className="p-10 text-center">
          <div className="h-14 w-14 mx-auto rounded-2xl bg-primary/10 text-primary grid place-items-center mb-3">
            <Users className="h-7 w-7" />
          </div>
          <p className="font-medium">Select a class to see your roster</p>
          <p className="text-sm text-muted-foreground mt-1 max-w-sm mx-auto">
            Pick a class above, or head back to the Classes tab to create one.
          </p>
        </Card>
      ) : loading ? (
        <div className="space-y-3">
          {[...Array(3)].map((_, i) => (
            <div key={i} className="h-28 rounded-xl bg-muted animate-pulse" />
          ))}
        </div>
      ) : students.length === 0 ? (
        <Card className="p-10 text-center">
          <div className="h-14 w-14 mx-auto rounded-2xl bg-primary/10 text-primary grid place-items-center mb-3">
            <Users className="h-7 w-7" />
          </div>
          <p className="font-medium">No students enrolled yet</p>
          <p className="text-sm text-muted-foreground mt-1 max-w-sm mx-auto">
            Once students join this class, their progress and the tutor&apos;s insights will show up here.
          </p>
        </Card>
      ) : (
        <>
          {/* class summary */}
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
            <SummaryChip icon={Users} value={students.length} label="Students" tone="emerald" />
            <SummaryChip icon={AlertTriangle} value={students.reduce((a, s) => a + s.stats.overdue, 0)} label="Overdue items" tone="clay" />
            <SummaryChip icon={Clock} value={students.reduce((a, s) => a + s.stats.inProgress, 0)} label="In progress" tone="amber" />
            <SummaryChip icon={CheckCircle2} value={students.reduce((a, s) => a + s.stats.done, 0)} label="Completed" tone="emerald" />
          </div>

          {/* roster */}
          <div className="space-y-3">
            {students.map((s) => (
              <StudentRow key={s.id} s={s} onMessage={() => setMessageTo(s)} />
            ))}
          </div>
        </>
      )}

      {messageTo && (
        <MessageDialog student={messageTo} courseId={activeId!} onOpenChange={(o) => !o && setMessageTo(null)} />
      )}
    </div>
  )
}

function SummaryChip({ icon: Icon, value, label, tone }: { icon: React.ElementType; value: number; label: string; tone: 'emerald' | 'amber' | 'clay' }) {
  const tones = {
    emerald: 'bg-primary/10 text-primary',
    amber: 'bg-[var(--mx-warm)]/10 text-[var(--mx-warm)]',
    clay: 'bg-[var(--mx-clay)]/10 text-[var(--mx-clay)]',
  }
  return (
    <Card className="p-4 flex items-center gap-3">
      <div className={cn('h-9 w-9 rounded-lg grid place-items-center', tones[tone])}>
        <Icon className="h-4.5 w-4.5" />
      </div>
      <div>
        <p className="text-xl font-bold leading-none">{value}</p>
        <p className="text-xs text-muted-foreground mt-1">{label}</p>
      </div>
    </Card>
  )
}

function StudentRow({ s, onMessage }: { s: RosterStudent; onMessage: () => void }) {
  const [expanded, setExpanded] = React.useState(false)
  return (
    <Card className="overflow-hidden hover:shadow-md transition-shadow">
      <div className="p-4 flex items-center gap-3">
        <Avatar className="h-11 w-11 shrink-0">
          <AvatarFallback className="bg-[var(--mx-emerald-soft)]">{s.avatar ?? s.name[0]}</AvatarFallback>
        </Avatar>
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2">
            <p className="font-medium text-sm truncate">{s.name}</p>
            {s.stats.overdue > 0 && (
              <Badge variant="outline" className="text-[10px] text-[var(--mx-clay)] py-0 px-1.5">
                {s.stats.overdue} overdue
              </Badge>
            )}
          </div>
          <div className="flex items-center gap-3 mt-1 text-xs text-muted-foreground">
            <span>{s.stats.completion}% done</span>
            <span>· {s.stats.inProgress} in progress</span>
          </div>
          <Progress value={s.stats.completion} className="h-1 mt-1.5" />
        </div>
        <div className="flex items-center gap-1.5 shrink-0">
          <Button variant="outline" size="sm" className="gap-1.5" onClick={onMessage}>
            <MessageSquare className="h-3.5 w-3.5" /> Message
          </Button>
          <Button variant="ghost" size="icon" className="h-8 w-8" onClick={() => setExpanded((e) => !e)} aria-label={expanded ? 'Collapse details' : 'Expand details'} aria-expanded={expanded}>
            <ChevronDown className={cn('h-4 w-4 transition-transform', expanded && 'rotate-180')} />
          </Button>
        </div>
      </div>

      {expanded && (
        <div className="border-t bg-muted/20 p-4 space-y-4">
          {/* assignment breakdown */}
          <div>
            <p className="text-xs font-medium text-muted-foreground mb-2">Assignments</p>
            <div className="space-y-1.5">
              {s.assignments.map((a) => {
                const meta = STATUS_META[a.status] ?? STATUS_META.NOT_STARTED
                return (
                  <div key={a.assignmentId} className="flex items-center gap-2 text-sm">
                    <span className={cn('h-1.5 w-1.5 rounded-full', a.status === 'GRADED' ? 'bg-primary' : a.daysUntilDue < 0 ? 'bg-[var(--mx-clay)]' : 'bg-muted-foreground/40')} />
                    <span className="truncate flex-1">{a.title}</span>
                    {a.score !== null && <span className="text-xs text-primary">{a.score}/{a.maxPoints}</span>}
                    <span className={cn('text-xs font-medium', meta.color)}>{meta.label}</span>
                    <span className="text-xs text-muted-foreground w-16 text-right">
                      {a.daysUntilDue < 0 ? `${Math.abs(a.daysUntilDue)}d over` : a.daysUntilDue === 0 ? 'today' : `${a.daysUntilDue}d`}
                    </span>
                  </div>
                )
              })}
            </div>
          </div>
          {/* tutor insights (memories) */}
          {s.recentMemories.length > 0 && (
            <div>
              <p className="text-xs font-medium text-muted-foreground mb-2 flex items-center gap-1.5">
                <Brain className="h-3.5 w-3.5" /> Tutor insights (from MemoraX memory)
              </p>
              <div className="space-y-1.5">
                {s.recentMemories.map((m, i) => (
                  <div key={i} className="text-xs rounded-lg bg-[var(--mx-emerald-soft)]/40 p-2.5 flex gap-2">
                    <span className="font-medium shrink-0">{m.type.replace('_', ' ').toLowerCase()}:</span>
                    <span className="text-muted-foreground">{m.content}</span>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      )}
    </Card>
  )
}

function MessageDialog({
  student,
  courseId,
  onOpenChange,
}: {
  student: RosterStudent
  courseId: string
  onOpenChange: (o: boolean) => void
}) {
  const { user } = useSession()
  const [content, setContent] = React.useState('')
  const [sending, setSending] = React.useState(false)

  const send = async () => {
    if (!user || !content.trim()) return
    setSending(true)
    try {
      await api.teacherMessage({
        courseId,
        teacherId: user.id,
        studentId: student.id,
        content: content.trim(),
      })
      toast.success(`Message sent to ${student.name}`)
      setContent('')
      onOpenChange(false)
    } catch {
      toast.error('Could not send message')
    } finally {
      setSending(false)
    }
  }

  return (
    <Dialog open onOpenChange={onOpenChange}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Message {student.name}</DialogTitle>
          <DialogDescription>
            Sends through the MemoraX assistant. {student.name} will see it in their next chat.
          </DialogDescription>
        </DialogHeader>
        <div className="space-y-3 py-2">
          <div className="flex items-center gap-2 text-sm text-muted-foreground">
            <Avatar className="h-8 w-8">
              <AvatarFallback className="bg-[var(--mx-emerald-soft)] text-xs">{student.avatar ?? student.name[0]}</AvatarFallback>
            </Avatar>
            <span>{student.grade}</span>
          </div>
          <Label htmlFor="mc">Your message</Label>
          <Textarea
            id="mc"
            value={content}
            onChange={(e) => setContent(e.target.value)}
            placeholder="e.g. Great work on the factoring warm-up today! Keep practicing the AC method."
            rows={4}
          />
          <p className="text-xs text-muted-foreground">
            Quick suggestions: 👍 &quot;Great effort today!&quot; · 📚 &quot;Let&apos;s review at lunch&quot; · ⭐ &quot;Keep it up&quot;
          </p>
        </div>
        <DialogFooter>
          <Button variant="ghost" onClick={() => onOpenChange(false)}>Cancel</Button>
          <Button onClick={send} disabled={sending || !content.trim()} className="gap-1.5">
            <Send className="h-3.5 w-3.5" /> {sending ? 'Sending…' : 'Send message'}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}
