'use client'

import * as React from 'react'
import { MessageSquare, Send, ArrowRight } from 'lucide-react'
import { Card } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Avatar, AvatarFallback } from '@/components/ui/avatar'
import { useSession } from '@/lib/session'
import { api } from '@/lib/api-client'
import { cn } from '@/lib/utils'
import { toast } from 'sonner'

interface SentMessage {
  id: string
  courseId: string
  courseName: string
  studentId: string
  studentName: string
  studentAvatar: string | null
  studentGrade: string | null
  content: string
  readAt: string | null
  createdAt: string
}

export function TeacherMessages() {
  const { user } = useSession()
  const [messages, setMessages] = React.useState<SentMessage[]>([])
  const [loading, setLoading] = React.useState(true)

  const load = React.useCallback(async () => {
    if (!user) return
    setLoading(true)
    try {
      const r = await api.teacherMessages(user.id)
      setMessages(r.messages)
    } catch {
      toast.error('Could not load messages')
    } finally {
      setLoading(false)
    }
  }, [user])

  React.useEffect(() => {
    load()
  }, [load])

  return (
    <div className="space-y-5">
      <Card className="overflow-hidden">
        <div className="flex items-center gap-4 p-5 bg-gradient-to-r from-[var(--mx-emerald-soft)] to-[var(--mx-warm-soft)]/40">
          <div className="h-12 w-12 rounded-xl bg-card grid place-items-center shadow-sm shrink-0">
            <MessageSquare className="h-6 w-6 text-primary" />
          </div>
          <div className="flex-1 min-w-0">
            <h2 className="font-semibold text-lg">Messages you&apos;ve sent</h2>
            <p className="text-sm text-muted-foreground">
              Nudges and kudos delivered through the MemoraX assistant — students see them in chat.
            </p>
          </div>
          <Badge variant="secondary" className="hidden sm:flex">{messages.length} sent</Badge>
        </div>
      </Card>

      {loading ? (
        <div className="space-y-3">
          {[...Array(3)].map((_, i) => (
            <div key={i} className="h-24 rounded-xl bg-muted animate-pulse" />
          ))}
        </div>
      ) : messages.length === 0 ? (
        <Card className="p-10 text-center">
          <MessageSquare className="h-10 w-10 mx-auto text-muted-foreground mb-3" />
          <p className="font-medium">No messages sent yet</p>
          <p className="text-sm text-muted-foreground mt-1 max-w-sm mx-auto">
            Open the Student Progress tab, pick a class, and tap “Message” on any student to send a
            nudge or kudos through the assistant.
          </p>
        </Card>
      ) : (
        <div className="space-y-3">
          {messages.map((m) => (
            <Card key={m.id} className="p-4">
              <div className="flex items-start gap-3">
                <Avatar className="h-10 w-10 shrink-0">
                  <AvatarFallback className="bg-[var(--mx-emerald-soft)]">{m.studentAvatar ?? m.studentName[0]}</AvatarFallback>
                </Avatar>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 mb-1 flex-wrap">
                    <p className="font-medium text-sm">{m.studentName}</p>
                    <Badge variant="outline" className="text-[10px] py-0 px-1.5">{m.courseName}</Badge>
                    {m.readAt ? (
                      <Badge variant="outline" className="text-[10px] py-0 px-1.5 text-emerald-600">read</Badge>
                    ) : (
                      <Badge variant="outline" className="text-[10px] py-0 px-1.5">delivered</Badge>
                    )}
                    <span className="text-[11px] text-muted-foreground ml-auto">
                      {new Date(m.createdAt).toLocaleString(undefined, { month: 'short', day: 'numeric', hour: 'numeric', minute: '2-digit' })}
                    </span>
                  </div>
                  <p className="text-sm leading-relaxed bg-muted/40 rounded-lg px-3 py-2">{m.content}</p>
                </div>
              </div>
            </Card>
          ))}
        </div>
      )}

      {/* tip */}
      <Card className="p-5 bg-[var(--mx-emerald-soft)]/30">
        <div className="flex items-start gap-3">
          <div className="h-9 w-9 rounded-lg bg-primary/10 text-primary grid place-items-center shrink-0">
            <Send className="h-4.5 w-4.5" />
          </div>
          <div>
            <p className="font-medium text-sm">Why message through MemoraX?</p>
            <p className="text-xs text-muted-foreground mt-1 leading-relaxed">
              Messages land inside the student&apos;s tutor chat, so they feel like a friendly nudge —
              not another notification. And the tutor knows about the message, so it can weave your
              feedback into the next session.
            </p>
          </div>
        </div>
      </Card>
    </div>
  )
}
