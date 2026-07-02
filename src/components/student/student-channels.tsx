'use client'

import * as React from 'react'
import { MessageCircle, Phone, Check, Loader2, Link2, Unlink, Send, Copy } from 'lucide-react'
import { Card } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { useSession } from '@/lib/session'
import { toast } from 'sonner'
import { cn } from '@/lib/utils'

interface ChannelStatus {
  telegram: { linked: boolean; chatId: string | null; botUsername: string; botName: string; available: boolean }
  whatsapp: { linked: boolean; phone: string | null; available: boolean }
  userName: string
  userEmail: string
}

export function StudentChannels() {
  const { user } = useSession()
  const [status, setStatus] = React.useState<ChannelStatus | null>(null)
  const [loading, setLoading] = React.useState(true)
  const [phoneInput, setPhoneInput] = React.useState('')
  const [linking, setLinking] = React.useState(false)

  const load = React.useCallback(async () => {
    if (!user) return
    setLoading(true)
    try {
      const url = `/api/channels/status?userId=${user.id}`
      const res = await fetch(url)
      const data = await res.json()
      if (!data.error) {
        setStatus(data)
        setPhoneInput(data.whatsapp?.phone || '')
      }
    } catch {
      toast.error('Could not load channel status')
    } finally {
      setLoading(false)
    }
  }, [user])

  React.useEffect(() => {
    load()
  }, [load])

  const linkWhatsApp = async () => {
    if (!user || !phoneInput.trim()) return
    setLinking(true)
    try {
      const res = await fetch(`/api/channels/status?userId=${user.id}`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ channel: 'whatsapp', phone: phoneInput.trim() }),
      })
      const data = await res.json()
      if (data.ok) {
        toast.success('WhatsApp linked!')
        load()
      } else {
        toast.error(data.error || 'Could not link WhatsApp')
      }
    } catch {
      toast.error('Linking failed')
    } finally {
      setLinking(false)
    }
  }

  const unlink = async (channel: 'telegram' | 'whatsapp') => {
    if (!user) return
    try {
      await fetch(`/api/channels/status?userId=${user.id}`, {
        method: 'DELETE',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ channel }),
      })
      toast.success(`${channel === 'telegram' ? 'Telegram' : 'WhatsApp'} unlinked`)
      load()
    } catch {
      toast.error('Could not unlink')
    }
  }

  const copyEmail = () => {
    if (status?.userEmail) {
      navigator.clipboard.writeText(status.userEmail)
      toast.success('Email copied! Send it to the bot to link your account.')
    }
  }

  if (loading) {
    return (
      <div className="space-y-4">
        <div className="h-40 rounded-xl bg-muted animate-pulse" />
        <div className="h-40 rounded-xl bg-muted animate-pulse" />
      </div>
    )
  }

  return (
    <div className="space-y-5">
      {/* Header */}
      <Card className="overflow-hidden">
        <div className="flex items-center gap-4 p-5 bg-gradient-to-r from-[var(--mx-emerald-soft)] to-[var(--mx-warm-soft)]/40">
          <div className="h-12 w-12 rounded-xl bg-card grid place-items-center shadow-sm shrink-0">
            <MessageCircle className="h-6 w-6 text-primary" />
          </div>
          <div className="flex-1 min-w-0">
            <h2 className="font-semibold text-lg">Connect your chat apps</h2>
            <p className="text-sm text-muted-foreground">
              Use MemoraX from WhatsApp or Telegram — the same AI tutor, right in your chat app.
            </p>
          </div>
        </div>
      </Card>

      {/* Telegram */}
      <Card className="p-5">
        <div className="flex items-start gap-4">
          <div className="h-12 w-12 rounded-xl bg-[#0088cc]/10 grid place-items-center shrink-0">
            <Send className="h-6 w-6 text-[#0088cc]" />
          </div>
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-2 mb-1">
              <h3 className="font-semibold">Telegram</h3>
              {status?.telegram.linked ? (
                <Badge variant="outline" className="text-[10px] text-emerald-600 gap-1">
                  <Check className="h-2.5 w-2.5" /> Connected
                </Badge>
              ) : (
                <Badge variant="outline" className="text-[10px] text-muted-foreground">Not connected</Badge>
              )}
            </div>

            {status?.telegram.linked ? (
              <div className="space-y-3">
                <p className="text-sm text-muted-foreground">
                  ✅ Your Telegram is linked. Send a message to @{status.telegram.botUsername} and your tutor will respond!
                </p>
                <Button variant="outline" size="sm" className="gap-1.5" onClick={() => unlink('telegram')}>
                  <Unlink className="h-3 w-3" /> Disconnect
                </Button>
              </div>
            ) : (
              <div className="space-y-3">
                <p className="text-sm text-muted-foreground">
                  Connect Telegram to chat with your AI tutor right from your phone. It remembers everything from your web sessions.
                </p>

                {status?.telegram.available ? (
                  <div className="rounded-lg bg-muted/40 p-3 space-y-2">
                    <p className="text-xs font-medium">How to connect:</p>
                    <ol className="text-xs text-muted-foreground space-y-1 list-decimal list-inside">
                      <li>Open Telegram and search for <b>@{status.telegram.botUsername}</b></li>
                      <li>Send <code className="bg-muted px-1 rounded">/start</code></li>
                      <li>Send <code className="bg-muted px-1 rounded">/link {status.userEmail}</code></li>
                    </ol>
                    <Button variant="ghost" size="sm" className="gap-1.5 h-7" onClick={copyEmail}>
                      <Copy className="h-3 w-3" /> Copy my email
                    </Button>
                  </div>
                ) : (
                  <div className="rounded-lg bg-[var(--mx-warm-soft)]/30 p-3">
                    <p className="text-xs text-muted-foreground">
                      ⏳ Telegram integration is coming soon! The bot is being set up. Check back shortly.
                    </p>
                  </div>
                )}
              </div>
            )}
          </div>
        </div>
      </Card>

      {/* WhatsApp */}
      <Card className="p-5">
        <div className="flex items-start gap-4">
          <div className="h-12 w-12 rounded-xl bg-[#25D366]/10 grid place-items-center shrink-0">
            <Phone className="h-6 w-6 text-[#25D366]" />
          </div>
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-2 mb-1">
              <h3 className="font-semibold">WhatsApp</h3>
              {status?.whatsapp.linked ? (
                <Badge variant="outline" className="text-[10px] text-emerald-600 gap-1">
                  <Check className="h-2.5 w-2.5" /> Connected
                </Badge>
              ) : (
                <Badge variant="outline" className="text-[10px] text-muted-foreground">Not connected</Badge>
              )}
            </div>

            {status?.whatsapp.linked ? (
              <div className="space-y-3">
                <p className="text-sm text-muted-foreground">
                  ✅ Your WhatsApp ({status.whatsapp.phone}) is linked. Send a message to the MemoraX number and your tutor will respond!
                </p>
                <Button variant="outline" size="sm" className="gap-1.5" onClick={() => unlink('whatsapp')}>
                  <Unlink className="h-3 w-3" /> Disconnect
                </Button>
              </div>
            ) : (
              <div className="space-y-3">
                <p className="text-sm text-muted-foreground">
                  Connect WhatsApp to chat with your AI tutor from your phone. Same memory, same tutor.
                </p>

                {status?.whatsapp.available ? (
                  <div className="space-y-2">
                    <Label htmlFor="wa-phone">Your WhatsApp phone number</Label>
                    <div className="flex gap-2">
                      <Input
                        id="wa-phone"
                        value={phoneInput}
                        onChange={(e) => setPhoneInput(e.target.value)}
                        placeholder="+1 234 567 8900"
                        className="flex-1"
                      />
                      <Button onClick={linkWhatsApp} disabled={linking || !phoneInput.trim()} className="gap-1.5">
                        {linking ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <Link2 className="h-3.5 w-3.5" />}
                        Link
                      </Button>
                    </div>
                    <p className="text-[11px] text-muted-foreground">
                      Include your country code (e.g., +1 for US, +44 for UK).
                    </p>
                  </div>
                ) : (
                  <div className="rounded-lg bg-[var(--mx-warm-soft)]/30 p-3">
                    <p className="text-xs text-muted-foreground">
                      ⏳ WhatsApp integration is coming soon! We're setting up the WhatsApp Business API. Check back shortly.
                    </p>
                  </div>
                )}
              </div>
            )}
          </div>
        </div>
      </Card>

      {/* How it works */}
      <Card className="p-5 bg-[var(--mx-emerald-soft)]/30">
        <h3 className="font-semibold text-sm mb-3">How it works</h3>
        <div className="grid sm:grid-cols-3 gap-4 text-sm">
          <div className="flex gap-2">
            <div className="h-6 w-6 rounded-full bg-primary text-primary-foreground grid place-items-center text-xs font-bold shrink-0">1</div>
            <div>
              <p className="font-medium text-sm">Connect once</p>
              <p className="text-xs text-muted-foreground mt-0.5">Link your Telegram or WhatsApp from here.</p>
            </div>
          </div>
          <div className="flex gap-2">
            <div className="h-6 w-6 rounded-full bg-primary text-primary-foreground grid place-items-center text-xs font-bold shrink-0">2</div>
            <div>
              <p className="font-medium text-sm">Chat anytime</p>
              <p className="text-xs text-muted-foreground mt-0.5">Send a message or homework photo from your phone.</p>
            </div>
          </div>
          <div className="flex gap-2">
            <div className="h-6 w-6 rounded-full bg-primary text-primary-foreground grid place-items-center text-xs font-bold shrink-0">3</div>
            <div>
              <p className="font-medium text-sm">Same brain</p>
              <p className="text-xs text-muted-foreground mt-0.5">Your tutor remembers everything — across web, Telegram, and WhatsApp.</p>
            </div>
          </div>
        </div>
      </Card>
    </div>
  )
}
