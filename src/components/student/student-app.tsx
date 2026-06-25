'use client'

import * as React from 'react'
import { AppHeader } from '@/components/shared/app-header'
import { StudentChat } from '@/components/student/student-chat'
import { StudentClassroom } from '@/components/student/student-classroom'
import { StudentHomework } from '@/components/student/student-homework'
import { StudentMemories } from '@/components/student/student-memories'
import { StudentAvatar } from '@/components/student/student-avatar'
import { StudentReview } from '@/components/student/student-review'
import { StudentExamPrep } from '@/components/student/student-exam-prep'
import { StudentGroups } from '@/components/student/student-groups'
import { useSession } from '@/lib/session'
import type { StudentTab } from '@/lib/types'
import {
  MessageSquareText,
  CalendarClock,
  Camera,
  Brain,
  Sparkles,
  RotateCw,
  CalendarPlus,
  Users,
} from 'lucide-react'
import { cn } from '@/lib/utils'

const TABS: { id: StudentTab; label: string; icon: React.ElementType }[] = [
  { id: 'chat', label: 'Tutor Chat', icon: MessageSquareText },
  { id: 'classroom', label: 'Classroom', icon: CalendarClock },
  { id: 'homework', label: 'Homework', icon: Camera },
  { id: 'review', label: 'Review', icon: RotateCw },
  { id: 'exam', label: 'Exam Prep', icon: CalendarPlus },
  { id: 'avatar', label: 'Avatar & Shop', icon: Sparkles },
  { id: 'groups', label: 'Study Groups', icon: Users },
  { id: 'memories', label: 'Memories', icon: Brain },
]

export type ExtendedStudentTab = StudentTab | 'review' | 'exam' | 'avatar' | 'groups'

export function StudentApp() {
  const { user } = useSession()
  const [tab, setTab] = React.useState<ExtendedStudentTab>('chat')

  return (
    <div className="min-h-screen flex flex-col">
      <AppHeader user={user ?? null} subtitle={user?.grade ?? undefined} />
      <main className="flex-1 mx-auto w-full max-w-6xl px-3 sm:px-6 py-4 flex flex-col">
        {/* Tabs */}
        <nav className="flex items-center gap-1 mb-4 overflow-x-auto scroll-thin -mx-1 px-1 pb-1">
          {TABS.map((t) => {
            const Icon = t.icon
            const active = tab === t.id
            return (
              <button
                key={t.id}
                onClick={() => setTab(t.id as ExtendedStudentTab)}
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
        </nav>

        {tab === 'chat' && <StudentChat />}
        {tab === 'classroom' && <StudentClassroom />}
        {tab === 'homework' && <StudentHomework />}
        {tab === 'review' && <StudentReview />}
        {tab === 'exam' && <StudentExamPrep />}
        {tab === 'avatar' && <StudentAvatar />}
        {tab === 'groups' && <StudentGroups />}
        {tab === 'memories' && <StudentMemories />}
      </main>
    </div>
  )
}
