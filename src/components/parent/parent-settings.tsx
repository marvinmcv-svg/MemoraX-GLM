'use client'

import * as React from 'react'
import { Settings, Clock, Target, Save, Loader2, Moon, Sun } from 'lucide-react'
import { Card } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Switch } from '@/components/ui/switch'
import { Textarea } from '@/components/ui/textarea'
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

interface StudyHours {
  enabled: boolean
  studyStart: string
  studyEnd: string
  downtimeStart: string
  downtimeEnd: string
}

const DEFAULT_HOURS: StudyHours = {
  enabled: false,
  studyStart: '16:00',
  studyEnd: '20:00',
  downtimeStart: '21:00',
  downtimeEnd: '07:00',
}

export function ParentSettings() {
  const { user, activeStudentId } = useSession()
  const [students, setStudents] = React.useState<{ id: string; name: string; avatar: string | null }[]>([])
  const [selectedId, setSelectedId] = React.useState<string | null>(activeStudentId)
  const [hours, setHours] = React.useState<StudyHours>(DEFAULT_HOURS)
  const [focusAreas, setFocusAreas] = React.useState('')
  const [loading, setLoading] = React.useState(true)
  const [saving, setSaving] = React.useState(false)

  // load family students
  React.useEffect(() => {
    if (!user) return
    api.parentFamily(user.id).then((r) => {
      const kids = r.family?.students ?? []
      setStudents(kids.map((s: any) => ({ id: s.id, name: s.name, avatar: s.avatar })))
      if (kids.length > 0 && !selectedId) setSelectedId(kids[0].id)
    }).finally(() => setLoading(false))
  }, [user, selectedId])

  // load settings for selected student
  React.useEffect(() => {
    if (!user || !selectedId) return
    api.parentSettings(user.id, selectedId).then((r) => {
      setHours(r.settings?.studyHours ?? DEFAULT_HOURS)
      setFocusAreas(r.settings?.focusAreas ?? '')
    }).catch(() => {})
  }, [user, selectedId])

  const save = async () => {
    if (!user || !selectedId) return
    setSaving(true)
    try {
      await api.updateParentSettings(user.id, {
        studentId: selectedId,
        studyHours: hours,
        focusAreas,
      })
      toast.success('Settings saved')
    } catch {
      toast.error('Could not save settings')
    } finally {
      setSaving(false)
    }
  }

  if (loading) {
    return <div className="h-48 rounded-xl bg-muted animate-pulse" />
  }

  if (students.length === 0) {
    return (
      <Card className="p-10 text-center">
        <Settings className="h-10 w-10 mx-auto text-muted-foreground mb-3" />
        <p className="font-medium">No students to configure</p>
      </Card>
    )
  }

  return (
    <div className="space-y-5">
      {/* Header */}
      <Card className="overflow-hidden">
        <div className="flex items-center gap-4 p-5 bg-gradient-to-r from-[var(--mx-emerald-soft)] to-[var(--mx-warm-soft)]/40">
          <div className="h-12 w-12 rounded-xl bg-card grid place-items-center shadow-sm shrink-0">
            <Settings className="h-6 w-6 text-primary" />
          </div>
          <div className="flex-1 min-w-0">
            <h2 className="font-semibold text-lg">Parent settings</h2>
            <p className="text-sm text-muted-foreground">
              Tune screen-time windows, focus areas, and notification preferences for each kid.
            </p>
          </div>
        </div>
      </Card>

      {/* Student selector */}
      <div className="flex items-center gap-2 overflow-x-auto scroll-thin pb-1">
        {students.map((s) => (
          <button
            key={s.id}
            onClick={() => setSelectedId(s.id)}
            className={cn(
              'flex items-center gap-2 rounded-lg px-3 py-2 text-sm font-medium whitespace-nowrap transition-colors border',
              selectedId === s.id
                ? 'bg-primary text-primary-foreground border-primary'
                : 'bg-card text-muted-foreground border-border/60 hover:text-foreground'
            )}
          >
            <span>{s.avatar}</span>
            {s.name.split(' ')[0]}
          </button>
        ))}
      </div>

      {/* Screen-time scheduling */}
      <Card className="p-5">
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center gap-2">
            <Clock className="h-4 w-4 text-primary" />
            <h3 className="font-semibold text-sm">Screen-time schedule</h3>
          </div>
          <div className="flex items-center gap-2">
            <span className="text-xs text-muted-foreground">{hours.enabled ? 'Active' : 'Off'}</span>
            <Switch checked={hours.enabled} onCheckedChange={(c) => setHours((h) => ({ ...h, enabled: c }))} />
          </div>
        </div>

        {hours.enabled && (
          <div className="space-y-4">
            <div className="rounded-lg bg-[var(--mx-emerald-soft)]/30 p-3 flex items-center gap-3">
              <Sun className="h-5 w-5 text-[var(--mx-warm)] shrink-0" />
              <div className="flex-1">
                <p className="text-xs font-medium">Study window</p>
                <p className="text-[11px] text-muted-foreground">Reminders + digests land during these hours</p>
              </div>
              <div className="flex items-center gap-2">
                <Input
                  type="time"
                  value={hours.studyStart}
                  onChange={(e) => setHours((h) => ({ ...h, studyStart: e.target.value }))}
                  className="w-28 h-8 text-xs"
                />
                <span className="text-xs text-muted-foreground">to</span>
                <Input
                  type="time"
                  value={hours.studyEnd}
                  onChange={(e) => setHours((h) => ({ ...h, studyEnd: e.target.value }))}
                  className="w-28 h-8 text-xs"
                />
              </div>
            </div>

            <div className="rounded-lg bg-[var(--mx-clay)]/10 p-3 flex items-center gap-3">
              <Moon className="h-5 w-5 text-[var(--mx-clay)] shrink-0" />
              <div className="flex-1">
                <p className="text-xs font-medium">Downtime (quiet hours)</p>
                <p className="text-[11px] text-muted-foreground">No notifications during sleep / device-free time</p>
              </div>
              <div className="flex items-center gap-2">
                <Input
                  type="time"
                  value={hours.downtimeStart}
                  onChange={(e) => setHours((h) => ({ ...h, downtimeStart: e.target.value }))}
                  className="w-28 h-8 text-xs"
                />
                <span className="text-xs text-muted-foreground">to</span>
                <Input
                  type="time"
                  value={hours.downtimeEnd}
                  onChange={(e) => setHours((h) => ({ ...h, downtimeEnd: e.target.value }))}
                  className="w-28 h-8 text-xs"
                />
              </div>
            </div>

            <p className="text-xs text-muted-foreground italic">
              💡 The 7 PM digest and due-date reminders will only arrive during the study window.
              During downtime, everything is held silently.
            </p>
          </div>
        )}

        {!hours.enabled && (
          <p className="text-sm text-muted-foreground">
            Turn on to set study hours and quiet times. Reminders will respect the schedule.
          </p>
        )}
      </Card>

      {/* Focus areas */}
      <Card className="p-5">
        <div className="flex items-center gap-2 mb-3">
          <Target className="h-4 w-4 text-[var(--mx-warm)]" />
          <h3 className="font-semibold text-sm">Focus areas</h3>
        </div>
        <p className="text-xs text-muted-foreground mb-3">
          Tell the tutor what to prioritize for this student. Comma-separated topics work best.
        </p>
        <Textarea
          value={focusAreas}
          onChange={(e) => setFocusAreas(e.target.value)}
          placeholder="e.g. fractions, essay writing, multiplication tables"
          rows={2}
          className="resize-none"
        />
        <div className="flex flex-wrap gap-1.5 mt-2">
          {['fractions', 'essay writing', 'times tables', 'reading comprehension', 'algebra basics'].map((tag) => (
            <button
              key={tag}
              onClick={() => setFocusAreas((cur) => (cur.trim() ? `${cur}, ${tag}` : tag))}
              className="text-[11px] bg-muted rounded-full px-2 py-0.5 text-muted-foreground hover:bg-primary/10 hover:text-primary transition-colors"
            >
              + {tag}
            </button>
          ))}
        </div>
      </Card>

      {/* Save */}
      <Button onClick={save} disabled={saving} className="w-full gap-1.5">
        {saving ? <Loader2 className="h-4 w-4 animate-spin" /> : <Save className="h-4 w-4" />}
        {saving ? 'Saving…' : 'Save settings'}
      </Button>
    </div>
  )
}
