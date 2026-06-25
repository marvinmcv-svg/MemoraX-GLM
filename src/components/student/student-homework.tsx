'use client'

import * as React from 'react'
import { Camera, Upload, Sparkles, Loader2, CheckCircle2, Lightbulb, ArrowRight } from 'lucide-react'
import { Card } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Textarea } from '@/components/ui/textarea'
import { useSession } from '@/lib/session'
import { api } from '@/lib/api-client'
import { toast } from 'sonner'
import { motion, AnimatePresence } from 'framer-motion'
import { cn } from '@/lib/utils'

interface Analysis {
  problemText: string
  subject: string
  topics: string[]
  difficulty: 'easy' | 'medium' | 'hard'
  summary: string
}

export function StudentHomework() {
  const { user, setView: _setView } = useSession()
  const setView = _setView as (v: any) => void
  const fileRef = React.useRef<HTMLInputElement>(null)
  const [image, setImage] = React.useState<string | null>(null)
  const [question, setQuestion] = React.useState('')
  const [analyzing, setAnalyzing] = React.useState(false)
  const [analysis, setAnalysis] = React.useState<Analysis | null>(null)

  const onPick = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file) return
    if (file.size > 4_500_000) {
      toast.error('Image too large (max ~4.5MB)')
      return
    }
    const reader = new FileReader()
    reader.onload = () => {
      setImage(reader.result as string)
      setAnalysis(null)
    }
    reader.readAsDataURL(file)
    e.target.value = ''
  }

  const onDrop = (e: React.DragEvent) => {
    e.preventDefault()
    const file = e.dataTransfer.files?.[0]
    if (file && file.type.startsWith('image/')) {
      const reader = new FileReader()
      reader.onload = () => {
        setImage(reader.result as string)
        setAnalysis(null)
      }
      reader.readAsDataURL(file)
    }
  }

  const analyze = async () => {
    if (!image || !user) return
    setAnalyzing(true)
    setAnalysis(null)
    try {
      const res = await fetch('/api/homework/analyze', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          studentId: user.id,
          imageDataUrl: image,
          question: question.trim() || undefined,
        }),
      })
      if (!res.ok) throw new Error('analyze failed')
      const data = await res.json()
      setAnalysis(data.analysis)
      toast.success('Homework analyzed! The tutor has the context now.')
    } catch (e: any) {
      toast.error('Could not analyze the image. Try again.')
    } finally {
      setAnalyzing(false)
    }
  }

  const goToChat = () => {
    setView('student')
    // The chat tab is default; switching view will land on chat. The pending image + analysis
    // is already saved as a chat message by the analyze API, so history refresh will show it.
    toast('Opening your tutor chat with the homework context loaded…')
  }

  return (
    <div className="space-y-5">
      <Card className="overflow-hidden border-border/60">
        <div className="flex items-center gap-4 p-5 bg-gradient-to-r from-[var(--mx-warm-soft)] to-[var(--mx-emerald-soft)]/50">
          <div className="h-12 w-12 rounded-xl bg-card grid place-items-center shadow-sm shrink-0">
            <Camera className="h-6 w-6 text-[var(--mx-warm)]" />
          </div>
          <div className="flex-1 min-w-0">
            <h2 className="font-semibold text-lg">Snap your homework</h2>
            <p className="text-sm text-muted-foreground">
              Upload a photo and the Vision tutor reads the problem, then guides you step-by-step.
            </p>
          </div>
        </div>
      </Card>

      <div className="grid lg:grid-cols-2 gap-5">
        {/* Upload + preview */}
        <Card className="p-5">
          <input ref={fileRef} type="file" accept="image/*" className="hidden" onChange={onPick} />
          {!image ? (
            <button
              onClick={() => fileRef.current?.click()}
              onDrop={onDrop}
              onDragOver={(e) => e.preventDefault()}
              className="w-full h-64 rounded-xl border-2 border-dashed border-border hover:border-primary/50 hover:bg-[var(--mx-emerald-soft)]/30 transition-colors flex flex-col items-center justify-center gap-3 text-center px-6"
            >
              <div className="h-14 w-14 rounded-full bg-primary/10 text-primary grid place-items-center">
                <Upload className="h-6 w-6" />
              </div>
              <div>
                <p className="font-medium">Click to upload or drag a photo</p>
                <p className="text-xs text-muted-foreground mt-1">PNG, JPG up to ~4.5MB</p>
              </div>
            </button>
          ) : (
            <div className="space-y-3">
              <div className="relative rounded-xl overflow-hidden border bg-muted/30">
                <img src={image} alt="Homework preview" className="w-full max-h-80 object-contain" />
                <button
                  onClick={() => {
                    setImage(null)
                    setAnalysis(null)
                  }}
                  className="absolute top-2 right-2 rounded-md bg-background/80 backdrop-blur px-2.5 py-1 text-xs hover:bg-background"
                >
                  Replace
                </button>
              </div>
              <Textarea
                value={question}
                onChange={(e) => setQuestion(e.target.value)}
                placeholder="Optional: add a note for the tutor (e.g. 'I don't get part b')"
                className="resize-none"
                rows={2}
              />
              <Button onClick={analyze} disabled={analyzing} className="w-full gap-2">
                {analyzing ? (
                  <>
                    <Loader2 className="h-4 w-4 animate-spin" /> Reading your homework…
                  </>
                ) : (
                  <>
                    <Sparkles className="h-4 w-4" /> Analyze with Vision AI
                  </>
                )}
              </Button>
            </div>
          )}
        </Card>

        {/* Analysis result */}
        <Card className="p-5">
          <AnimatePresence mode="wait">
            {analyzing ? (
              <motion.div
                key="loading"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                className="h-full min-h-[260px] flex flex-col items-center justify-center text-center gap-3"
              >
                <Loader2 className="h-8 w-8 text-primary animate-spin" />
                <div>
                  <p className="font-medium">Reading the problem…</p>
                  <p className="text-sm text-muted-foreground mt-1">
                    Transcribing, identifying the subject, and tagging topics.
                  </p>
                </div>
              </motion.div>
            ) : analysis ? (
              <motion.div
                key="result"
                initial={{ opacity: 0, y: 8 }}
                animate={{ opacity: 1, y: 0 }}
                className="space-y-4"
              >
                <div className="flex items-center gap-2">
                  <CheckCircle2 className="h-5 w-5 text-emerald-600" />
                  <h3 className="font-semibold">Problem read</h3>
                </div>
                <div className="flex flex-wrap items-center gap-2">
                  <Badge variant="secondary" className="gap-1">
                    <span className="text-xs">{analysis.subject}</span>
                  </Badge>
                  {analysis.topics.map((t) => (
                    <Badge key={t} variant="outline" className="text-[11px]">{t}</Badge>
                  ))}
                  <Badge
                    variant="outline"
                    className={cn(
                      'text-[11px]',
                      analysis.difficulty === 'hard'
                        ? 'text-[var(--mx-clay)]'
                        : analysis.difficulty === 'medium'
                        ? 'text-[var(--mx-warm)]'
                        : 'text-emerald-600'
                    )}
                  >
                    {analysis.difficulty} difficulty
                  </Badge>
                </div>
                <div className="rounded-lg bg-muted/40 p-3 text-sm">
                  <p className="text-xs text-muted-foreground mb-1">Transcribed problem</p>
                  <p className="font-mono text-sm leading-relaxed whitespace-pre-wrap">{analysis.problemText}</p>
                </div>
                <div className="rounded-lg bg-[var(--mx-emerald-soft)]/50 p-3 text-sm flex gap-2">
                  <Lightbulb className="h-4 w-4 text-primary shrink-0 mt-0.5" />
                  <p className="leading-relaxed">{analysis.summary}</p>
                </div>
                <Button onClick={goToChat} className="w-full gap-2">
                  Continue with tutor <ArrowRight className="h-4 w-4" />
                </Button>
                <p className="text-xs text-muted-foreground text-center">
                  The tutor now has this problem in context. It&apos;ll guide you with Socratic questions
                  (or show the solution if you toggle it on).
                </p>
              </motion.div>
            ) : (
              <motion.div
                key="empty"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                className="h-full min-h-[260px] flex flex-col items-center justify-center text-center gap-3"
              >
                <div className="h-14 w-14 rounded-2xl bg-muted grid place-items-center">
                  <Sparkles className="h-7 w-7 text-muted-foreground" />
                </div>
                <div>
                  <p className="font-medium">Your analysis appears here</p>
                  <p className="text-sm text-muted-foreground mt-1 max-w-xs">
                    Upload a photo and tap “Analyze” to see the transcribed problem, subject, and
                    topics — then jump straight into the tutor chat.
                  </p>
                </div>
              </motion.div>
            )}
          </AnimatePresence>
        </Card>
      </div>

      {/* How it works */}
      <Card className="p-5 bg-muted/20">
        <h3 className="font-semibold text-sm mb-3">How homework help works</h3>
        <div className="grid sm:grid-cols-3 gap-4 text-sm">
          {[
            { n: '1', t: 'Snap a photo', d: 'Upload an image of any worksheet, textbook page, or handwritten problem.' },
            { n: '2', t: 'Vision AI reads it', d: 'The tutor transcribes the problem and identifies the subject + topics.' },
            { n: '3', t: 'Get guided, not given', d: 'Socratic questions lead you to the answer. Toggle “Solution” for a worked answer.' },
          ].map((s) => (
            <div key={s.n} className="flex gap-3">
              <div className="h-7 w-7 rounded-full bg-primary text-primary-foreground grid place-items-center text-xs font-bold shrink-0">
                {s.n}
              </div>
              <div>
                <p className="font-medium text-sm">{s.t}</p>
                <p className="text-xs text-muted-foreground mt-0.5 leading-relaxed">{s.d}</p>
              </div>
            </div>
          ))}
        </div>
      </Card>
    </div>
  )
}
