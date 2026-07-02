'use client'

import { SessionProvider } from 'next-auth/react'
import type { ReactNode } from 'react'

/**
 * Client-side NextAuth SessionProvider wrapper.
 * Lets admin components use `useSession()` / `signIn()` / `signOut()`.
 */
export function AuthSessionProvider({ children }: { children: ReactNode }) {
  return <SessionProvider>{children}</SessionProvider>
}
