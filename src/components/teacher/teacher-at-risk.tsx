'use client'

import * as React from 'react'
import { AlertTriangle, AlertCircle, Flame, MessageSquare, FileText, Loader2 } from 'lucide-react'
import { Card } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Avatar, AvatarFallback } from '@/components/ui/avatar'
import { useSession } from '@/lib/session'
import { api } from '@/lib/api-client'
import { cn } from '@/lib/utils'
import { toast } from 'sonner'

interface AtRiskStudent {
  id: string
  name: string
  avatar: string | null
  grade: string | null
  courseName: string
  courseId: string
  riskLevel: 'high' | 'medium' | 'low'
  reasons: string[]
  stats: {
    totalAssignments: number
    overdue: number
    done: number
    completion: number
    frustrationSignals: number
    weakAreas: number
  }
}

const RISK_META = {
  high: { label: 'High', color: 'text-[var(--mx-clay)]', bg: 'bg-[var(--mx-clay)]/10', ring: 'ring-[var(--mx-clay)]/30' },
  medium: { label: 'Medium', color: 'text-[var(--mx-warm)]', bg: 'bg-[var(--mx-warm)]/10', ring: 'ring-[var(--mx-warm)]/30' },
  low: { label: 'Low', color: 'text-muted-foreground', bg: 'bg-muted', ring: 'ring-border' },
}

export function TeacherAtRisk() {
  const { user } = useSession()
  const [students, setStudents] = React.useState<AtRiskStudent[]>([])
  const [loading, setLoading] = React.useState(true)
  const [messaging, setMessaging] = React.useState<string | null>(null)

  const load = React.useCallback(async () => {
    if (!user) return
    setLoading(true)
    try {
      const r = await api.atRiskStudents(user.id)
      setStudents(r.students)
    } catch {
      toast.error('Could not load at-risk students')
    } finally {
      setLoading(false)
    }
  }, [user])

  React.useEffect(() => {
    load()
  }, [load])

  const nudge = async (s: AtRiskStudent) => {
    if (!user) return
    setMessaging(s.id)
    try {
      await api.teacherMessage({
        courseId: s.courseId,
        teacherId: user.id,
        studentId: s.id,
        content: `Hey ${s.name.split(' ')[0]}, I noticed you've got some overdue work piling up. Let's figure out a plan together — come see me or reply here and we'll get you back on track. You've got this! 💪`,
      })
      toast.success(`Nudge sent to ${s.name}`)
    } catch {
      toast.error('Could not send message')
    } finally {
      setMessaging(null)
    }
  }

  const highCount = students.filter((s) => s.riskLevel === 'high').length
  const mediumCount = students.filter((s) => s.riskLevel === 'medium').length

  return (
    <div className="space-y-5">
      {/* Header */}
      <Card className="overflow-hidden">
        <div className="flex items-center gap-4 p-5 bg-gradient-to-r from-[var(--mx-clay)]/10 to-[var(--mx-warm-soft)]/40">
          <div className="h-12 w-12 rounded-xl bg-card grid place-items-center shadow-sm shrink-0">
            <AlertTriangle className="h-6 w-6 text-[var(--mx-clay)]" />
          </div>
          <div className="flex-1 min-w-0">
            <h2 className="font-semibold text-lg">At-risk students</h2>
            <p className="text-sm text-muted-foreground">
              Early intervention flags — students with overdue work, frustration signals, or low completion.
            </p>
          </div>
          <div className="flex items-center gap-2 shrink-0">
            {highCount > 0 && (
              <Badge variant="outline" className="text-[var(--mx-clay)] gap-1">
                <Flame className="h-3 w-3" /> {highCount} high
              </Badge>
            )}
            {mediumCount > 0 && (
              <Badge variant="outline" className="text-[var(--mx-warm)] gap-1">
                <AlertCircle className="h-3 w-3" /> {mediumCount} medium
              </Badge>
            )}
          </div>
        </div>
      </Card>

      {loading ? (
        <div className="space-y-3">
          {[...Array(3)].map((_, i) => (
            <div key={i} className="h-28 rounded-xl bg-muted animate-pulse" />
          ))}
        </div>
      ) : students.length === 0 ? (
        <Card className="p-10 text-center">
          <AlertTriangle className="h-10 w-10 mx-auto text-emerald-500 mb-3" />
          <p className="font-medium">No at-risk students right now</p>
          <p className="text-sm text-muted-foreground mt-1">Everyone&apos;s on track. 🎉</p>
        </Card>
      ) : (
        <div className="space-y-3">
          {students.map((s) => {
            const meta = RISK_META[s.riskLevel]
            return (
              <Card key={s.id} className={cn('p-4 ring-1', meta.ring)}>
                <div className="flex items-start gap-3">
                  <Avatar className="h-11 w-11 shrink-0">
                    <AvatarFallback className="bg-[var(--mx-clay)]/10">{s.avatar ?? s.name[0]}</AvatarFallback>
                  </Avatar>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 flex-wrap">
                      <p className="font-medium text-sm">{s.name}</p>
                      <Badge variant="outline" className={cn('text-[10px] py-0 px-1.5', meta.color, meta.bg)}>
                        {meta.label} risk
                      </Badge>
                      <span className="text-[11px] text-muted-foreground">{s.courseName}</span>
                    </div>
                    <div className="flex flex-wrap gap-1.5 mt-2">
                      {s.reasons.map((r, i) => (
                        <span key={i} className="text-[11px] bg-muted rounded-full px-2 py-0.5 text-muted-foreground">
                          {r}
                        </span>
                      ))}
                    </div>
                    <div className="flex items-center gap-4 mt-2.5 text-xs text-muted-foreground">
                      <span>{s.stats.completion}% complete</span>
                      <span>· {s.stats.overdue} overdue</span>
                      <span>· {s.stats.weakAreas} weak areas</span>
                    </div>
                  </div>
                  <Button
                    variant="outline"
                    size="sm"
                    className="gap-1.5 shrink-0"
                    onClick={() => nudge(s)}
                    disabled={messaging === s.id}
                  >
                    {messaging === s.id ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <MessageSquare className="h-3.5 w-3.5" />}
                    Nudge
                  </Button>
                </div>
              </Card>
            )
          })}
        </div>
      )}

      <Card className="p-5 bg-[var(--mx-emerald-soft)]/30">
        <div className="flex items-start gap-3">
          <div className="h-9 w-9 rounded-lg bg-primary/10 text-primary grid place-items-center shrink-0">
            <FileText className="h-4.5 w-4.5" />
          </div>
          <div>
            <p className="font-medium text-sm">How at-risk is calculated</p>
            <p className="text-xs text-muted-foreground mt-1 leading-relaxed">
              Students are flagged when they have 3+ overdue assignments, frustration signals in the last
              7 days, or completion below 30%. Weak areas are noted as secondary signals. The tutor&apos;s
              memory layer powers all of this — no extra data entry needed.
            </p>
          </div>
        </div>
      </Card>
    </div>
  )
}
