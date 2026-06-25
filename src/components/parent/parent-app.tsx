'use client'

import * as React from 'react'
import { AppHeader } from '@/components/shared/app-header'
import { ParentInbox } from '@/components/parent/parent-inbox'
import { ParentFamily } from '@/components/parent/parent-family'
import { ParentInsights } from '@/components/parent/parent-insights'
import { ParentMessages } from '@/components/parent/parent-messages'
import { ParentSettings } from '@/components/parent/parent-settings'
import { useSession } from '@/lib/session'
import type { ParentTab } from '@/lib/types'
import { BellRing, Users, Sparkles, MessageSquare, Settings } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { cn } from '@/lib/utils'
import { toast } from 'sonner'

const TABS: { id: ParentTab; label: string; icon: React.ElementType }[] = [
  { id: 'inbox', label: 'Inbox', icon: BellRing },
  { id: 'insights', label: 'Insights', icon: Sparkles },
  { id: 'family', label: 'Family', icon: Users },
  { id: 'messages', label: 'Messages', icon: MessageSquare },
  { id: 'settings', label: 'Settings', icon: Settings },
]

export type ExtendedParentTab = ParentTab | 'insights' | 'messages' | 'settings'

export function ParentApp() {
  const { user } = useSession()
  const [tab, setTab] = React.useState<ExtendedParentTab>('inbox')
  const [generating, setGenerating] = React.useState(false)
  const [refreshKey, setRefreshKey] = React.useState(0)

  const generateDigest = async () => {
    if (!user) return
    setGenerating(true)
    try {
      const res = await fetch(`/api/parent/${user.id}/generate-digest`, { method: 'POST' })
      const data = await res.json()
      toast.success(`Fresh 7 PM digest generated for ${data.created} student${data.created === 1 ? '' : 's'}`)
      setRefreshKey((k) => k + 1)
      setTab('inbox')
    } catch {
      toast.error('Could not generate digest')
    } finally {
      setGenerating(false)
    }
  }

  return (
    <div className="min-h-screen flex flex-col">
      <AppHeader
        user={user ?? null}
        subtitle="Parent"
        rightSlot={
          <Button
            size="sm"
            variant="outline"
            className="gap-1.5 hidden sm:flex"
            onClick={generateDigest}
            disabled={generating}
          >
            <Sparkles className={cn('h-3.5 w-3.5', generating && 'animate-spin')} />
            {generating ? 'Generating…' : 'Refresh digest'}
          </Button>
        }
      />
      <main className="flex-1 mx-auto w-full max-w-6xl px-3 sm:px-6 py-4 flex flex-col">
        <nav className="flex items-center gap-1 mb-4 overflow-x-auto scroll-thin -mx-1 px-1 pb-1">
          {TABS.map((t) => {
            const Icon = t.icon
            const active = tab === t.id
            return (
              <button
                key={t.id}
                onClick={() => setTab(t.id as ExtendedParentTab)}
                className={cn(
                  'flex items-center gap-2 rounded-lg px-3.5 py-2 text-sm font-medium whitespace-nowrap transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-1 focus-visible:ring-offset-background',
                  active
                    ? 'bg-primary text-primary-foreground shadow-sm'
                    : 'text-muted-foreground hover:text-foreground hover:bg-muted'
                )}
              >
                <Icon className="h-4 w-4" />
                {t.label}
              </button>
            )
          })}
          <Button
            size="sm"
            variant="ghost"
            className="gap-1.5 ml-auto sm:hidden"
            onClick={generateDigest}
            disabled={generating}
          >
            <Sparkles className={cn('h-3.5 w-3.5', generating && 'animate-spin')} />
            Digest
          </Button>
        </nav>

        {tab === 'inbox' && <ParentInbox refreshKey={refreshKey} />}
        {tab === 'insights' && <ParentInsights />}
        {tab === 'family' && <ParentFamily />}
        {tab === 'messages' && <ParentMessages />}
        {tab === 'settings' && <ParentSettings />}
      </main>
    </div>
  )
}
