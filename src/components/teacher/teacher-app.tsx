'use client'

import * as React from 'react'
import { AppHeader } from '@/components/shared/app-header'
import { TeacherClasses } from '@/components/teacher/teacher-classes'
import { TeacherRoster } from '@/components/teacher/teacher-roster'
import { TeacherMessages } from '@/components/teacher/teacher-messages'
import { useSession } from '@/lib/session'
import type { TeacherTab } from '@/lib/types'
import { Users, LayoutGrid, MessageSquare } from 'lucide-react'
import { cn } from '@/lib/utils'

const TABS: { id: TeacherTab; label: string; icon: React.ElementType }[] = [
  { id: 'classes', label: 'My Classes', icon: LayoutGrid },
  { id: 'progress', label: 'Student Progress', icon: Users },
  { id: 'messages', label: 'Messages', icon: MessageSquare },
]

export function TeacherApp() {
  const { user } = useSession()
  const [tab, setTab] = React.useState<TeacherTab>('classes')
  const [activeCourseId, setActiveCourseId] = React.useState<string | null>(null)

  return (
    <div className="min-h-screen flex flex-col">
      <AppHeader user={user ?? null} subtitle="Teacher" />
      <main className="flex-1 mx-auto w-full max-w-6xl px-3 sm:px-6 py-4 flex flex-col">
        <nav className="flex items-center gap-1 mb-4 overflow-x-auto scroll-thin -mx-1 px-1 pb-1">
          {TABS.map((t) => {
            const Icon = t.icon
            const active = tab === t.id
            return (
              <button
                key={t.id}
                onClick={() => setTab(t.id)}
                className={cn(
                  'flex items-center gap-2 rounded-lg px-3.5 py-2 text-sm font-medium whitespace-nowrap transition-colors',
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
        </nav>

        {tab === 'classes' && (
          <TeacherClasses
            onOpenCourse={(id) => {
              setActiveCourseId(id)
              setTab('progress')
            }}
          />
        )}
        {tab === 'progress' && (
          <TeacherRoster
            courseId={activeCourseId}
            onClearCourse={() => {
              setActiveCourseId(null)
              setTab('classes')
            }}
            onPickCourse={setActiveCourseId}
          />
        )}
        {tab === 'messages' && <TeacherMessages />}
      </main>
    </div>
  )
}
