'use client'

import * as React from 'react'
import { signOut } from 'next-auth/react'
import {
  ArrowLeft,
  LogOut,
  Loader2,
  Users,
  GraduationCap,
  HeartHandshake,
  ShieldCheck,
  BookOpen,
  ClipboardList,
  Brain,
  MessageSquareText,
  BellRing,
  UsersRound,
  Activity as ActivityIcon,
  RotateCcw,
  Search,
} from 'lucide-react'
import { Logo } from '@/components/brand/logo'
import { ThemeToggle } from '@/components/brand/theme-toggle'
import { Button } from '@/components/ui/button'
import { Card } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { Badge } from '@/components/ui/badge'
import { Tabs, TabsList, TabsTrigger } from '@/components/ui/tabs'
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table'
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from '@/components/ui/alert-dialog'
import { UserFormDialog, DeleteUserDialog } from '@/components/admin/user-form-dialog'
import { useSession } from '@/lib/session'
import { toast } from 'sonner'
import type { Role, SafeUser } from '@/lib/types'

interface Stats {
  users: number
  students: number
  parents: number
  teachers: number
  admins: number
  courses: number
  assignments: number
  submissions: number
  memories: number
  chats: number
  reminders: number
  families: number
  activeStudents: number
}

interface ActivityItem {
  id: string
  kind: 'chat' | 'memory' | 'reminder'
  createdAt: string
  text: string
  actorName: string
  actorAvatar: string | null
  meta?: Record<string, unknown>
}

const ROLE_FILTERS: { id: 'ALL' | Role; label: string }[] = [
  { id: 'ALL', label: 'All' },
  { id: 'STUDENT', label: 'Students' },
  { id: 'PARENT', label: 'Parents' },
  { id: 'TEACHER', label: 'Teachers' },
  { id: 'ADMIN', label: 'Admins' },
]

export function AdminApp() {
  const { user, setView, setUser } = useSession()
  const [stats, setStats] = React.useState<Stats | null>(null)
  const [users, setUsers] = React.useState<SafeUser[]>([])
  const [activity, setActivity] = React.useState<ActivityItem[]>([])
  const [loading, setLoading] = React.useState(true)
  const [roleFilter, setRoleFilter] = React.useState<'ALL' | Role>('ALL')
  const [search, setSearch] = React.useState('')
  const [resetting, setResetting] = React.useState(false)
  const [refreshKey, setRefreshKey] = React.useState(0)

  const refresh = React.useCallback(() => setRefreshKey((k) => k + 1), [])

  React.useEffect(() => {
    let mounted = true
    setLoading(true)
    Promise.all([
      fetch('/api/admin/stats').then((r) => r.json()),
      fetch('/api/admin/users').then((r) => r.json()),
      fetch('/api/admin/activity').then((r) => r.json()),
    ])
      .then(([s, u, a]) => {
        if (!mounted) return
        if (s && !s.error) setStats(s as Stats)
        if (u && Array.isArray(u.users)) setUsers(u.users as SafeUser[])
        if (a && Array.isArray(a.activity)) setActivity(a.activity as ActivityItem[])
      })
      .catch((e) => {
        toast.error(e?.message ?? 'Failed to load admin data')
      })
      .finally(() => {
        if (mounted) setLoading(false)
      })
    return () => {
      mounted = false
    }
  }, [refreshKey])

  const signOutAdmin = async () => {
    try {
      await signOut({ redirect: false })
    } catch {
      // ignore — local session cleanup still happens
    }
    setUser(null)
    setView('landing')
    toast('Signed out of admin')
  }

  const filteredUsers = React.useMemo(() => {
    let list = users
    if (roleFilter !== 'ALL') list = list.filter((u) => u.role === roleFilter)
    if (search.trim()) {
      const q = search.trim().toLowerCase()
      list = list.filter(
        (u) =>
          u.name.toLowerCase().includes(q) ||
          u.email.toLowerCase().includes(q)
      )
    }
    return list
  }, [users, roleFilter, search])

  const onResetDemo = async () => {
    if (resetting) return
    setResetting(true)
    try {
      const res = await fetch('/api/admin/reset', { method: 'POST' })
      const json = await res.json()
      if (!res.ok) {
        toast.error(json?.error ?? 'Reset failed')
        return
      }
      toast.success(`Demo data reset — ${json.users} users seeded`)
      refresh()
    } catch (e: any) {
      toast.error(e?.message ?? 'Reset failed')
    } finally {
      setResetting(false)
    }
  }

  return (
    <div className="min-h-screen flex flex-col">
      {/* Header */}
      <header className="sticky top-0 z-40 glass border-b border-border/60">
        <div className="mx-auto max-w-7xl px-3 sm:px-6 h-14 flex items-center justify-between gap-2">
          <div className="flex items-center gap-2 min-w-0">
            <button
              onClick={() => setView('landing')}
              className="md:hidden grid place-items-center h-8 w-8 rounded-lg hover:bg-muted focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
              aria-label="Back to landing"
            >
              <ArrowLeft className="h-4 w-4" />
            </button>
            <button
              onClick={() => setView('landing')}
              className="hidden md:flex items-center gap-2 rounded-md focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
              aria-label="Back to landing"
            >
              <Logo size="sm" />
            </button>
            <div className="hidden sm:block h-5 w-px bg-border mx-1" />
            <div className="min-w-0">
              <p className="text-sm font-semibold truncate flex items-center gap-1.5">
                <ShieldCheck className="h-3.5 w-3.5 text-primary" />
                MemoraX Admin
              </p>
              <p className="text-[11px] text-muted-foreground truncate">
                {user?.avatar} {user?.name} · admin
              </p>
            </div>
          </div>
          <div className="flex items-center gap-1.5">
            <Button
              variant="ghost"
              size="sm"
              className="gap-1.5 hidden sm:flex"
              onClick={() => setView('landing')}
            >
              <ArrowLeft className="h-3.5 w-3.5" /> Back to landing
            </Button>
            <Button
              variant="ghost"
              size="sm"
              className="gap-1.5"
              onClick={signOutAdmin}
            >
              <LogOut className="h-3.5 w-3.5" /> Sign out
            </Button>
            <ThemeToggle />
          </div>
        </div>
      </header>

      <main className="flex-1 mx-auto w-full max-w-7xl px-3 sm:px-6 py-5 space-y-6">
        {/* Stats grid */}
        <section>
          <div className="flex items-end justify-between mb-3 gap-3">
            <div>
              <h2 className="text-lg font-semibold tracking-tight">Platform overview</h2>
              <p className="text-xs text-muted-foreground">
                Live counts from the MemoraX database.
              </p>
            </div>
            <Button
              variant="ghost"
              size="sm"
              className="gap-1.5"
              onClick={refresh}
              disabled={loading}
            >
              {loading ? (
                <Loader2 className="h-3.5 w-3.5 animate-spin" />
              ) : (
                <ActivityIcon className="h-3.5 w-3.5" />
              )}
              Refresh
            </Button>
          </div>

          {loading && !stats ? (
            <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-3">
              {Array.from({ length: 11 }).map((_, i) => (
                <Card key={i} className="p-4 h-[88px]">
                  <div className="h-3 w-12 bg-muted rounded mb-3 animate-pulse" />
                  <div className="h-6 w-16 bg-muted/70 rounded animate-pulse" />
                </Card>
              ))}
            </div>
          ) : (
            <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-3">
              <StatCard icon={<Users className="h-4 w-4" />} label="Total users" value={stats?.users ?? 0} />
              <StatCard icon={<GraduationCap className="h-4 w-4" />} label="Students" value={stats?.students ?? 0} />
              <StatCard icon={<HeartHandshake className="h-4 w-4" />} label="Parents" value={stats?.parents ?? 0} />
              <StatCard icon={<ShieldCheck className="h-4 w-4" />} label="Teachers" value={stats?.teachers ?? 0} />
              <StatCard icon={<BookOpen className="h-4 w-4" />} label="Courses" value={stats?.courses ?? 0} />
              <StatCard icon={<ClipboardList className="h-4 w-4" />} label="Assignments" value={stats?.assignments ?? 0} />
              <StatCard icon={<Brain className="h-4 w-4" />} label="Memories" value={stats?.memories ?? 0} />
              <StatCard icon={<MessageSquareText className="h-4 w-4" />} label="Chats" value={stats?.chats ?? 0} />
              <StatCard icon={<BellRing className="h-4 w-4" />} label="Reminders" value={stats?.reminders ?? 0} />
              <StatCard icon={<UsersRound className="h-4 w-4" />} label="Families" value={stats?.families ?? 0} />
              <StatCard
                icon={<ShieldCheck className="h-4 w-4" />}
                label="Admins"
                value={stats?.admins ?? 0}
              />
              <StatCard
                icon={<ActivityIcon className="h-4 w-4" />}
                label="Active students (7d)"
                value={stats?.activeStudents ?? 0}
                accent
              />
            </div>
          )}
        </section>

        {/* User management */}
        <section>
          <Card className="overflow-hidden">
            <div className="p-4 sm:p-5 border-b border-border/60 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
              <div>
                <h2 className="text-lg font-semibold tracking-tight">User management</h2>
                <p className="text-xs text-muted-foreground">
                  Create, edit, or delete users. {users.length} total.
                </p>
              </div>
              <div className="flex flex-col sm:flex-row gap-2 sm:items-center">
                <div className="relative">
                  <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-muted-foreground pointer-events-none" />
                  <Input
                    placeholder="Search name or email…"
                    value={search}
                    onChange={(e) => setSearch(e.target.value)}
                    className="pl-8 h-9 w-full sm:w-56"
                  />
                </div>
                <UserFormDialog onSaved={refresh} />
              </div>
            </div>

            <div className="px-4 sm:px-5 pt-3">
              <Tabs
                value={roleFilter}
                onValueChange={(v) => setRoleFilter(v as 'ALL' | Role)}
              >
                <TabsList className="h-9">
                  {ROLE_FILTERS.map((r) => (
                    <TabsTrigger key={r.id} value={r.id} className="text-xs">
                      {r.label}
                    </TabsTrigger>
                  ))}
                </TabsList>
              </Tabs>
            </div>

            <div className="p-2 sm:p-3">
              {loading && users.length === 0 ? (
                <div className="p-6 space-y-2">
                  {Array.from({ length: 4 }).map((_, i) => (
                    <div
                      key={i}
                      className="h-10 rounded-md bg-muted/60 animate-pulse"
                    />
                  ))}
                </div>
              ) : filteredUsers.length === 0 ? (
                <div className="p-10 text-center">
                  <div className="mx-auto h-10 w-10 rounded-xl grid place-items-center bg-muted text-muted-foreground mb-3">
                    <Users className="h-5 w-5" />
                  </div>
                  <p className="text-sm font-medium">No users found</p>
                  <p className="text-xs text-muted-foreground mt-1">
                    Try a different role filter or search term.
                  </p>
                </div>
              ) : (
                <div className="overflow-x-auto">
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>User</TableHead>
                        <TableHead className="hidden sm:table-cell">Email</TableHead>
                        <TableHead>Role</TableHead>
                        <TableHead className="hidden md:table-cell">Grade</TableHead>
                        <TableHead className="text-right">Actions</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {filteredUsers.map((u) => (
                        <TableRow key={u.id}>
                          <TableCell>
                            <div className="flex items-center gap-2.5 min-w-0">
                              <div className="h-8 w-8 rounded-full bg-[var(--mx-emerald-soft)] grid place-items-center text-base shrink-0">
                                {u.avatar ?? u.name[0]}
                              </div>
                              <div className="min-w-0">
                                <p className="text-sm font-medium truncate">{u.name}</p>
                                <p className="text-[11px] text-muted-foreground truncate sm:hidden">
                                  {u.email}
                                </p>
                              </div>
                            </div>
                          </TableCell>
                          <TableCell className="hidden sm:table-cell text-sm text-muted-foreground">
                            {u.email}
                          </TableCell>
                          <TableCell>
                            <RoleBadge role={u.role} />
                          </TableCell>
                          <TableCell className="hidden md:table-cell text-sm text-muted-foreground">
                            {u.grade ?? '—'}
                          </TableCell>
                          <TableCell className="text-right">
                            <div className="inline-flex gap-1.5">
                              <UserFormDialog
                                user={u}
                                onSaved={refresh}
                                trigger={
                                  <Button
                                    size="sm"
                                    variant="outline"
                                    className="gap-1.5 h-8"
                                  >
                                    Edit
                                  </Button>
                                }
                              />
                              <DeleteUserDialog user={u} onDeleted={refresh} />
                            </div>
                          </TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                </div>
              )}
            </div>
          </Card>
        </section>

        {/* Activity feed + Danger zone */}
        <section className="grid lg:grid-cols-3 gap-4">
          <Card className="p-4 sm:p-5 lg:col-span-2">
            <div className="flex items-center justify-between mb-3">
              <div>
                <h2 className="text-lg font-semibold tracking-tight">Recent activity</h2>
                <p className="text-xs text-muted-foreground">
                  Latest chats, memories, and reminders across all users.
                </p>
              </div>
              <Badge variant="outline" className="text-[11px]">
                {activity.length} events
              </Badge>
            </div>
            {loading && activity.length === 0 ? (
              <div className="space-y-2">
                {Array.from({ length: 5 }).map((_, i) => (
                  <div
                    key={i}
                    className="h-12 rounded-md bg-muted/60 animate-pulse"
                  />
                ))}
              </div>
            ) : activity.length === 0 ? (
              <div className="p-8 text-center text-sm text-muted-foreground">
                No recent activity yet.
              </div>
            ) : (
              <div className="max-h-96 overflow-y-auto scroll-thin space-y-2 pr-1">
                {activity.slice(0, 60).map((a) => (
                  <ActivityRow key={a.id} item={a} />
                ))}
              </div>
            )}
          </Card>

          <Card className="p-4 sm:p-5 border-[var(--mx-clay)]/30">
            <div className="flex items-center gap-2 mb-1">
              <div className="h-7 w-7 rounded-lg grid place-items-center bg-[var(--mx-clay)]/10 text-[var(--mx-clay)]">
                <RotateCcw className="h-3.5 w-3.5" />
              </div>
              <h2 className="text-base font-semibold tracking-tight">Danger zone</h2>
            </div>
            <p className="text-xs text-muted-foreground mb-4">
              Reset the entire demo dataset. Wipes every user, course, chat, and
              memory, then re-seeds the original demo cast (Ms. Patel, the Garcias,
              and an admin).
            </p>
            <AlertDialog>
              <AlertDialogTrigger asChild>
                <Button
                  variant="outline"
                  className="w-full gap-1.5 text-[var(--mx-clay)] border-[var(--mx-clay)]/40 hover:bg-[var(--mx-clay)]/10"
                  disabled={resetting}
                >
                  {resetting ? (
                    <Loader2 className="h-4 w-4 animate-spin" />
                  ) : (
                    <RotateCcw className="h-4 w-4" />
                  )}
                  Reset demo data
                </Button>
              </AlertDialogTrigger>
              <AlertDialogContent>
                <AlertDialogHeader>
                  <AlertDialogTitle>Reset all demo data?</AlertDialogTitle>
                  <AlertDialogDescription>
                    This will wipe the entire database and re-seed the original
                    demo cast. Any new users or changes you made will be lost.
                    This cannot be undone.
                  </AlertDialogDescription>
                </AlertDialogHeader>
                <AlertDialogFooter>
                  <AlertDialogCancel>Cancel</AlertDialogCancel>
                  <AlertDialogAction
                    onClick={onResetDemo}
                    className="bg-[var(--mx-clay)] text-white hover:bg-[var(--mx-clay)]/90"
                  >
                    Yes, reset everything
                  </AlertDialogAction>
                </AlertDialogFooter>
              </AlertDialogContent>
            </AlertDialog>
          </Card>
        </section>
      </main>

      <footer className="mt-auto border-t border-border/60 bg-[var(--mx-cream)]">
        <div className="mx-auto max-w-7xl px-3 sm:px-6 py-4 flex flex-col sm:flex-row items-center justify-between gap-2 text-xs text-muted-foreground">
          <p>MemoraX Admin · manage users &amp; demo data</p>
          <p>Signed in as {user?.email}</p>
        </div>
      </footer>
    </div>
  )
}

// ---------- sub components ----------

function StatCard({
  icon,
  label,
  value,
  accent,
}: {
  icon: React.ReactNode
  label: string
  value: number
  accent?: boolean
}) {
  return (
    <Card
      className={`p-4 flex flex-col gap-1.5 ${
        accent ? 'ring-1 ring-[var(--mx-warm)]/40 bg-[var(--mx-warm-soft)]/40' : ''
      }`}
    >
      <div className="flex items-center gap-1.5 text-muted-foreground">
        <span className={accent ? 'text-[var(--mx-warm)]' : 'text-primary'}>
          {icon}
        </span>
        <span className="text-[11px] font-medium uppercase tracking-wide">
          {label}
        </span>
      </div>
      <p className="text-2xl font-bold tabular-nums">{value.toLocaleString()}</p>
    </Card>
  )
}

function RoleBadge({ role }: { role: Role }) {
  const styles: Record<Role, string> = {
    STUDENT: 'bg-primary/10 text-primary border-primary/20',
    PARENT: 'bg-[var(--mx-warm-soft)] text-[var(--mx-warm)] border-[var(--mx-warm)]/30',
    TEACHER: 'bg-[var(--mx-emerald-soft)] text-[var(--mx-emerald)] border-[var(--mx-emerald)]/30',
    ADMIN: 'bg-[var(--mx-clay)]/10 text-[var(--mx-clay)] border-[var(--mx-clay)]/30',
  }
  return (
    <Badge variant="outline" className={`text-[10px] py-0.5 px-1.5 ${styles[role]}`}>
      {role}
    </Badge>
  )
}

function ActivityRow({ item }: { item: ActivityItem }) {
  const kindMeta: Record<
    ActivityItem['kind'],
    { label: string; icon: React.ReactNode; tint: string }
  > = {
    chat: {
      label: 'Chat',
      icon: <MessageSquareText className="h-3 w-3" />,
      tint: 'text-primary bg-primary/10',
    },
    memory: {
      label: 'Memory',
      icon: <Brain className="h-3 w-3" />,
      tint: 'text-[var(--mx-emerald)] bg-[var(--mx-emerald-soft)]',
    },
    reminder: {
      label: 'Reminder',
      icon: <BellRing className="h-3 w-3" />,
      tint: 'text-[var(--mx-warm)] bg-[var(--mx-warm-soft)]',
    },
  }
  const meta = kindMeta[item.kind]
  const time = new Date(item.createdAt)
  return (
    <div className="flex gap-3 rounded-lg border border-border/50 bg-card/60 px-3 py-2.5">
      <div className="h-7 w-7 rounded-full bg-[var(--mx-emerald-soft)] grid place-items-center text-sm shrink-0">
        {item.actorAvatar ?? item.actorName[0]}
      </div>
      <div className="min-w-0 flex-1">
        <div className="flex items-center gap-2 flex-wrap">
          <span className="text-xs font-medium truncate">{item.actorName}</span>
          <span
            className={`inline-flex items-center gap-1 rounded-full px-1.5 py-0.5 text-[10px] font-medium ${meta.tint}`}
          >
            {meta.icon}
            {meta.label}
          </span>
          <span className="text-[10px] text-muted-foreground ml-auto shrink-0">
            {time.toLocaleString()}
          </span>
        </div>
        <p className="text-xs text-muted-foreground mt-1 line-clamp-2 break-words">
          {item.text}
        </p>
      </div>
    </div>
  )
}
