'use client'

import * as React from 'react'
import { signIn } from 'next-auth/react'
import { useRouter } from 'next/navigation'
import { ShieldCheck, ArrowLeft, Loader2 } from 'lucide-react'
import { motion } from 'framer-motion'
import { Logo } from '@/components/brand/logo'
import { ThemeToggle } from '@/components/brand/theme-toggle'
import { Button } from '@/components/ui/button'
import { Card } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { useSession } from '@/lib/session'
import { toast } from 'sonner'
import type { SafeUser } from '@/lib/types'

export function AdminLogin() {
  const router = useRouter()
  const { setView, setUser } = useSession()
  const [email, setEmail] = React.useState('admin@memorax.school')
  const [password, setPassword] = React.useState('')
  const [loading, setLoading] = React.useState(false)

  const onSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (loading) return
    setLoading(true)
    try {
      const res = await signIn('credentials', {
        email,
        password,
        redirect: false,
      })
      if (!res || res.error) {
        toast.error('Wrong email or password. Try again.')
        return
      }
      // Pull the session we just created to confirm role + populate mock session.
      const sessionRes = await fetch('/api/auth/session')
      const session = await sessionRes.json()
      const u = session?.user
      if (!u || u.role !== 'ADMIN') {
        // Non-admin credentials worked, but they should use role cards instead.
        toast('That account exists, but admins sign in here. Use the role cards on the landing page for student/parent/teacher demos.')
        // Sign them back out so the cookie doesn't linger.
        await fetch('/api/auth/signout', { method: 'POST' }).catch(() => {})
        setView('landing')
        router.push('/')
        return
      }
      const safe: SafeUser = {
        id: u.id,
        email: u.email,
        name: u.name,
        role: u.role,
        avatar: u.avatar ?? null,
        grade: u.grade ?? null,
      }
      setUser(safe)
      setView('admin')
      toast.success(`Welcome back, ${u.name}`)
    } catch (e: any) {
      toast.error(e?.message ?? 'Sign-in failed')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="min-h-screen flex flex-col">
      <header className="border-b border-border/60 glass sticky top-0 z-40">
        <div className="mx-auto max-w-6xl px-4 sm:px-6 h-14 flex items-center justify-between">
          <button
            onClick={() => setView('landing')}
            className="flex items-center gap-2 rounded-md focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
            aria-label="Back to landing"
          >
            <Logo size="sm" />
          </button>
          <div className="flex items-center gap-2">
            <ThemeToggle />
            <Button
              variant="ghost"
              size="sm"
              className="gap-1.5"
              onClick={() => setView('landing')}
            >
              <ArrowLeft className="h-3.5 w-3.5" /> Back to landing
            </Button>
          </div>
        </div>
      </header>

      <main className="flex-1 grid place-items-center px-4 py-12 relative overflow-hidden">
        <div className="absolute inset-0 -z-10 pointer-events-none">
          <div className="absolute -top-32 left-1/2 -translate-x-1/2 h-[420px] w-[620px] rounded-full bg-[var(--mx-emerald-soft)] blur-3xl opacity-50" />
        </div>

        <motion.div
          initial={{ opacity: 0, y: 14 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.4 }}
          className="w-full max-w-sm"
        >
          <Card className="p-6 sm:p-7 shadow-lg border-border/60">
            <div className="flex flex-col items-center text-center mb-6">
              <div className="h-12 w-12 rounded-2xl grid place-items-center bg-primary text-primary-foreground shadow-sm mb-3">
                <ShieldCheck className="h-6 w-6" />
              </div>
              <h1 className="text-xl font-bold tracking-tight">MemoraX Admin</h1>
              <p className="text-sm text-muted-foreground mt-1">
                Sign in to manage users and demo data.
              </p>
            </div>

            <form onSubmit={onSubmit} className="space-y-4">
              <div className="space-y-1.5">
                <Label htmlFor="admin-email">Email</Label>
                <Input
                  id="admin-email"
                  type="email"
                  autoComplete="email"
                  required
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="admin@memorax.school"
                />
              </div>
              <div className="space-y-1.5">
                <Label htmlFor="admin-password">Password</Label>
                <Input
                  id="admin-password"
                  type="password"
                  autoComplete="current-password"
                  required
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="••••••••"
                />
              </div>

              <Button
                type="submit"
                disabled={loading}
                className="w-full h-10 gap-2"
              >
                {loading ? (
                  <>
                    <Loader2 className="h-4 w-4 animate-spin" /> Signing in…
                  </>
                ) : (
                  <>
                    <ShieldCheck className="h-4 w-4" /> Sign in
                  </>
                )}
              </Button>
            </form>

            <div className="mt-5 rounded-lg border border-dashed border-border/70 bg-[var(--mx-warm-soft)]/40 px-3 py-2.5 text-xs text-muted-foreground">
              <p className="font-medium text-foreground">Demo admin</p>
              <p className="mt-0.5">
                <code className="font-mono">admin@memorax.school</code> /{' '}
                <code className="font-mono">admin1234</code>
              </p>
            </div>
          </Card>

          <p className="text-center text-xs text-muted-foreground mt-4">
            Admins only. Students, parents, and teachers can use the demo cards on the{' '}
            <button
              type="button"
              onClick={() => setView('landing')}
              className="text-foreground underline underline-offset-2 hover:text-primary"
            >
              landing page
            </button>
            .
          </p>
        </motion.div>
      </main>
    </div>
  )
}
