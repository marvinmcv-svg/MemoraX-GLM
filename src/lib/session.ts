'use client'

import { create } from 'zustand'
import { persist } from 'zustand/middleware'
import type { Role, View, SafeUser } from './types'

interface SessionState {
  // view routing
  view: View
  setView: (v: View) => void

  // current logged-in user (mock — set on role selection)
  user: SafeUser | null
  setUser: (u: SafeUser | null) => void

  // for parents/teachers: which student they're viewing
  activeStudentId: string | null
  setActiveStudentId: (id: string | null) => void

  // bootstrap: ensure demo data exists
  bootstrapped: boolean
  setBootstrapped: (b: boolean) => void

  reset: () => void
}

export const useSession = create<SessionState>()(
  persist(
    (set) => ({
      view: 'landing',
      setView: (v) => set({ view: v }),

      user: null,
      setUser: (u) => set({ user: u, activeStudentId: null }),

      activeStudentId: null,
      setActiveStudentId: (id) => set({ activeStudentId: id }),

      bootstrapped: false,
      setBootstrapped: (b) => set({ bootstrapped: b }),

      reset: () =>
        set({
          view: 'landing',
          user: null,
          activeStudentId: null,
          bootstrapped: false,
        }),
    }),
    { name: 'memorax-session' }
  )
)
