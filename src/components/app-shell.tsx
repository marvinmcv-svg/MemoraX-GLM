'use client'

import * as React from 'react'
import { useSession } from '@/lib/session'
import { api } from '@/lib/api-client'
import { Landing } from '@/components/landing/landing'
import { StudentApp } from '@/components/student/student-app'
import { ParentApp } from '@/components/parent/parent-app'
import { TeacherApp } from '@/components/teacher/teacher-app'

export function AppShell() {
  const { view, bootstrapped, setBootstrapped } = useSession()
  const [booting, setBooting] = React.useState(true)

  // Bootstrap demo data on first load
  React.useEffect(() => {
    if (bootstrapped) {
      setBooting(false)
      return
    }
    let mounted = true
    ;(async () => {
      try {
        await api.bootstrap()
        if (mounted) {
          setBootstrapped(true)
          setBooting(false)
        }
      } catch (e) {
        console.error('bootstrap failed', e)
        if (mounted) setBooting(false)
      }
    })()
    return () => {
      mounted = false
    }
  }, [bootstrapped, setBootstrapped])

  if (booting) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center gap-4">
        <div className="flex items-center gap-2">
          <div className="h-3 w-3 rounded-full bg-primary typing-dot" />
          <div className="h-3 w-3 rounded-full bg-primary typing-dot" />
          <div className="h-3 w-3 rounded-full bg-primary typing-dot" />
        </div>
        <p className="text-sm text-muted-foreground">Warming up MemoraX…</p>
      </div>
    )
  }

  return (
    <div className="min-h-screen flex flex-col">
      {view === 'landing' && <Landing />}
      {view === 'student' && <StudentApp />}
      {view === 'parent' && <ParentApp />}
      {view === 'teacher' && <TeacherApp />}
    </div>
  )
}
