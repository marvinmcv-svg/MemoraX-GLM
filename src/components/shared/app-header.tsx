'use client'

import { ArrowLeft, LogOut } from 'lucide-react'
import { Logo } from '@/components/brand/logo'
import { ThemeToggle } from '@/components/brand/theme-toggle'
import { Button } from '@/components/ui/button'
import { useSession } from '@/lib/session'
import type { SafeUser } from '@/lib/types'

export function AppHeader({
  user,
  subtitle,
  rightSlot,
}: {
  user: SafeUser | null
  subtitle?: string
  rightSlot?: React.ReactNode
}) {
  const { setView, reset } = useSession()
  return (
    <header className="sticky top-0 z-40 glass border-b border-border/60">
      <div className="mx-auto max-w-6xl px-3 sm:px-6 h-14 flex items-center justify-between gap-2">
        <div className="flex items-center gap-2 min-w-0">
          <button
            onClick={() => {
              reset()
              setView('landing')
            }}
            className="md:hidden grid place-items-center h-8 w-8 rounded-lg hover:bg-muted"
            aria-label="Back to landing"
          >
            <ArrowLeft className="h-4 w-4" />
          </button>
          <button
            onClick={() => {
              reset()
              setView('landing')
            }}
            className="hidden md:flex items-center gap-2"
            aria-label="Back to landing"
          >
            <Logo size="sm" />
          </button>
          <div className="hidden sm:block h-5 w-px bg-border mx-1" />
          <div className="min-w-0">
            <p className="text-sm font-medium truncate flex items-center gap-1.5">
              {user?.avatar && <span>{user.avatar}</span>}
              <span className="truncate">{user?.name}</span>
            </p>
            {subtitle && <p className="text-[11px] text-muted-foreground truncate">{subtitle}</p>}
          </div>
        </div>
        <div className="flex items-center gap-1.5">
          {rightSlot}
          <ThemeToggle />
          <Button
            variant="ghost"
            size="sm"
            className="gap-1.5 hidden sm:flex"
            onClick={() => {
              reset()
              setView('landing')
            }}
          >
            <LogOut className="h-3.5 w-3.5" /> Exit
          </Button>
        </div>
      </div>
    </header>
  )
}
