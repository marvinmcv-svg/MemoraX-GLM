'use client'

import * as React from 'react'
import { RefreshCw, Loader2, RotateCw, Check, X, Meh, ThumbsUp, Brain, Sparkles } from 'lucide-react'
import { Card } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { useSession } from '@/lib/session'
import { api } from '@/lib/api-client'
import { cn } from '@/lib/utils'
import { toast } from 'sonner'
import { motion, AnimatePresence } from 'framer-motion'

interface ReviewCardData {
  id: string
  front: string
  back: string
  memoryId: string | null
  repetitions: number
  ease: number
  interval: number
}

export function StudentReview() {
  const { user } = useSession()
  const [due, setDue] = React.useState<ReviewCardData[]>([])
  const [totalCards, setTotalCards] = React.useState(0)
  const [loading, setLoading] = React.useState(true)
  const [generating, setGenerating] = React.useState(false)
  const [flipped, setFlipped] = React.useState(false)
  const [idx, setIdx] = React.useState(0)
  const [sessionDone, setSessionDone] = React.useState(false)
  const [sessionStats, setSessionStats] = React.useState({ reviewed: 0, correct: 0 })

  const load = React.useCallback(async () => {
    if (!user) return
    setLoading(true)
    try {
      const r = await api.reviewDue(user.id)
      setDue(r.due)
      setTotalCards(r.totalCards)
      setIdx(0)
      setFlipped(false)
      setSessionDone(false)
      setSessionStats({ reviewed: 0, correct: 0 })
    } catch {
      toast.error('Could not load review cards')
    } finally {
      setLoading(false)
    }
  }, [user])

  React.useEffect(() => {
    load()
  }, [load])

  const generate = async () => {
    if (!user) return
    setGenerating(true)
    try {
      const r = await api.generateReview(user.id)
      toast.success(r.created > 0 ? `Generated ${r.created} new review cards!` : 'No new cards to generate — chat with your tutor to build memories first.')
      load()
    } catch {
      toast.error('Could not generate cards')
    } finally {
      setGenerating(false)
    }
  }

  const answer = async (quality: number) => {
    if (!user || due.length === 0) return
    const card = due[idx]
    try {
      await api.answerReview(user.id, card.id, quality)
      setSessionStats((s) => ({
        reviewed: s.reviewed + 1,
        correct: quality >= 2 ? s.correct + 1 : s.correct,
      }))
      const nextIdx = idx + 1
      if (nextIdx >= due.length) {
        setSessionDone(true)
      } else {
        setIdx(nextIdx)
        setFlipped(false)
      }
    } catch {
      toast.error('Could not save answer')
    }
  }

  const current = due[idx]

  if (loading) {
    return (
      <div className="space-y-4">
        <div className="h-20 rounded-xl bg-muted animate-pulse" />
        <div className="h-64 rounded-xl bg-muted animate-pulse" />
      </div>
    )
  }

  return (
    <div className="space-y-5">
      {/* header */}
      <Card className="overflow-hidden">
        <div className="flex items-center gap-4 p-5 bg-gradient-to-r from-[var(--mx-emerald-soft)] to-[var(--mx-warm-soft)]/40">
          <div className="h-12 w-12 rounded-xl bg-card grid place-items-center shadow-sm shrink-0">
            <RotateCw className="h-6 w-6 text-primary" />
          </div>
          <div className="flex-1 min-w-0">
            <h2 className="font-semibold text-lg">Spaced repetition review</h2>
            <p className="text-sm text-muted-foreground">
              Resurface concepts before you forget them. Earn XP for every card you review.
            </p>
          </div>
          <Button variant="outline" size="sm" className="gap-1.5 shrink-0" onClick={generate} disabled={generating}>
            {generating ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <RefreshCw className="h-3.5 w-3.5" />}
            Generate cards
          </Button>
        </div>
      </Card>

      {/* stats */}
      <div className="grid grid-cols-3 gap-3">
        <Card className="p-4 text-center">
          <p className="text-2xl font-bold text-primary">{due.length}</p>
          <p className="text-xs text-muted-foreground mt-1">due now</p>
        </Card>
        <Card className="p-4 text-center">
          <p className="text-2xl font-bold text-primary">{totalCards}</p>
          <p className="text-xs text-muted-foreground mt-1">total cards</p>
        </Card>
        <Card className="p-4 text-center">
          <p className="text-2xl font-bold text-primary">{sessionStats.reviewed}</p>
          <p className="text-xs text-muted-foreground mt-1">reviewed today</p>
        </Card>
      </div>

      {/* card or session done */}
      {sessionDone ? (
        <Card className="p-8 text-center">
          <div className="text-5xl mb-3">🎉</div>
          <h3 className="font-semibold text-lg">Session complete!</h3>
          <p className="text-sm text-muted-foreground mt-1">
            You reviewed {sessionStats.reviewed} card{sessionStats.reviewed === 1 ? '' : 's'} and got{' '}
            {sessionStats.correct} right. +{sessionStats.reviewed * 10} XP earned!
          </p>
          <Button className="mt-5 gap-1.5" onClick={load}>
            <RefreshCw className="h-4 w-4" /> Review more
          </Button>
        </Card>
      ) : due.length === 0 ? (
        <Card className="p-10 text-center">
          <Brain className="h-10 w-10 mx-auto text-muted-foreground mb-3" />
          <p className="font-medium">No cards due right now</p>
          <p className="text-sm text-muted-foreground mt-1 max-w-sm mx-auto">
            Tap “Generate cards” to turn your memory layer into review flashcards, or come back later
            when cards are due.
          </p>
          <Button className="mt-5 gap-1.5" onClick={generate} disabled={generating}>
            {generating ? <Loader2 className="h-4 w-4 animate-spin" /> : <Sparkles className="h-4 w-4" />}
            Generate from memories
          </Button>
        </Card>
      ) : (
        <div className="space-y-4">
          {/* progress */}
          <div className="flex items-center gap-2">
            <Badge variant="outline" className="text-[11px]">Card {idx + 1} of {due.length}</Badge>
            <div className="flex-1 h-1.5 rounded-full bg-muted overflow-hidden">
              <div
                className="h-full bg-primary transition-all"
                style={{ width: `${(idx / due.length) * 100}%` }}
              />
            </div>
          </div>

          {/* the card */}
          <AnimatePresence mode="wait">
            <motion.div
              key={current.id + (flipped ? '-back' : '-front')}
              initial={{ opacity: 0, rotateY: -10 }}
              animate={{ opacity: 1, rotateY: 0 }}
              exit={{ opacity: 0, rotateY: 10 }}
              transition={{ duration: 0.2 }}
            >
              <Card
                className={cn(
                  'p-8 min-h-[240px] flex flex-col items-center justify-center text-center cursor-pointer',
                  flipped ? 'bg-[var(--mx-emerald-soft)]/30' : 'bg-card'
                )}
                onClick={() => setFlipped((f) => !f)}
              >
                <p className="text-xs text-muted-foreground mb-3 uppercase tracking-wide">
                  {flipped ? 'Answer' : 'Question'}
                </p>
                <p className="text-lg sm:text-xl font-medium leading-relaxed max-w-lg">
                  {flipped ? current.back : current.front}
                </p>
                {!flipped && (
                  <p className="text-xs text-muted-foreground mt-6 flex items-center gap-1.5">
                    <RefreshCw className="h-3 w-3" /> Tap to reveal answer
                  </p>
                )}
              </Card>
            </motion.div>
          </AnimatePresence>

          {/* answer buttons (only when flipped) */}
          {flipped && (
            <motion.div
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              className="grid grid-cols-4 gap-2"
            >
              <AnswerButton quality={0} label="Again" icon={X} tone="clay" onClick={answer} />
              <AnswerButton quality={1} label="Hard" icon={Meh} tone="amber" onClick={answer} />
              <AnswerButton quality={2} label="Good" icon={ThumbsUp} tone="emerald" onClick={answer} />
              <AnswerButton quality={3} label="Easy" icon={Check} tone="emerald" onClick={answer} />
            </motion.div>
          )}
        </div>
      )}
    </div>
  )
}

function AnswerButton({
  quality,
  label,
  icon: Icon,
  tone,
  onClick,
}: {
  quality: number
  label: string
  icon: React.ElementType
  tone: 'clay' | 'amber' | 'emerald'
  onClick: (q: number) => void
}) {
  const tones = {
    clay: 'border-[var(--mx-clay)]/30 text-[var(--mx-clay)] hover:bg-[var(--mx-clay)]/10',
    amber: 'border-[var(--mx-warm)]/30 text-[var(--mx-warm)] hover:bg-[var(--mx-warm)]/10',
    emerald: 'border-primary/30 text-primary hover:bg-primary/10',
  }
  return (
    <button
      onClick={() => onClick(quality)}
      className={cn(
        'flex flex-col items-center gap-1 rounded-xl border bg-card py-3 transition-colors',
        tones[tone]
      )}
    >
      <Icon className="h-4 w-4" />
      <span className="text-xs font-medium">{label}</span>
    </button>
  )
}
