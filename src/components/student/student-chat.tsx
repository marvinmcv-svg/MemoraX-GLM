'use client'

import * as React from 'react'
import {
  SendHorizonal,
  Paperclip,
  Image as ImageIcon,
  Lightbulb,
  Eye,
  Mic,
  Square,
  Sparkles,
  Brain,
  Volume2,
  Loader2,
} from 'lucide-react'
import { motion, AnimatePresence } from 'framer-motion'
import ReactMarkdown from 'react-markdown'
import { Button } from '@/components/ui/button'
import { Switch } from '@/components/ui/switch'
import { Badge } from '@/components/ui/badge'
import { Textarea } from '@/components/ui/textarea'
import { useSession } from '@/lib/session'
import { api, streamTutorChat } from '@/lib/api-client'
import { useVoiceNotes } from '@/hooks/use-voice-notes'
import { useTTS } from '@/hooks/use-tts'
import type { ChatMsgLite, TutorMode } from '@/lib/types'
import { cn } from '@/lib/utils'
import { toast } from 'sonner'

export function StudentChat() {
  const { user } = useSession()
  const studentId = user?.id ?? ''
  const [messages, setMessages] = React.useState<ChatMsgLite[]>([])
  const [loading, setLoading] = React.useState(true)
  const [input, setInput] = React.useState('')
  const [streaming, setStreaming] = React.useState(false)
  const [mode, setMode] = React.useState<TutorMode>('socratic')
  const [pendingImage, setPendingImage] = React.useState<string | null>(null)
  const scrollRef = React.useRef<HTMLDivElement>(null)
  const abortRef = React.useRef<AbortController | null>(null)
  const fileRef = React.useRef<HTMLInputElement>(null)

  // voice notes (record → ASR → fill input)
  const voice = useVoiceNotes({
    onTranscribed: (text) => {
      setInput((cur) => (cur.trim() ? `${cur} ${text}` : text))
      toast.success('Voice note transcribed ✓')
    },
    onError: (m) => toast.error(m),
  })
  // TTS playback for assistant replies
  const tts = useTTS()

  // load history
  const loadHistory = React.useCallback(async () => {
    if (!studentId) return
    setLoading(true)
    try {
      const r = await api.studentChat(studentId)
      setMessages(r.messages)
    } catch {
      toast.error('Could not load chat history')
    } finally {
      setLoading(false)
    }
  }, [studentId])

  React.useEffect(() => {
    loadHistory()
  }, [loadHistory])

  // autoscroll
  React.useEffect(() => {
    scrollRef.current?.scrollTo({ top: scrollRef.current.scrollHeight, behavior: 'smooth' })
  }, [messages, streaming])

  const handleSend = async () => {
    const text = input.trim()
    if ((!text && !pendingImage) || streaming || !studentId) return

    const userMsg: ChatMsgLite = {
      id: `tmp-${Date.now()}`,
      role: 'user',
      content: text || '📷 Uploaded homework photo',
      imageUrl: pendingImage,
      mode: null,
      createdAt: new Date().toISOString(),
    }
    setMessages((m) => [...m, userMsg])
    setInput('')
    const imageToSend = pendingImage
    setPendingImage(null)
    setStreaming(true)

    // placeholder assistant bubble
    const assistantId = `tmp-a-${Date.now()}`
    setMessages((m) => [
      ...m,
      { id: assistantId, role: 'assistant', content: '', imageUrl: null, mode, createdAt: new Date().toISOString() },
    ])

    const controller = new AbortController()
    abortRef.current = controller
    try {
      await streamTutorChat(
        { studentId, message: text || 'Help me with this homework photo.', mode, imageUrl: imageToSend },
        (delta) => {
          setMessages((m) =>
            m.map((msg) => (msg.id === assistantId ? { ...msg, content: msg.content + delta } : msg))
          )
        },
        controller.signal
      )
    } catch (e: any) {
      if (e?.name !== 'AbortError') {
        setMessages((m) =>
          m.map((msg) =>
            msg.id === assistantId
              ? { ...msg, content: msg.content || `⚠️ ${e?.message ?? 'Something went wrong.'}` }
              : msg
          )
        )
        toast.error('Tutor hit an error. Try again.')
      }
    } finally {
      setStreaming(false)
      abortRef.current = null
      // refresh from server to get persisted ids + any extracted memories
      loadHistory()
    }
  }

  const handleImagePick = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file) return
    if (file.size > 4_500_000) {
      toast.error('Image too large (max ~4.5MB). Try a smaller photo.')
      return
    }
    const reader = new FileReader()
    reader.onload = () => {
      setPendingImage(reader.result as string)
      // switch to homework tab? No — keep in chat, but offer to analyze
      toast('Photo attached. The tutor will read it when you send.', {
        description: 'Tip: use the Homework tab for a structured problem read.',
      })
    }
    reader.readAsDataURL(file)
    e.target.value = ''
  }

  const onKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault()
      handleSend()
    }
  }

  return (
    <div className="flex flex-col rounded-2xl border border-border/60 bg-card overflow-hidden shadow-sm h-[calc(100vh-180px)] min-h-[460px]">
      {/* Chat header */}
      <div className="flex items-center gap-3 px-4 py-3 border-b bg-[var(--mx-emerald-soft)]/50">
        <div className="relative h-10 w-10 rounded-full bg-primary grid place-items-center text-primary-foreground font-semibold shrink-0">
          M
          <span className="absolute -bottom-0.5 -right-0.5 h-3 w-3 rounded-full bg-emerald-500 ring-2 ring-card" />
        </div>
        <div className="flex-1 min-w-0">
          <p className="font-medium leading-tight flex items-center gap-1.5">
            MemoraX Tutor
            <Badge variant="outline" className="text-[10px] py-0 px-1.5 gap-0.5">
              <Sparkles className="h-2.5 w-2.5" /> AI
            </Badge>
          </p>
          <p className="text-[11px] text-muted-foreground">
            {streaming ? 'typing…' : 'online · remembers your sessions'}
          </p>
        </div>
        {/* Mode toggle: Socratic / Show solution */}
        <div className="flex items-center gap-2 rounded-full bg-card border border-border/60 pl-3 pr-2 py-1">
          <Lightbulb className={cn('h-3.5 w-3.5', mode === 'socratic' ? 'text-primary' : 'text-muted-foreground')} />
          <span className={cn('text-xs font-medium', mode === 'socratic' ? 'text-foreground' : 'text-muted-foreground')}>
            Socratic
          </span>
          <Switch
            checked={mode === 'solution'}
            onCheckedChange={(c) => setMode(c ? 'solution' : 'socratic')}
            className="scale-90"
            aria-label="Toggle show solution mode"
          />
          <Eye className={cn('h-3.5 w-3.5', mode === 'solution' ? 'text-[var(--mx-warm)]' : 'text-muted-foreground')} />
          <span className={cn('text-xs font-medium', mode === 'solution' ? 'text-foreground' : 'text-muted-foreground')}>
            Solution
          </span>
        </div>
      </div>

      {/* Messages */}
      <div ref={scrollRef} className="flex-1 overflow-y-auto chat-bg scroll-thin px-3 sm:px-5 py-4 space-y-3">
        {loading ? (
          <div className="space-y-3">
            {[...Array(3)].map((_, i) => (
              <div key={i} className={cn('flex', i % 2 ? 'justify-end' : 'justify-start')}>
                <div className="h-12 w-64 rounded-2xl bg-muted animate-pulse" />
              </div>
            ))}
          </div>
        ) : messages.length === 0 ? (
          <EmptyState />
        ) : (
          messages.map((m) => (
            <ChatBubble
              key={m.id}
              msg={m}
              ttsPlaying={tts.playingId === m.id}
              ttsLoading={tts.loading}
              onSpeak={() => tts.speak(m.id, m.content)}
            />
          ))
        )}
      </div>

      {/* Pending image preview */}
      <AnimatePresence>
        {pendingImage && (
          <motion.div
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: 'auto' }}
            exit={{ opacity: 0, height: 0 }}
            className="border-t bg-muted/40 px-4 py-2"
          >
            <div className="flex items-center gap-3">
              <img src={pendingImage} alt="Homework preview" className="h-16 w-16 rounded-lg object-cover border" />
              <div className="flex-1 min-w-0">
                <p className="text-xs font-medium">Homework photo attached</p>
                <p className="text-[11px] text-muted-foreground">The tutor will read it when you send.</p>
              </div>
              <Button variant="ghost" size="sm" onClick={() => setPendingImage(null)}>
                Remove
              </Button>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Voice recording indicator */}
      <AnimatePresence>
        {voice.recording && (
          <motion.div
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: 'auto' }}
            exit={{ opacity: 0, height: 0 }}
            className="border-t bg-[var(--mx-clay)]/10 px-4 py-2"
          >
            <div className="flex items-center gap-3">
              <span className="relative flex h-3 w-3">
                <span className="absolute inline-flex h-full w-full rounded-full bg-[var(--mx-clay)] opacity-75 animate-ping" />
                <span className="relative inline-flex h-3 w-3 rounded-full bg-[var(--mx-clay)]" />
              </span>
              <span className="text-sm font-medium text-[var(--mx-clay)]">
                Recording… {Math.floor(voice.seconds / 60)}:{String(voice.seconds % 60).padStart(2, '0')}
              </span>
              <div className="flex-1" />
              <Button
                variant="ghost"
                size="sm"
                className="text-muted-foreground"
                onClick={voice.cancel}
              >
                Cancel
              </Button>
              <Button size="sm" className="gap-1.5 bg-[var(--mx-clay)] hover:bg-[var(--mx-clay)]/90" onClick={voice.stop}>
                <Square className="h-3.5 w-3.5" /> Stop & transcribe
              </Button>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
      {voice.transcribing && (
        <div className="border-t bg-muted/40 px-4 py-2 flex items-center gap-2 text-sm text-muted-foreground">
          <Loader2 className="h-4 w-4 animate-spin" />
          Transcribing your voice note…
        </div>
      )}

      {/* Composer */}
      <div className="border-t bg-card px-3 sm:px-4 py-3">
        <div className="flex items-end gap-2">
          <input ref={fileRef} type="file" accept="image/*" className="hidden" onChange={handleImagePick} />
          <Button
            variant="ghost"
            size="icon"
            className="h-9 w-9 shrink-0"
            onClick={() => fileRef.current?.click()}
            disabled={streaming || voice.recording || voice.transcribing}
            aria-label="Attach homework photo"
          >
            <ImageIcon className="h-4.5 w-4.5" />
          </Button>
          <Button
            variant={voice.recording ? 'default' : 'ghost'}
            size="icon"
            className={cn(
              'h-9 w-9 shrink-0',
              voice.recording && 'bg-[var(--mx-clay)] hover:bg-[var(--mx-clay)]/90 animate-pulse'
            )}
            onClick={() => (voice.recording ? voice.stop() : voice.record())}
            disabled={streaming || voice.transcribing}
            aria-label={voice.recording ? 'Stop recording' : 'Record voice note'}
            title={voice.recording ? 'Stop recording' : 'Record a voice note'}
          >
            {voice.transcribing ? (
              <Loader2 className="h-4.5 w-4.5 animate-spin" />
            ) : voice.recording ? (
              <Square className="h-4 w-4" />
            ) : (
              <Mic className="h-4.5 w-4.5" />
            )}
          </Button>
          <Textarea
            value={input}
            onChange={(e) => setInput(e.target.value)}
            onKeyDown={onKeyDown}
            placeholder={
              voice.transcribing
                ? 'Transcribing…'
                : mode === 'socratic'
                ? 'Ask your tutor anything… (Shift+Enter for new line)'
                : 'Describe the problem you want solved…'
            }
            className="flex-1 min-h-[40px] max-h-32 resize-none bg-muted/40 border-0 focus-visible:ring-1 focus-visible:ring-primary"
            disabled={streaming}
            rows={1}
          />
          <Button
            onClick={handleSend}
            disabled={streaming || (!input.trim() && !pendingImage)}
            className="h-10 w-10 p-0 shrink-0 rounded-full"
            aria-label="Send"
          >
            {streaming ? (
              <div className="h-4 w-4 rounded-full border-2 border-primary-foreground/40 border-t-primary-foreground animate-spin" />
            ) : (
              <SendHorizonal className="h-4 w-4" />
            )}
          </Button>
        </div>
        <p className="text-[10px] text-muted-foreground mt-1.5 px-1">
          {mode === 'socratic'
            ? '💡 Socratic mode — the tutor guides you with questions, not just answers.'
            : '👁️ Solution mode — the tutor will show a fully worked solution.'}{' '}
          <button
            className="underline hover:text-foreground"
            onClick={() => setMode(mode === 'socratic' ? 'solution' : 'socratic')}
          >
            switch
          </button>
        </p>
      </div>
    </div>
  )
}

function ChatBubble({
  msg,
  ttsPlaying,
  ttsLoading,
  onSpeak,
}: {
  msg: ChatMsgLite
  ttsPlaying: boolean
  ttsLoading: boolean
  onSpeak: () => void
}) {
  const me = msg.role === 'user'
  const canSpeak = !me && !!msg.content
  return (
    <div className={cn('flex msg-in group', me ? 'justify-end' : 'justify-start')}>
      <div className="max-w-[85%] sm:max-w-[75%]">
        {msg.imageUrl && (
          <div className={cn('mb-1', me ? 'flex justify-end' : 'flex justify-start')}>
            <img
              src={msg.imageUrl}
              alt="Uploaded homework"
              className="max-h-48 rounded-xl border object-contain bg-card"
            />
          </div>
        )}
        <div
          className={cn(
            'rounded-2xl px-3.5 py-2.5 text-sm leading-relaxed shadow-sm',
            me
              ? 'bg-primary text-primary-foreground rounded-br-md'
              : 'bg-card text-card-foreground rounded-bl-md border border-border/50'
          )}
        >
          {msg.content ? (
            <div className="prose-chat">
              <ReactMarkdown
                components={{
                  p: ({ children }) => <p className="m-0 first:mt-0 last:mb-0">{children}</p>,
                  code: ({ children, className }) =>
                    className ? (
                      <code className={className}>{children}</code>
                    ) : (
                      <code className="bg-black/10 dark:bg-white/10 px-1 py-0.5 rounded text-[0.85em]">{children}</code>
                    ),
                  strong: ({ children }) => <strong className="font-semibold">{children}</strong>,
                  ul: ({ children }) => <ul className="my-1 ml-4 list-disc">{children}</ul>,
                  ol: ({ children }) => <ol className="my-1 ml-4 list-decimal">{children}</ol>,
                  li: ({ children }) => <li className="my-0.5">{children}</li>,
                }}
              >
                {msg.content}
              </ReactMarkdown>
            </div>
          ) : (
            <div className="flex items-center gap-1 py-1">
              <div className="h-2 w-2 rounded-full bg-current opacity-50 typing-dot" />
              <div className="h-2 w-2 rounded-full bg-current opacity-50 typing-dot" />
              <div className="h-2 w-2 rounded-full bg-current opacity-50 typing-dot" />
            </div>
          )}
        </div>
        <div className={cn('flex items-center gap-2 mt-1 ml-1', me ? 'justify-end' : 'justify-start')}>
          {!me && msg.mode && (
            <p className="text-[10px] text-muted-foreground">
              {msg.mode === 'solution' ? '👁️ solution mode' : '💡 socratic mode'}
            </p>
          )}
          {canSpeak && (
            <button
              onClick={onSpeak}
              disabled={ttsLoading}
              className={cn(
                'inline-flex items-center gap-1 text-[10px] rounded-full px-1.5 py-0.5 transition-colors',
                ttsPlaying
                  ? 'text-primary bg-primary/10'
                  : 'text-muted-foreground opacity-0 group-hover:opacity-100 hover:text-foreground hover:bg-muted'
              )}
              title={ttsPlaying ? 'Stop audio' : 'Listen to this reply'}
            >
              {ttsLoading ? (
                <Loader2 className="h-3 w-3 animate-spin" />
              ) : (
                <Volume2 className={cn('h-3 w-3', ttsPlaying && 'animate-pulse')} />
              )}
              {ttsPlaying ? 'Stop' : 'Listen'}
            </button>
          )}
        </div>
      </div>
    </div>
  )
}

function EmptyState() {
  return (
    <div className="h-full flex flex-col items-center justify-center text-center px-6 py-10">
      <div className="h-14 w-14 rounded-2xl bg-primary/10 text-primary grid place-items-center mb-4">
        <Brain className="h-7 w-7" />
      </div>
      <h3 className="font-semibold text-lg">Your tutor is ready</h3>
      <p className="text-sm text-muted-foreground mt-2 max-w-sm">
        Ask a question, paste a problem, or attach a photo of your homework. The tutor remembers what
        you worked on before.
      </p>
      <div className="mt-5 flex flex-wrap gap-2 justify-center">
        {['Help me study for my factoring quiz', 'Explain mitosis simply', 'I have a history essay due'].map(
          (s) => (
            <span key={s} className="text-xs bg-muted rounded-full px-3 py-1.5 text-muted-foreground">
              {s}
            </span>
          )
        )}
      </div>
    </div>
  )
}
