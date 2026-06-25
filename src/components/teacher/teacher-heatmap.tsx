'use client'

import * as React from 'react'
import { Flame, Loader2, Sparkles, Lightbulb, CheckCircle2 } from 'lucide-react'
import { Card } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
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

interface Concept {
  topic: string
  mentions: number
  weakAreas: number
  studentsAffected: number
  totalStudents: number
  pct: number
  severity: 'high' | 'medium' | 'low'
}
interface CourseHeatmap {
  course: { id: string; name: string; subject: string | null; studentCount: number }
  concepts: Concept[]
}

export function TeacherHeatmap() {
  const { user } = useSession()
  const [courses, setCourses] = React.useState<CourseHeatmap[]>([])
  const [loading, setLoading] = React.useState(true)
  const [selectedCourse, setSelectedCourse] = React.useState<string>('all')
  const [generating, setGenerating] = React.useState<string | null>(null)

  const load = React.useCallback(async () => {
    if (!user) return
    setLoading(true)
    try {
      const r = await api.classHeatmap(user.id)
      setCourses(r.courses)
    } catch {
      toast.error('Could not load heatmap')
    } finally {
      setLoading(false)
    }
  }, [user])

  React.useEffect(() => {
    load()
  }, [load])

  const generateLesson = async (courseId: string, topic: string) => {
    if (!user) return
    setGenerating(courseId)
    try {
      await api.generateLessonPlan(user.id, courseId, topic)
      toast.success(`Lesson plan generated for "${topic}"!`, {
        description: 'Find it in Conference Prep → Lesson Plans.',
      })
    } catch {
      toast.error('Could not generate lesson plan')
    } finally {
      setGenerating(null)
    }
  }

  const visibleCourses = selectedCourse === 'all' ? courses : courses.filter((c) => c.course.id === selectedCourse)

  return (
    <div className="space-y-5">
      {/* Header */}
      <Card className="overflow-hidden">
        <div className="flex items-center gap-4 p-5 bg-gradient-to-r from-[var(--mx-warm-soft)] to-[var(--mx-emerald-soft)]/40">
          <div className="h-12 w-12 rounded-xl bg-card grid place-items-center shadow-sm shrink-0">
            <Flame className="h-6 w-6 text-[var(--mx-warm)]" />
          </div>
          <div className="flex-1 min-w-0">
            <h2 className="font-semibold text-lg">Class concept heatmap</h2>
            <p className="text-sm text-muted-foreground">
              Where the whole class is struggling — aggregated from each student&apos;s memory layer. Tells you what to reteach.
            </p>
          </div>
          {courses.length > 0 && (
            <Select value={selectedCourse} onValueChange={setSelectedCourse}>
              <SelectTrigger className="w-44 hidden sm:flex"><SelectValue /></SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All classes</SelectItem>
                {courses.map((c) => (
                  <SelectItem key={c.course.id} value={c.course.id}>{c.course.name}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          )}
        </div>
      </Card>

      {loading ? (
        <div className="space-y-3">
          {[...Array(2)].map((_, i) => (
            <div key={i} className="h-32 rounded-xl bg-muted animate-pulse" />
          ))}
        </div>
      ) : visibleCourses.length === 0 ? (
        <Card className="p-10 text-center">
          <div className="h-14 w-14 mx-auto rounded-2xl bg-[var(--mx-warm)]/10 text-[var(--mx-warm)] grid place-items-center mb-3">
            <Flame className="h-7 w-7" />
          </div>
          <p className="font-medium">No concept data yet</p>
          <p className="text-sm text-muted-foreground mt-1 max-w-sm mx-auto">
            Once students chat with the tutor, their weak areas will aggregate into a class heatmap
            here. Try sending a quick assignment and checking back after a few tutor sessions.
          </p>
        </Card>
      ) : (
        visibleCourses.map((ch) => (
          <div key={ch.course.id}>
            <div className="flex items-center gap-2 mb-2">
              <h3 className="font-semibold text-sm">{ch.course.name}</h3>
              <Badge variant="outline" className="text-[11px]">{ch.course.studentCount} students</Badge>
            </div>
            {ch.concepts.length === 0 ? (
              <Card className="p-6 text-center hover:shadow-sm transition-shadow">
                <CheckCircle2 className="h-8 w-8 mx-auto text-primary mb-2" />
                <p className="text-sm font-medium">No struggles recorded for this class yet</p>
                <p className="text-xs text-muted-foreground mt-1">Looks like everyone&apos;s keeping up!</p>
              </Card>
            ) : (
              <div className="space-y-2">
                {ch.concepts.map((c) => (
                  <Card key={c.topic} className="p-4 hover:shadow-sm transition-shadow">
                    <div className="flex items-center gap-3">
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2 mb-1.5">
                          <p className="font-medium text-sm capitalize">{c.topic}</p>
                          <SeverityBadge severity={c.severity} />
                        </div>
                        <div className="flex items-center gap-2">
                          <div className="flex-1 h-2 rounded-full bg-muted overflow-hidden">
                            <div
                              className={cn(
                                'h-full transition-all',
                                c.severity === 'high' ? 'bg-[var(--mx-clay)]' : c.severity === 'medium' ? 'bg-[var(--mx-warm)]' : 'bg-primary'
                              )}
                              style={{ width: `${c.pct}%` }}
                            />
                          </div>
                          <span className="text-xs text-muted-foreground shrink-0 w-20 text-right">
                            {c.studentsAffected}/{c.totalStudents} students
                          </span>
                        </div>
                        <div className="flex items-center gap-3 mt-1.5 text-[11px] text-muted-foreground">
                          <span>{c.weakAreas} weak-area signal{c.weakAreas !== 1 ? 's' : ''}</span>
                          <span>· {c.mentions} total mention{c.mentions !== 1 ? 's' : ''}</span>
                        </div>
                      </div>
                      {c.severity !== 'low' && (
                        <Button
                          variant="outline"
                          size="sm"
                          className="gap-1.5 shrink-0"
                          onClick={() => generateLesson(ch.course.id, c.topic)}
                          disabled={generating === ch.course.id}
                        >
                          {generating === ch.course.id ? (
                            <Loader2 className="h-3.5 w-3.5 animate-spin" />
                          ) : (
                            <Lightbulb className="h-3.5 w-3.5" />
                          )}
                          Lesson plan
                        </Button>
                      )}
                    </div>
                  </Card>
                ))}
              </div>
            )}
          </div>
        ))
      )}

      {visibleCourses.length > 0 && (
        <Card className="p-5 bg-[var(--mx-emerald-soft)]/30">
          <div className="flex items-start gap-3">
            <div className="h-9 w-9 rounded-lg bg-primary/10 text-primary grid place-items-center shrink-0">
              <Sparkles className="h-4.5 w-4.5" />
            </div>
            <div>
              <p className="font-medium text-sm">Turn insights into action</p>
              <p className="text-xs text-muted-foreground mt-1 leading-relaxed">
                Tap <b>Lesson plan</b> on any high-severity concept and the AI generates a 45-minute
                lesson plan tailored to that weak area — warm-up, instruction, guided practice,
                differentiation. Saved to your Conference Prep tab.
              </p>
            </div>
          </div>
        </Card>
      )}
    </div>
  )
}

function SeverityBadge({ severity }: { severity: 'high' | 'medium' | 'low' }) {
  const meta = {
    high: { label: 'High struggle', cls: 'bg-[var(--mx-clay)]/10 text-[var(--mx-clay)]' },
    medium: { label: 'Some struggle', cls: 'bg-[var(--mx-warm)]/10 text-[var(--mx-warm)]' },
    low: { label: 'Solid', cls: 'bg-primary/10 text-primary' },
  }
  const m = meta[severity]
  return <span className={cn('text-[10px] font-medium px-1.5 py-0.5 rounded-full', m.cls)}>{m.label}</span>
}
