'use client'

import * as React from 'react'
import { MessageSquare, Send, ArrowLeft, Loader2, Mail } from 'lucide-react'
import { Card } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Avatar, AvatarFallback } from '@/components/ui/avatar'
import { Textarea } from '@/components/ui/textarea'
import { useSession } from '@/lib/session'
import { api } from '@/lib/api-client'
import { cn } from '@/lib/utils'
import { toast } from 'sonner'

interface Thread {
  id: string
  name: string
  avatar: string | null
  courseName: string
  unread: number
  lastMessage: { content: string; direction: string; createdAt: string } | null
}

interface Msg {
  id: string
  direction: string
  content: string
  readAt: string | null
  createdAt: string
}

export function ParentMessages() {
  const { user } = useSession()
  const [threads, setThreads] = React.useState<Thread[]>([])
  const [activeTeacher, setActiveTeacher] = React.useState<string | null>(null)
  const [messages, setMessages] = React.useState<Msg[]>([])
  const [loading, setLoading] = React.useState(true)
  const [input, setInput] = React.useState('')
  const [sending, setSending] = React.useState(false)
  const scrollRef = React.useRef<HTMLDivElement>(null)

  const loadThreads = React.useCallback(async () => {
    if (!user) return
    setLoading(true)
    try {
      const r = await api.parentMessages(user.id)
      setThreads(r.threads)
    } catch {
      toast.error('Could not load messages')
    } finally {
      setLoading(false)
    }
  }, [user])

  const loadMessages = React.useCallback(async (teacherId: string) => {
    if (!user) return
    try {
      const r = await api.parentMessages(user.id, teacherId)
      setMessages(r.messages)
    } catch {
      toast.error('Could not load conversation')
    }
  }, [user])

  React.useEffect(() => {
    loadThreads()
  }, [loadThreads])

  React.useEffect(() => {
    if (activeTeacher) loadMessages(activeTeacher)
  }, [activeTeacher, loadMessages])

  React.useEffect(() => {
    scrollRef.current?.scrollTo({ top: scrollRef.current.scrollHeight, behavior: 'smooth' })
  }, [messages])

  const send = async () => {
    if (!user || !activeTeacher || !input.trim()) return
    setSending(true)
    try {
      await api.sendParentMessage(user.id, { teacherId: activeTeacher, content: input })
      setInput('')
      loadMessages(activeTeacher)
      loadThreads()
      toast.success('Message sent')
    } catch {
      toast.error('Could not send message')
    } finally {
      setSending(false)
    }
  }

  if (loading) {
    return (
      <div className="space-y-3">
        {[...Array(2)].map((_, i) => (
          <div key={i} className="h-20 rounded-xl bg-muted animate-pulse" />
        ))}
      </div>
    )
  }

  return (
    <div className="space-y-5">
      <Card className="overflow-hidden">
        <div className="flex items-center gap-4 p-5 bg-gradient-to-r from-[var(--mx-emerald-soft)] to-[var(--mx-warm-soft)]/40">
          <div className="h-12 w-12 rounded-xl bg-card grid place-items-center shadow-sm shrink-0">
            <MessageSquare className="h-6 w-6 text-primary" />
          </div>
          <div className="flex-1 min-w-0">
            <h2 className="font-semibold text-lg">Teacher messages</h2>
            <p className="text-sm text-muted-foreground">
              A direct line to your kids&apos; teachers — no phone tag, no email chains.
            </p>
          </div>
        </div>
      </Card>

      {threads.length === 0 ? (
        <Card className="p-10 text-center">
          <div className="h-14 w-14 mx-auto rounded-2xl bg-primary/10 text-primary grid place-items-center mb-3">
            <Mail className="h-7 w-7" />
          </div>
          <p className="font-medium">No teacher conversations yet</p>
          <p className="text-sm text-muted-foreground mt-1 max-w-sm mx-auto">
            Once a teacher messages you about your kid — a kudos, a heads-up, or a quick check-in — the
            thread will appear here. Reply any time, no phone tag required.
          </p>
        </Card>
      ) : !activeTeacher ? (
        /* Thread list */
        <div className="space-y-2">
          {threads.map((t) => (
            <Card key={t.id} className="p-4 hover:shadow-sm transition-shadow cursor-pointer" >
              <button onClick={() => setActiveTeacher(t.id)} className="w-full flex items-center gap-3 text-left">
                <Avatar className="h-11 w-11 shrink-0">
                  <AvatarFallback className="bg-[var(--mx-emerald-soft)]">{t.avatar ?? t.name[0]}</AvatarFallback>
                </Avatar>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2">
                    <p className="font-medium text-sm truncate">{t.name}</p>
                    {t.unread > 0 && <span className="h-2 w-2 rounded-full bg-primary shrink-0" />}
                    <span className="text-[11px] text-muted-foreground ml-auto shrink-0">{t.courseName}</span>
                  </div>
                  {t.lastMessage ? (
                    <p className="text-xs text-muted-foreground truncate mt-0.5">
                      {t.lastMessage.direction === 'PARENT_TO_TEACHER' ? 'You: ' : ''}{t.lastMessage.content}
                    </p>
                  ) : (
                    <p className="text-xs text-muted-foreground mt-0.5">No messages yet</p>
                  )}
                </div>
              </button>
            </Card>
          ))}
        </div>
      ) : (
        /* Conversation view */
        <Card className="overflow-hidden flex flex-col h-[calc(100vh-280px)] min-h-[400px]">
          {/* header */}
          <div className="flex items-center gap-3 px-4 py-3 border-b bg-[var(--mx-emerald-soft)]/50">
            <Button variant="ghost" size="icon" className="h-8 w-8" onClick={() => setActiveTeacher(null)} aria-label="Back to thread list">
              <ArrowLeft className="h-4 w-4" />
            </Button>
            <Avatar className="h-9 w-9">
              <AvatarFallback className="bg-card">
                {threads.find((t) => t.id === activeTeacher)?.avatar ?? 'T'}
              </AvatarFallback>
            </Avatar>
            <div className="flex-1 min-w-0">
              <p className="font-medium text-sm">{threads.find((t) => t.id === activeTeacher)?.name}</p>
              <p className="text-[11px] text-muted-foreground">{threads.find((t) => t.id === activeTeacher)?.courseName}</p>
            </div>
          </div>

          {/* messages */}
          <div ref={scrollRef} className="flex-1 overflow-y-auto chat-bg scroll-thin p-4 space-y-3">
            {messages.length === 0 ? (
              <div className="h-full flex flex-col items-center justify-center text-center">
                <MessageSquare className="h-8 w-8 text-muted-foreground mb-2" />
                <p className="text-sm text-muted-foreground">Start the conversation — say hi to the teacher!</p>
              </div>
            ) : (
              messages.map((m) => {
                const me = m.direction === 'PARENT_TO_TEACHER'
                return (
                  <div key={m.id} className={cn('flex msg-in', me ? 'justify-end' : 'justify-start')}>
                    <div
                      className={cn(
                        'max-w-[80%] rounded-2xl px-3.5 py-2.5 text-sm leading-relaxed shadow-sm',
                        me
                          ? 'bg-primary text-primary-foreground rounded-br-md'
                          : 'bg-card text-card-foreground rounded-bl-md border border-border/50'
                      )}
                    >
                      {m.content}
                    </div>
                  </div>
                )
              })
            )}
          </div>

          {/* composer */}
          <div className="border-t bg-card p-3">
            <div className="flex items-end gap-2">
              <Textarea
                value={input}
                onChange={(e) => setInput(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === 'Enter' && !e.shiftKey) {
                    e.preventDefault()
                    send()
                  }
                }}
                placeholder="Type a message to the teacher…"
                className="flex-1 min-h-[40px] max-h-24 resize-none bg-muted/40 border-0 focus-visible:ring-1 focus-visible:ring-primary"
                rows={1}
                disabled={sending}
              />
              <Button onClick={send} disabled={sending || !input.trim()} className="h-10 w-10 p-0 shrink-0 rounded-full" aria-label="Send message">
                {sending ? <Loader2 className="h-4 w-4 animate-spin" /> : <Send className="h-4 w-4" />}
              </Button>
            </div>
          </div>
        </Card>
      )}
    </div>
  )
}
