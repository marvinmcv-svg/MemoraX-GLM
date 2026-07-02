'use client'
import * as React from 'react'
import { signIn } from 'next-auth/react'
import { motion } from 'framer-motion'
import { Mail, Lock, LogIn, Users, Shield, GraduationCap, Loader2, Eye, EyeOff, ArrowLeft } from 'lucide-react'
import { Logo } from '@/components/brand/logo'
import { ThemeToggle } from '@/components/brand/theme-toggle'
import { Button } from '@/components/ui/button'
import { Card } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { toast } from 'sonner'

export function LoginPage({ onDemoMode }: { onDemoMode: () => void }) {
  const [email, setEmail] = React.useState('')
  const [password, setPassword] = React.useState('')
  const [showPassword, setShowPassword] = React.useState(false)
  const [loading, setLoading] = React.useState(false)
  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!email.trim() || !password.trim()) { toast.error('Please enter your email and password'); return }
    setLoading(true)
    try {
      const result = await signIn('credentials', { email: email.trim().toLowerCase(), password, redirect: false })
      if (result?.error) toast.error('Invalid email or password')
      else if (result?.ok) { toast.success('Welcome back!'); setTimeout(() => window.location.reload(), 500) }
    } catch { toast.error('Login failed') } finally { setLoading(false) }
  }
  return (
    <div className="min-h-screen flex flex-col">
      <header className="sticky top-0 z-40 glass border-b border-border/60">
        <div className="mx-auto max-w-6xl px-4 sm:px-6 h-16 flex items-center justify-between">
          <div className="flex items-center gap-2"><Button variant="ghost" size="sm" className="gap-1.5" onClick={onDemoMode}><ArrowLeft className="h-3.5 w-3.5" /> Back</Button><Logo /></div>
          <ThemeToggle />
        </div>
      </header>
      <main className="flex-1 grid lg:grid-cols-2 gap-8 items-center px-4 sm:px-6 py-12 max-w-6xl mx-auto w-full">
        <motion.div initial={{ opacity: 0, x: -20 }} animate={{ opacity: 1, x: 0 }} transition={{ duration: 0.4 }} className="space-y-6">
          <div><h1 className="text-4xl sm:text-5xl font-bold tracking-tight leading-tight">Welcome to <span className="text-primary">MemoraX</span></h1><p className="mt-3 text-lg text-muted-foreground">The AI study companion that remembers how your child learns.</p></div>
          <div className="grid sm:grid-cols-3 gap-4">
            <Feature icon={GraduationCap} title="Students" desc="AI tutor, homework help, gamified learning" />
            <Feature icon={Users} title="Parents" desc="Homework digests, progress insights" />
            <Feature icon={Shield} title="Teachers" desc="Class management, at-risk flags" />
          </div>
          <div className="rounded-lg bg-[var(--mx-emerald-soft)]/40 border border-border/60 p-4"><p className="text-sm font-medium">📋 Demo access</p><p className="text-xs text-muted-foreground mt-1">Use demo mode to explore without an account.</p><Button variant="outline" size="sm" className="mt-3" onClick={onDemoMode}>Try demo mode →</Button></div>
        </motion.div>
        <motion.div initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} transition={{ duration: 0.4, delay: 0.1 }}>
          <Card className="p-6 sm:p-8 shadow-lg">
            <h2 className="text-2xl font-bold mb-1">Sign in</h2>
            <p className="text-sm text-muted-foreground mb-6">Enter your credentials.</p>
            <form onSubmit={handleLogin} className="space-y-4">
              <div className="space-y-1.5"><Label htmlFor="email">Email</Label><div className="relative"><Mail className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" /><Input id="email" type="email" value={email} onChange={(e) => setEmail(e.target.value)} placeholder="you@example.com" className="pl-9" disabled={loading} /></div></div>
              <div className="space-y-1.5"><Label htmlFor="password">Password</Label><div className="relative"><Lock className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" /><Input id="password" type={showPassword ? 'text' : 'password'} value={password} onChange={(e) => setPassword(e.target.value)} placeholder="••••••••" className="pl-9 pr-9" disabled={loading} /><button type="button" onClick={() => setShowPassword(s => !s)} className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground" tabIndex={-1}>{showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}</button></div></div>
              <Button type="submit" className="w-full gap-2 h-11" disabled={loading}>{loading ? <Loader2 className="h-4 w-4 animate-spin" /> : <LogIn className="h-4 w-4" />}{loading ? 'Signing in…' : 'Sign in'}</Button>
            </form>
            <div className="mt-6 rounded-lg bg-muted/40 p-3 text-xs text-muted-foreground"><p className="font-medium text-foreground">🔧 Admin access</p><p className="mt-0.5">Default admin: <code className="bg-muted px-1 rounded">admin@memorax.app</code> / <code className="bg-muted px-1 rounded">admin123</code></p></div>
          </Card>
        </motion.div>
      </main>
    </div>
  )
}
function Feature({ icon: Icon, title, desc }: { icon: React.ElementType; title: string; desc: string }) {
  return <div className="rounded-xl border border-border/60 p-4"><div className="h-8 w-8 rounded-lg bg-primary/10 text-primary grid place-items-center mb-2"><Icon className="h-4 w-4" /></div><p className="font-medium text-sm">{title}</p><p className="text-xs text-muted-foreground mt-0.5">{desc}</p></div>
}
