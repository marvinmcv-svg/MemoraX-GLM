'use client'

import * as React from 'react'
import { Brain, Lightbulb, AlertCircle, BookMarked, StickyNote, GraduationCap, TrendingUp, Sparkles } from 'lucide-react'
import { Card } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { useSession } from '@/lib/session'
import { api } from '@/lib/api-client'
import type { MemoryLite, MemoryType } from '@/lib/types'
import { cn } from '@/lib/utils'
import { toast } from 'sonner'

const TYPE_META: Record<MemoryType, { label: string; icon: React.ElementType; color: string }> = {
  CONCEPT: { label: 'Concept', icon: BookMarked, color: 'bg-primary/10 text-primary' },
  WEAK_AREA: { label: 'Weak area', icon: AlertCircle, color: 'bg-[var(--mx-clay)]/10 text-[var(--mx-clay)]' },
  HOMEWORK: { label: 'Homework', icon: StickyNote, color: 'bg-[var(--mx-warm)]/10 text-[var(--mx-warm)]' },
  TUTOR_SESSION: { label: 'Tutor session', icon: GraduationCap, color: 'bg-primary/10 text-primary' },
  STUDY_TIP: { label: 'Study tip', icon: Lightbulb, color: 'bg-[var(--mx-warm)]/10 text-[var(--mx-warm)]' },
  NOTE: { label: 'Note', icon: StickyNote, color: 'bg-muted text-muted-foreground' },
}

export function StudentMemories() {
  const { user } = useSession()
  const [memories, setMemories] = React.useState<MemoryLite[]>([])
  const [loading, setLoading] = React.useState(true)

  const load = React.useCallback(async () => {
    if (!user) return
    setLoading(true)
    try {
      const r = await api.studentMemories(user.id)
      setMemories(r.memories)
    } catch {
      toast.error('Could not load memories')
    } finally {
      setLoading(false)
    }
  }, [user])

  React.useEffect(() => {
    load()
  }, [load])

  const weakAreas = memories.filter((m) => m.type === 'WEAK_AREA')
  const concepts = memories.filter((m) => m.type === 'CONCEPT')
  const tips = memories.filter((m) => m.type === 'STUDY_TIP')
  const sessions = memories.filter((m) => m.type === 'TUTOR_SESSION' || m.type === 'HOMEWORK')

  return (
    <div className="space-y-5">
      {/* Hero — the memory layer */}
      <Card className="overflow-hidden border-border/60">
        <div className="flex items-center gap-4 p-5 bg-gradient-to-r from-[var(--mx-emerald-soft)] to-[var(--mx-warm-soft)]/40">
          <div className="h-12 w-12 rounded-xl bg-card grid place-items-center shadow-sm shrink-0">
            <Brain className="h-6 w-6 text-primary" />
          </div>
          <div className="flex-1 min-w-0">
            <h2 className="font-semibold text-lg">Your memory layer</h2>
            <p className="text-sm text-muted-foreground">
              Everything the tutor remembers about how you learn — so it gets smarter every session.
            </p>
          </div>
          <Badge variant="secondary" className="hidden sm:flex gap-1">
            <Sparkles className="h-3 w-3" /> {memories.length} memories
          </Badge>
        </div>
      </Card>

      {/* Stats */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
        <MiniStat icon={AlertCircle} label="Weak areas" value={weakAreas.length} tone="clay" />
        <MiniStat icon={BookMarked} label="Concepts" value={concepts.length} tone="emerald" />
        <MiniStat icon={Lightbulb} label="Study tips" value={tips.length} tone="amber" />
        <MiniStat icon={GraduationCap} label="Sessions" value={sessions.length} tone="emerald" />
      </div>

      {/* Memory bubbles */}
      {loading ? (
        <div className="grid sm:grid-cols-2 gap-3">
          {[...Array(4)].map((_, i) => (
            <div key={i} className="h-24 rounded-xl bg-muted animate-pulse" />
          ))}
        </div>
      ) : memories.length === 0 ? (
        <Card className="p-10 text-center">
          <div className="h-14 w-14 mx-auto rounded-2xl bg-primary/10 text-primary grid place-items-center mb-3">
            <Brain className="h-7 w-7" />
          </div>
          <p className="font-medium">No memories yet</p>
          <p className="text-sm text-muted-foreground mt-1 max-w-sm mx-auto">
            Chat with your tutor or upload homework — memories build up automatically as you learn.
            The tutor uses them to personalize guidance and surface concepts before you forget them.
          </p>
        </Card>
      ) : (
        <div className="grid sm:grid-cols-2 gap-3">
          {memories.map((m) => (
            <MemoryBubble key={m.id} m={m} />
          ))}
        </div>
      )}

      {/* Serendipity-like strip */}
      <Card className="p-5 bg-[var(--mx-emerald-soft)]/30">
        <div className="flex items-start gap-3">
          <div className="h-9 w-9 rounded-lg bg-primary/10 text-primary grid place-items-center shrink-0">
            <TrendingUp className="h-4.5 w-4.5" />
          </div>
          <div className="flex-1">
            <p className="font-medium text-sm">Memory compounds</p>
            <p className="text-xs text-muted-foreground mt-1 leading-relaxed">
              Each session adds to your memory layer. The tutor uses it to personalize guidance —
              revisiting weak spots, building on concepts you&apos;ve mastered, and matching your
              learning style.
            </p>
          </div>
        </div>
      </Card>
    </div>
  )
}

function MiniStat({ icon: Icon, label, value, tone }: { icon: React.ElementType; label: string; value: number; tone: 'clay' | 'emerald' | 'amber' }) {
  const tones = {
    clay: 'bg-[var(--mx-clay)]/10 text-[var(--mx-clay)]',
    emerald: 'bg-primary/10 text-primary',
    amber: 'bg-[var(--mx-warm)]/10 text-[var(--mx-warm)]',
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

function MemoryBubble({ m }: { m: MemoryLite }) {
  const meta = TYPE_META[m.type as MemoryType] ?? TYPE_META.NOTE
  const Icon = meta.icon
  return (
    <Card className="p-4 hover:shadow-sm transition-shadow">
      <div className="flex items-start gap-3">
        <div className={cn('h-9 w-9 rounded-lg grid place-items-center shrink-0', meta.color)}>
          <Icon className="h-4.5 w-4.5" />
        </div>
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 mb-1">
            <span className="text-xs font-medium">{meta.label}</span>
            {m.importance >= 4 && (
              <Badge variant="outline" className="text-[10px] py-0 px-1.5">
                high priority
              </Badge>
            )}
          </div>
          <p className="text-sm leading-relaxed">{m.content}</p>
          {m.tags && (
            <div className="flex flex-wrap gap-1 mt-2">
              {m.tags.split(',').map((t) => (
                <span key={t} className="text-[10px] bg-muted rounded-full px-2 py-0.5 text-muted-foreground">
                  #{t.trim()}
                </span>
              ))}
            </div>
          )}
          <p className="text-[10px] text-muted-foreground mt-2">
            {new Date(m.createdAt).toLocaleDateString(undefined, { month: 'short', day: 'numeric' })}
          </p>
        </div>
      </div>
    </Card>
  )
}
