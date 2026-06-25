'use client'

import * as React from 'react'
import { AppHeader } from '@/components/shared/app-header'
import { ParentInbox } from '@/components/parent/parent-inbox'
import { ParentFamily } from '@/components/parent/parent-family'
import { useSession } from '@/lib/session'
import type { ParentTab } from '@/lib/types'
import { BellRing, Users, Sparkles } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { cn } from '@/lib/utils'
import { api } from '@/lib/api-client'
import { toast } from 'sonner'

const TABS: { id: ParentTab; label: string; icon: React.ElementType }[] = [
  { id: 'inbox', label: 'Reminder Inbox', icon: BellRing },
  { id: 'family', label: 'Family Bundle', icon: Users },
]

export function ParentApp() {
  const { user } = useSession()
  const [tab, setTab] = React.useState<ParentTab>('inbox')
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
        <nav className="flex items-center gap-1 mb-4">
          {TABS.map((t) => {
            const Icon = t.icon
            const active = tab === t.id
            return (
              <button
                key={t.id}
                onClick={() => setTab(t.id)}
                className={cn(
                  'flex items-center gap-2 rounded-lg px-3.5 py-2 text-sm font-medium transition-colors',
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
        {tab === 'family' && <ParentFamily />}
      </main>
    </div>
  )
}
