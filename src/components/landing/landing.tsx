'use client'

import * as React from 'react'
import Link from 'next/link'
import {
  Brain,
  GraduationCap,
  HeartHandshake,
  MessageSquareText,
  Camera,
  CalendarClock,
  Users,
  ArrowRight,
  Sparkles,
  ShieldCheck,
  Lightbulb,
} from 'lucide-react'
import { motion } from 'framer-motion'
import { Logo } from '@/components/brand/logo'
import { ThemeToggle } from '@/components/brand/theme-toggle'
import { Button } from '@/components/ui/button'
import { Card } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Pricing } from '@/components/landing/pricing'
import { useSession } from '@/lib/session'
import { api } from '@/lib/api-client'
import type { SafeUser } from '@/lib/types'
import { toast } from 'sonner'

export function Landing() {
  const { setView, setUser, setActiveStudentId } = useSession()
  const [users, setUsers] = React.useState<SafeUser[]>([])
  const [loading, setLoading] = React.useState<Record<string, boolean>>({})

  React.useEffect(() => {
    api.listUsers().then((r) => setUsers(r.users))
  }, [])

  const enterAs = async (u: SafeUser, asStudentId?: string) => {
    setLoading((s) => ({ ...s, [u.id]: true }))
    try {
      setUser(u)
      if (asStudentId) setActiveStudentId(asStudentId)
      // small delay for UX
      await new Promise((r) => setTimeout(r, 150))
      if (u.role === 'STUDENT') setView('student')
      else if (u.role === 'PARENT') setView('parent')
      else if (u.role === 'TEACHER') setView('teacher')
    } catch {
      toast.error('Could not sign in. Try again.')
    } finally {
      setLoading((s) => ({ ...s, [u.id]: false }))
    }
  }

  const students = users.filter((u) => u.role === 'STUDENT')
  const parents = users.filter((u) => u.role === 'PARENT')
  const teachers = users.filter((u) => u.role === 'TEACHER')

  return (
    <div className="min-h-screen flex flex-col">
      {/* Nav */}
      <header className="sticky top-0 z-40 glass border-b border-border/60">
        <div className="mx-auto max-w-6xl px-4 sm:px-6 h-16 flex items-center justify-between">
          <Logo />
          <nav className="hidden md:flex items-center gap-7 text-sm text-muted-foreground">
            <a href="#how" className="hover:text-foreground transition-colors">How it works</a>
            <a href="#roles" className="hover:text-foreground transition-colors">For families</a>
            <a href="#pricing" className="hover:text-foreground transition-colors">Pricing</a>
            <a href="#trust" className="hover:text-foreground transition-colors">Why MemoraX</a>
          </nav>
          <div className="flex items-center gap-2">
            <ThemeToggle />
            <Button size="sm" onClick={() => document.getElementById('roles')?.scrollIntoView({ behavior: 'smooth' })}>
              Get started
            </Button>
          </div>
        </div>
      </header>

      {/* Hero */}
      <section className="relative overflow-hidden">
        <div className="absolute inset-0 -z-10">
          <div className="absolute -top-32 left-1/2 -translate-x-1/2 h-[480px] w-[820px] rounded-full bg-[var(--mx-emerald-soft)] blur-3xl opacity-60" />
          <div className="absolute top-20 right-0 h-[320px] w-[320px] rounded-full bg-[var(--mx-warm-soft)] blur-3xl opacity-50" />
        </div>
        <div className="mx-auto max-w-6xl px-4 sm:px-6 pt-16 pb-12 sm:pt-24 sm:pb-20">
          <motion.div
            initial={{ opacity: 0, y: 12 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5 }}
            className="max-w-3xl"
          >
            <Badge variant="secondary" className="mb-5 gap-1.5 py-1.5 pl-2 pr-3">
              <Sparkles className="h-3.5 w-3.5 text-primary" />
              <span className="text-xs">A memory layer built for school — inspired by memorae.ai</span>
            </Badge>
            <h1 className="text-4xl sm:text-6xl font-bold tracking-tight leading-[1.05]">
              The AI study companion
              <br />
              that <span className="text-primary">remembers</span> how your
              <br className="hidden sm:block" /> child learns.
            </h1>
            <p className="mt-6 text-lg text-muted-foreground max-w-2xl leading-relaxed">
              MemoraX lives where students already are — a chat assistant that syncs with Google
              Classroom, guides homework step-by-step (Socratic, never just answers), and keeps
              parents and teachers in the loop.
            </p>
            <div className="mt-8 flex flex-wrap items-center gap-3">
              <Button size="lg" className="gap-2 h-12 px-6" onClick={() => document.getElementById('roles')?.scrollIntoView({ behavior: 'smooth' })}>
                Try the demo <ArrowRight className="h-4 w-4" />
              </Button>
              <Button size="lg" variant="outline" className="h-12 px-6" asChild>
                <a href="#how">See how it works</a>
              </Button>
            </div>
            <div className="mt-8 flex flex-wrap items-center gap-x-6 gap-y-2 text-sm text-muted-foreground">
              <span className="flex items-center gap-1.5"><ShieldCheck className="h-4 w-4 text-primary" /> Privacy-first</span>
              <span className="flex items-center gap-1.5"><GraduationCap className="h-4 w-4 text-primary" /> Socratic tutor</span>
              <span className="flex items-center gap-1.5"><CalendarClock className="h-4 w-4 text-primary" /> Google Classroom sync</span>
            </div>
          </motion.div>

          {/* Chat preview mock */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, delay: 0.15 }}
            className="mt-14 mx-auto max-w-2xl"
          >
            <Card className="overflow-hidden shadow-xl border-border/60">
              <div className="flex items-center gap-2 px-4 py-3 border-b bg-[var(--mx-emerald-soft)]/50">
                <div className="h-8 w-8 rounded-full bg-primary grid place-items-center text-primary-foreground text-sm font-semibold">
                  M
                </div>
                <div className="flex-1">
                  <p className="text-sm font-medium">MemoraX Tutor</p>
                  <p className="text-[11px] text-muted-foreground">online · remembers your last session</p>
                </div>
                <Badge variant="outline" className="gap-1 text-[11px] py-0.5">
                  <Lightbulb className="h-3 w-3" /> Socratic mode
                </Badge>
              </div>
              <div className="chat-bg p-4 space-y-3 min-h-[220px]">
                <Bubble side="them">
                  Welcome back, Mia! 👋 Last week you nailed anaphase. What are we working on today?
                </Bubble>
                <Bubble side="me">im stuck on quadratic equations problem set 4</Bubble>
                <Bubble side="them">
                  Quadratics — let&apos;s go. Before solving, look at problem 1. Is it in the form{' '}
                  <code className="bg-[var(--mx-warm-soft)] px-1 rounded">ax² + bx + c = 0</code>? What
                  do you notice about the discriminant?
                </Bubble>
                <div className="flex items-center gap-2 pl-1">
                  <div className="h-2 w-2 rounded-full bg-muted-foreground/60 typing-dot" />
                  <div className="h-2 w-2 rounded-full bg-muted-foreground/60 typing-dot" />
                  <div className="h-2 w-2 rounded-full bg-muted-foreground/60 typing-dot" />
                </div>
              </div>
            </Card>
          </motion.div>
        </div>
      </section>

      {/* How it works */}
      <section id="how" className="mx-auto max-w-6xl px-4 sm:px-6 py-16 w-full">
        <div className="text-center max-w-2xl mx-auto mb-12">
          <h2 className="text-3xl sm:text-4xl font-bold tracking-tight">One memory. Three ways to use it.</h2>
          <p className="mt-3 text-muted-foreground">
            Every homework session, every concept a student struggled with, becomes memory the tutor
            draws on later — and that parents and teachers can see.
          </p>
        </div>
        <div className="grid md:grid-cols-3 gap-5">
          <FeatureCard
            icon={<GraduationCap className="h-5 w-5" />}
            title="For students"
            color="emerald"
            points={[
              'Snap a photo of homework → the tutor reads the problem and guides you.',
              'Socratic by default — it asks questions so you actually learn.',
              'Stuck? Flip on “Show me the solution” for a worked answer.',
              'Remembers every concept you’ve mastered or struggled with.',
            ]}
          />
          <FeatureCard
            icon={<HeartHandshake className="h-5 w-5" />}
            title="For parents"
            color="amber"
            points={[
              'A 7 PM digest lands in your inbox: what’s due, what’s overdue.',
              'Morning-of reminders on due dates. Overdue alerts too.',
              'Two parents can follow the same child — both stay in sync.',
              'See progress and weak spots, not just grades.',
            ]}
          />
          <FeatureCard
            icon={<Users className="h-5 w-5" />}
            title="For teachers"
            color="teal"
            points={[
              'Post classes and assignments; they sync to every student.',
              'See who’s started, stuck, or soaring — at a glance.',
              'Message a student through the assistant with a nudge or kudos.',
              'The tutor shares where each student needs more practice.',
            ]}
          />
        </div>
      </section>

      {/* Feature strip */}
      <section className="bg-[var(--mx-emerald-soft)]/40 border-y border-border/60">
        <div className="mx-auto max-w-6xl px-4 sm:px-6 py-14 grid sm:grid-cols-2 lg:grid-cols-4 gap-6">
          <MiniFeature icon={<Camera />} title="Homework photo help" desc="Upload a picture; the Vision tutor reads the problem and guides you." />
          <MiniFeature icon={<CalendarClock />} title="Google Classroom sync" desc="Assignments flow in automatically. Real OAuth-ready." />
          <MiniFeature icon={<MessageSquareText />} title="Lives in chat" desc="A WhatsApp-style assistant — calm, quiet, always there." />
          <MiniFeature icon={<Brain />} title="Persistent memory" desc="Knows what you struggled with last week. Connects the dots." />
        </div>
      </section>

      {/* Role selection */}
      <section id="roles" className="mx-auto max-w-6xl px-4 sm:px-6 py-16 w-full">
        <div className="text-center max-w-2xl mx-auto mb-10">
          <Badge variant="secondary" className="mb-3">Live demo</Badge>
          <h2 className="text-3xl sm:text-4xl font-bold tracking-tight">Jump in as anyone</h2>
          <p className="mt-3 text-muted-foreground">
            This is a fully-seeded demo. Pick a role and explore — no signup needed.
          </p>
        </div>

        <div className="grid lg:grid-cols-3 gap-5">
          {/* Students */}
          <RoleCard
            title="Students"
            icon={<GraduationCap className="h-5 w-5" />}
            accent="emerald"
            description="Chat with your AI tutor, upload homework, see your assignments."
          >
            <div className="space-y-2">
              {students.length === 0 && (
                <p className="text-sm text-muted-foreground">Loading students…</p>
              )}
              {students.map((s) => (
                <DemoButton
                  key={s.id}
                  user={s}
                  subtitle={s.grade ?? 'Student'}
                  loading={!!loading[s.id]}
                  onClick={() => enterAs(s)}
                />
              ))}
            </div>
          </RoleCard>

          {/* Parents */}
          <RoleCard
            title="Parents"
            icon={<HeartHandshake className="h-5 w-5" />}
            accent="amber"
            description="See homework digests, due-date reminders, and progress for your kids."
          >
            <div className="space-y-2">
              {parents.length === 0 && (
                <p className="text-sm text-muted-foreground">Loading parents…</p>
              )}
              {parents.map((p) => (
                <DemoButton
                  key={p.id}
                  user={p}
                  subtitle="Parent · 2 kids"
                  loading={!!loading[p.id]}
                  onClick={() => enterAs(p)}
                />
              ))}
              {parents.length > 0 && students.length > 0 && (
                <p className="text-xs text-muted-foreground pt-2 leading-relaxed">
                  Both {parents[0]?.name.split(' ')[0]} and {parents[1]?.name.split(' ')[0]} follow{' '}
                  {students.map((s) => s.name.split(' ')[0]).join(' & ')} — the family bundle in action.
                </p>
              )}
            </div>
          </RoleCard>

          {/* Teachers */}
          <RoleCard
            title="Teachers"
            icon={<Users className="h-5 w-5" />}
            accent="teal"
            description="Create classes, post assignments, track progress, message students."
          >
            <div className="space-y-2">
              {teachers.length === 0 && (
                <p className="text-sm text-muted-foreground">Loading teachers…</p>
              )}
              {teachers.map((t) => (
                <DemoButton
                  key={t.id}
                  user={t}
                  subtitle="Teacher · 5 classes"
                  loading={!!loading[t.id]}
                  onClick={() => enterAs(t)}
                />
              ))}
            </div>
          </RoleCard>
        </div>
      </section>

      {/* Pricing */}
      <Pricing />

      {/* Trust */}
      <section id="trust" className="mx-auto max-w-6xl px-4 sm:px-6 py-16 w-full">
        <Card className="overflow-hidden border-border/60">
          <div className="grid md:grid-cols-2">
            <div className="p-8 sm:p-10">
              <h3 className="text-2xl font-bold tracking-tight">Why families choose MemoraX</h3>
              <p className="mt-3 text-muted-foreground leading-relaxed">
                We took the calm, memory-first philosophy of memorae.ai and re-engineered it for the
                realities of school life — homework, due dates, exams, and the chaos of family
                schedules.
              </p>
              <ul className="mt-6 space-y-3 text-sm">
                <li className="flex gap-3"><ShieldCheck className="h-5 w-5 text-primary shrink-0" /><span><b>Privacy-first.</b> Student data never leaves the family + classroom circle.</span></li>
                <li className="flex gap-3"><Lightbulb className="h-5 w-5 text-primary shrink-0" /><span><b>Real learning.</b> Socratic guidance means students build understanding, not dependency.</span></li>
                <li className="flex gap-3"><Brain className="h-5 w-5 text-primary shrink-0" /><span><b>Compounded memory.</b> The tutor gets smarter about each student every session.</span></li>
              </ul>
            </div>
            <div className="bg-[var(--mx-emerald-soft)]/60 p-8 sm:p-10 flex items-center justify-center">
              <div className="grid grid-cols-2 gap-4 w-full max-w-xs">
                <Stat value="3" label="Roles: student, parent, teacher" />
                <Stat value="7PM" label="Daily parent digest" />
                <Stat value="2" label="Parents per family bundle" />
                <Stat value="∞" label="Memory that compounds" />
              </div>
            </div>
          </div>
        </Card>
      </section>

      {/* Footer (sticky) */}
      <footer className="mt-auto border-t border-border/60 bg-[var(--mx-cream)]">
        <div className="mx-auto max-w-6xl px-4 sm:px-6 py-8 flex flex-col sm:flex-row items-center justify-between gap-4">
          <Logo size="sm" />
          <p className="text-sm text-muted-foreground text-center sm:text-right">
            MemoraX — a memorae-inspired study companion. Demo build for exploration.
          </p>
          <Button
            variant="ghost"
            size="sm"
            className="gap-1.5"
            onClick={() => {
              useSession.getState().reset()
              window.location.reload()
            }}
          >
            Reset demo
          </Button>
        </div>
      </footer>
    </div>
  )
}

// ---------- sub components ----------

function Bubble({ side, children }: { side: 'me' | 'them'; children: React.ReactNode }) {
  const me = side === 'me'
  return (
    <div className={`flex ${me ? 'justify-end' : 'justify-start'}`}>
      <div
        className={`msg-in max-w-[80%] rounded-2xl px-3.5 py-2 text-sm leading-relaxed shadow-sm ${
          me
            ? 'bg-primary text-primary-foreground rounded-br-md'
            : 'bg-card text-card-foreground rounded-bl-md border border-border/50'
        }`}
      >
        {children}
      </div>
    </div>
  )
}

function FeatureCard({
  icon,
  title,
  points,
  color,
}: {
  icon: React.ReactNode
  title: string
  points: string[]
  color: 'emerald' | 'amber' | 'teal'
}) {
  const ring =
    color === 'emerald'
      ? 'ring-[var(--mx-emerald-soft)]'
      : color === 'amber'
      ? 'ring-[var(--mx-warm-soft)]'
      : 'ring-[var(--mx-emerald-soft)]'
  const iconBg =
    color === 'emerald'
      ? 'bg-primary text-primary-foreground'
      : color === 'amber'
      ? 'bg-[var(--mx-warm)] text-white'
      : 'bg-[var(--mx-emerald)] text-primary-foreground'
  return (
    <Card className={`p-6 ring-1 ${ring} hover:shadow-md transition-shadow h-full`}>
      <div className={`h-10 w-10 rounded-xl grid place-items-center ${iconBg} mb-4`}>{icon}</div>
      <h3 className="font-semibold text-lg">{title}</h3>
      <ul className="mt-3 space-y-2 text-sm text-muted-foreground">
        {points.map((p, i) => (
          <li key={i} className="flex gap-2">
            <span className="text-primary mt-0.5">•</span>
            <span>{p}</span>
          </li>
        ))}
      </ul>
    </Card>
  )
}

function MiniFeature({ icon, title, desc }: { icon: React.ReactNode; title: string; desc: string }) {
  return (
    <div className="flex gap-3">
      <div className="h-9 w-9 rounded-lg bg-primary/10 text-primary grid place-items-center shrink-0">
        {React.cloneElement(icon as any, { className: 'h-4.5 w-4.5' })}
      </div>
      <div>
        <p className="font-medium text-sm">{title}</p>
        <p className="text-sm text-muted-foreground mt-0.5 leading-relaxed">{desc}</p>
      </div>
    </div>
  )
}

function RoleCard({
  title,
  icon,
  accent,
  description,
  children,
}: {
  title: string
  icon: React.ReactNode
  accent: 'emerald' | 'amber' | 'teal'
  description: string
  children: React.ReactNode
}) {
  const accentBg =
    accent === 'emerald'
      ? 'bg-primary text-primary-foreground'
      : accent === 'amber'
      ? 'bg-[var(--mx-warm)] text-white'
      : 'bg-[var(--mx-emerald)] text-primary-foreground'
  return (
    <Card className="p-6 flex flex-col h-full">
      <div className="flex items-center gap-3 mb-2">
        <div className={`h-10 w-10 rounded-xl grid place-items-center ${accentBg}`}>{icon}</div>
        <h3 className="font-semibold text-xl">{title}</h3>
      </div>
      <p className="text-sm text-muted-foreground mb-4">{description}</p>
      <div className="mt-auto">{children}</div>
    </Card>
  )
}

function DemoButton({
  user,
  subtitle,
  loading,
  onClick,
}: {
  user: SafeUser
  subtitle: string
  loading: boolean
  onClick: () => void
}) {
  return (
    <button
      onClick={onClick}
      disabled={loading}
      className="group w-full flex items-center gap-3 rounded-lg border border-border/60 bg-card px-3 py-2.5 text-left hover:border-primary/40 hover:bg-[var(--mx-emerald-soft)]/40 transition-colors disabled:opacity-60"
    >
      <div className="h-9 w-9 rounded-full bg-[var(--mx-emerald-soft)] grid place-items-center text-lg shrink-0">
        {user.avatar ?? user.name[0]}
      </div>
      <div className="flex-1 min-w-0">
        <p className="text-sm font-medium truncate">{user.name}</p>
        <p className="text-xs text-muted-foreground truncate">{subtitle}</p>
      </div>
      {loading ? (
        <div className="h-4 w-4 rounded-full border-2 border-primary/30 border-t-primary animate-spin" />
      ) : (
        <ArrowRight className="h-4 w-4 text-muted-foreground group-hover:text-primary transition-colors" />
      )}
    </button>
  )
}

function Stat({ value, label }: { value: string; label: string }) {
  return (
    <div className="rounded-xl bg-card/70 backdrop-blur p-4 text-center border border-border/40">
      <p className="text-2xl font-bold text-primary">{value}</p>
      <p className="text-xs text-muted-foreground mt-1 leading-tight">{label}</p>
    </div>
  )
}
