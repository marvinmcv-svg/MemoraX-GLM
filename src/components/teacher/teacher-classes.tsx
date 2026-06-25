'use client'

import * as React from 'react'
import { Plus, Users, ClipboardList, ArrowRight, Calendar, FlaskConical, BookOpen, FileText } from 'lucide-react'
import { Card } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Input } from '@/components/ui/input'
import { Textarea } from '@/components/ui/textarea'
import { Label } from '@/components/ui/label'
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from '@/components/ui/dialog'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { useSession } from '@/lib/session'
import { api } from '@/lib/api-client'
import { cn } from '@/lib/utils'
import { toast } from 'sonner'

interface CourseLite {
  id: string
  name: string
  subject: string | null
  color: string
  room: string | null
  studentCount: number
  assignmentCount: number
}

const COLORS = [
  { id: 'emerald', label: 'Emerald', class: 'bg-primary' },
  { id: 'teal', label: 'Teal', class: 'bg-[var(--mx-emerald)]' },
  { id: 'amber', label: 'Amber', class: 'bg-[var(--mx-warm)]' },
  { id: 'clay', label: 'Clay', class: 'bg-[var(--mx-clay)]' },
]

export function TeacherClasses({ onOpenCourse }: { onOpenCourse: (id: string) => void }) {
  const { user } = useSession()
  const [courses, setCourses] = React.useState<CourseLite[]>([])
  const [loading, setLoading] = React.useState(true)
  const [showNewClass, setShowNewClass] = React.useState(false)
  const [showNewAssignment, setShowNewAssignment] = React.useState<string | null>(null)

  const load = React.useCallback(async () => {
    if (!user) return
    setLoading(true)
    try {
      const r = await api.teacherCourses(user.id)
      setCourses(r.courses)
    } catch {
      toast.error('Could not load classes')
    } finally {
      setLoading(false)
    }
  }, [user])

  React.useEffect(() => {
    load()
  }, [load])

  const totalStudents = new Set<string>().size // not tracked here; sum below
  const totalAssignments = courses.reduce((a, c) => a + c.assignmentCount, 0)
  const totalStudentsSum = courses.reduce((a, c) => a + c.studentCount, 0)

  return (
    <div className="space-y-5">
      {/* summary */}
      <div className="grid grid-cols-3 gap-3">
        <Card className="p-4">
          <p className="text-2xl font-bold text-primary">{courses.length}</p>
          <p className="text-xs text-muted-foreground mt-1">Classes</p>
        </Card>
        <Card className="p-4">
          <p className="text-2xl font-bold text-primary">{totalStudentsSum}</p>
          <p className="text-xs text-muted-foreground mt-1">Enrollments</p>
        </Card>
        <Card className="p-4">
          <p className="text-2xl font-bold text-primary">{totalAssignments}</p>
          <p className="text-xs text-muted-foreground mt-1">Assignments</p>
        </Card>
      </div>

      <div className="flex items-center justify-between">
        <h2 className="font-semibold text-lg">My classes</h2>
        <Button size="sm" className="gap-1.5" onClick={() => setShowNewClass(true)}>
          <Plus className="h-4 w-4" /> New class
        </Button>
      </div>

      {loading ? (
        <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {[...Array(3)].map((_, i) => (
            <div key={i} className="h-36 rounded-xl bg-muted animate-pulse" />
          ))}
        </div>
      ) : courses.length === 0 ? (
        <Card className="p-10 text-center">
          <Users className="h-10 w-10 mx-auto text-muted-foreground mb-3" />
          <p className="font-medium">No classes yet</p>
          <p className="text-sm text-muted-foreground mt-1">Create your first class to get started.</p>
        </Card>
      ) : (
        <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {courses.map((c) => (
            <CourseCard
              key={c.id}
              c={c}
              onOpen={() => onOpenCourse(c.id)}
              onAddAssignment={() => setShowNewAssignment(c.id)}
            />
          ))}
        </div>
      )}

      <NewClassDialog
        open={showNewClass}
        onOpenChange={setShowNewClass}
        onCreated={() => {
          setShowNewClass(false)
          load()
        }}
      />
      {showNewAssignment && (
        <NewAssignmentDialog
          courseId={showNewAssignment}
          courseName={courses.find((c) => c.id === showNewAssignment)?.name ?? ''}
          onOpenChange={(o) => !o && setShowNewAssignment(null)}
          onCreated={() => {
            setShowNewAssignment(null)
            load()
            toast.success('Assignment posted — it synced to every enrolled student.')
          }}
        />
      )}
    </div>
  )
}

function CourseCard({
  c,
  onOpen,
  onAddAssignment,
}: {
  c: CourseLite
  onOpen: () => void
  onAddAssignment: () => void
}) {
  const colorClass = COLORS.find((x) => x.id === c.color)?.class ?? 'bg-primary'
  return (
    <Card className="p-5 hover:shadow-md transition-shadow group">
      <div className="flex items-start gap-3 mb-4">
        <div className={cn('h-11 w-11 rounded-xl grid place-items-center text-primary-foreground shrink-0', colorClass)}>
          <BookOpen className="h-5 w-5" />
        </div>
        <div className="flex-1 min-w-0">
          <p className="font-semibold truncate">{c.name}</p>
          <p className="text-xs text-muted-foreground">
            {c.subject ?? 'General'}{c.room ? ` · ${c.room}` : ''}
          </p>
        </div>
      </div>
      <div className="flex items-center gap-4 text-sm text-muted-foreground mb-4">
        <span className="flex items-center gap-1.5">
          <Users className="h-3.5 w-3.5" /> {c.studentCount}
        </span>
        <span className="flex items-center gap-1.5">
          <ClipboardList className="h-3.5 w-3.5" /> {c.assignmentCount}
        </span>
      </div>
      <div className="flex items-center gap-2">
        <Button variant="outline" size="sm" className="flex-1 gap-1.5" onClick={onOpen}>
          View roster <ArrowRight className="h-3.5 w-3.5" />
        </Button>
        <Button variant="ghost" size="sm" className="gap-1.5" onClick={onAddAssignment}>
          <Plus className="h-3.5 w-3.5" /> Assignment
        </Button>
      </div>
    </Card>
  )
}

function NewClassDialog({
  open,
  onOpenChange,
  onCreated,
}: {
  open: boolean
  onOpenChange: (o: boolean) => void
  onCreated: () => void
}) {
  const { user } = useSession()
  const [name, setName] = React.useState('')
  const [subject, setSubject] = React.useState('')
  const [room, setRoom] = React.useState('')
  const [color, setColor] = React.useState('emerald')
  const [saving, setSaving] = React.useState(false)

  const submit = async () => {
    if (!user || !name.trim()) return
    setSaving(true)
    try {
      await api.createCourse(user.id, { name, subject, color, room })
      setName('')
      setSubject('')
      setRoom('')
      setColor('emerald')
      onCreated()
      toast.success('Class created')
    } catch {
      toast.error('Could not create class')
    } finally {
      setSaving(false)
    }
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Create a new class</DialogTitle>
          <DialogDescription>Students enrolled will see assignments sync to their Classroom tab.</DialogDescription>
        </DialogHeader>
        <div className="space-y-4 py-2">
          <div className="space-y-1.5">
            <Label htmlFor="cn">Class name</Label>
            <Input id="cn" value={name} onChange={(e) => setName(e.target.value)} placeholder="e.g. Algebra II" />
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-1.5">
              <Label htmlFor="cs">Subject</Label>
              <Input id="cs" value={subject} onChange={(e) => setSubject(e.target.value)} placeholder="Math" />
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="cr">Room</Label>
              <Input id="cr" value={room} onChange={(e) => setRoom(e.target.value)} placeholder="Room 204" />
            </div>
          </div>
          <div className="space-y-1.5">
            <Label>Color</Label>
            <div className="flex gap-2">
              {COLORS.map((c) => (
                <button
                  key={c.id}
                  type="button"
                  onClick={() => setColor(c.id)}
                  className={cn(
                    'h-9 w-9 rounded-lg grid place-items-center transition-all',
                    c.class,
                    color === c.id ? 'ring-2 ring-offset-2 ring-ring scale-110' : 'opacity-70 hover:opacity-100'
                  )}
                  aria-label={c.label}
                />
              ))}
            </div>
          </div>
        </div>
        <DialogFooter>
          <Button variant="ghost" onClick={() => onOpenChange(false)}>Cancel</Button>
          <Button onClick={submit} disabled={saving || !name.trim()}>
            {saving ? 'Creating…' : 'Create class'}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}

function NewAssignmentDialog({
  courseId,
  courseName,
  onOpenChange,
  onCreated,
}: {
  courseId: string
  courseName: string
  onOpenChange: (o: boolean) => void
  onCreated: () => void
}) {
  const [title, setTitle] = React.useState('')
  const [description, setDescription] = React.useState('')
  const [dueDate, setDueDate] = React.useState('')
  const [type, setType] = React.useState('HOMEWORK')
  const [maxPoints, setMaxPoints] = React.useState('100')
  const [saving, setSaving] = React.useState(false)

  const submit = async () => {
    if (!title.trim() || !dueDate) {
      toast.error('Title and due date are required')
      return
    }
    setSaving(true)
    try {
      await api.createAssignment(courseId, {
        title,
        description,
        dueDate: new Date(dueDate).toISOString(),
        type,
        maxPoints: Number(maxPoints) || 100,
      })
      setTitle('')
      setDescription('')
      setDueDate('')
      setType('HOMEWORK')
      setMaxPoints('100')
      onCreated()
    } catch {
      toast.error('Could not post assignment')
    } finally {
      setSaving(false)
    }
  }

  return (
    <Dialog open onOpenChange={onOpenChange}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Post assignment</DialogTitle>
          <DialogDescription>{courseName} — syncs to every enrolled student instantly.</DialogDescription>
        </DialogHeader>
        <div className="space-y-4 py-2">
          <div className="space-y-1.5">
            <Label htmlFor="at">Title</Label>
            <Input id="at" value={title} onChange={(e) => setTitle(e.target.value)} placeholder="e.g. Chapter 6 Problem Set" />
          </div>
          <div className="space-y-1.5">
            <Label htmlFor="ad">Description</Label>
            <Textarea id="ad" value={description} onChange={(e) => setDescription(e.target.value)} placeholder="Instructions for students…" rows={3} />
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-1.5">
              <Label htmlFor="add">Due date</Label>
              <Input id="add" type="date" value={dueDate} onChange={(e) => setDueDate(e.target.value)} />
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="at2">Type</Label>
              <Select value={type} onValueChange={setType}>
                <SelectTrigger id="at2"><SelectValue /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="HOMEWORK">Homework</SelectItem>
                  <SelectItem value="QUIZ">Quiz</SelectItem>
                  <SelectItem value="PROJECT">Project</SelectItem>
                  <SelectItem value="ESSAY">Essay</SelectItem>
                  <SelectItem value="READING">Reading</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>
          <div className="space-y-1.5">
            <Label htmlFor="amp">Max points</Label>
            <Input id="amp" type="number" value={maxPoints} onChange={(e) => setMaxPoints(e.target.value)} />
          </div>
        </div>
        <DialogFooter>
          <Button variant="ghost" onClick={() => onOpenChange(false)}>Cancel</Button>
          <Button onClick={submit} disabled={saving || !title.trim() || !dueDate}>
            {saving ? 'Posting…' : 'Post assignment'}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}
