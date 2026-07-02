'use client'
import * as React from 'react'
import { signOut } from 'next-auth/react'
import { LogOut, UserPlus, Users, Loader2, Search, Shield, Ban, CheckCircle2, Crown, ChevronDown, ChevronUp, MessageSquare, Camera, Brain, Star, Flame, Coins, TrendingUp, Trash2 } from 'lucide-react'
import { Logo } from '@/components/brand/logo'
import { ThemeToggle } from '@/components/brand/theme-toggle'
import { Button } from '@/components/ui/button'
import { Card } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Badge } from '@/components/ui/badge'
import { Avatar, AvatarFallback } from '@/components/ui/avatar'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from '@/components/ui/dialog'
import { toast } from 'sonner'
import { cn } from '@/lib/utils'

interface UserStats { id: string; email: string; name: string; role: string; avatar: string | null; grade: string | null; status: string; subscriptionTier: string; createdAt: string; gamification: { xp: number; level: number; coins: number; streakDays: number; totalChats: number; totalHomework: number; totalReviews: number; achievements: number; cosmetics: number; lastActive: string | null } | null; usage: { chatMessages: number; memories: number; homeworkScans: number; reviewCards: number; examPlans: number; courses: number } }
const TIER_LABELS: Record<string, string> = { FREE: 'Starter', SCHOLAR: 'Scholar', FAMILY: 'Family', EDUCATOR: 'Educator' }
const TIER_COLORS: Record<string, string> = { FREE: 'bg-muted text-muted-foreground', SCHOLAR: 'bg-primary/10 text-primary', FAMILY: 'bg-[var(--mx-warm)]/10 text-[var(--mx-warm)]', EDUCATOR: 'bg-[var(--mx-emerald)]/10 text-[var(--mx-emerald)]' }

export function AdminDashboard() {
  const [users, setUsers] = React.useState<UserStats[]>([])
  const [totals, setTotals] = React.useState<any>(null)
  const [loading, setLoading] = React.useState(true)
  const [showCreate, setShowCreate] = React.useState(false)
  const [search, setSearch] = React.useState('')
  const [expanded, setExpanded] = React.useState<string | null>(null)
  const load = React.useCallback(async () => { setLoading(true); try { const res = await fetch('/api/admin/user-stats'); if (!res.ok) throw new Error(); const data = await res.json(); setUsers(data.users); setTotals(data.totals) } catch { toast.error('Could not load') } finally { setLoading(false) } }, [])
  React.useEffect(() => { load() }, [load])
  const filtered = users.filter(u => u.name.toLowerCase().includes(search.toLowerCase()) || u.email.toLowerCase().includes(search.toLowerCase()))
  const updateUser = async (userId: string, updates: Record<string, any>) => { try { const res = await fetch(`/api/admin/users/${userId}`, { method: 'PATCH', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(updates) }); if (!res.ok) throw new Error(); toast.success('Updated'); load() } catch { toast.error('Failed') } }
  const deleteUser = async (userId: string) => { if (!confirm('Delete this user permanently?')) return; try { await fetch(`/api/admin/users/${userId}`, { method: 'DELETE' }); toast.success('Deleted'); load() } catch { toast.error('Failed') } }

  return (
    <div className="min-h-screen flex flex-col">
      <header className="sticky top-0 z-40 glass border-b border-border/60">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 h-16 flex items-center justify-between">
          <Logo />
          <div className="flex items-center gap-2"><Badge variant="secondary" className="gap-1"><Shield className="h-3 w-3" /> Admin</Badge><ThemeToggle /><Button variant="ghost" size="sm" className="gap-1.5" onClick={() => { try { localStorage.removeItem('memorax-session') } catch {} signOut({ callbackUrl: '/' }) }}><LogOut className="h-3.5 w-3.5" /> Sign out</Button></div>
        </div>
      </header>
      <main className="flex-1 mx-auto w-full max-w-7xl px-4 sm:px-6 py-8">
        <div className="flex items-center justify-between mb-6"><div><h1 className="text-2xl font-bold">User Management</h1><p className="text-sm text-muted-foreground">Create users, manage subscriptions, monitor usage.</p></div><Button className="gap-1.5" onClick={() => setShowCreate(true)}><UserPlus className="h-4 w-4" /> Create User</Button></div>
        {totals && (<div className="grid grid-cols-2 sm:grid-cols-4 lg:grid-cols-6 gap-3 mb-6"><StatCard label="Total Users" value={totals.users} icon={Users} /><StatCard label="Students" value={totals.students} icon={Star} tone="emerald" /><StatCard label="Active Today" value={totals.activeToday} icon={Flame} tone="clay" /><StatCard label="Total Chats" value={totals.totalChats} icon={MessageSquare} tone="amber" /><StatCard label="Homework Scans" value={totals.totalHomework} icon={Camera} tone="teal" /><StatCard label="Paid Tiers" value={(totals.byTier?.SCHOLAR || 0) + (totals.byTier?.FAMILY || 0) + (totals.byTier?.EDUCATOR || 0)} icon={Crown} tone="amber" /></div>)}
        {totals && (<div className="flex flex-wrap items-center gap-2 mb-6"><span className="text-xs font-medium text-muted-foreground">Tier distribution:</span>{Object.entries(totals.byTier || {}).map(([tier, count]: [string, any]) => <span key={tier} className={cn('text-xs font-medium px-2 py-0.5 rounded-full', TIER_COLORS[tier])}>{TIER_LABELS[tier]}: {count}</span>)}</div>)}
        <div className="relative mb-4"><Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" /><Input value={search} onChange={(e) => setSearch(e.target.value)} placeholder="Search by name or email…" className="pl-9" /></div>
        {loading ? <div className="space-y-2">{[...Array(5)].map((_, i) => <div key={i} className="h-16 rounded-xl bg-muted animate-pulse" />)}</div>
        : filtered.length === 0 ? <Card className="p-10 text-center"><Users className="h-10 w-10 mx-auto text-muted-foreground mb-3" /><p className="font-medium">No users found</p></Card>
        : <div className="space-y-2">{filtered.map(u => <UserRow key={u.id} user={u} expanded={expanded === u.id} onToggle={() => setExpanded(expanded === u.id ? null : u.id)} onToggleStatus={() => updateUser(u.id, { status: u.status === 'ACTIVE' ? 'SUSPENDED' : 'ACTIVE' })} onDelete={() => deleteUser(u.id)} onTierChange={(t) => updateUser(u.id, { subscriptionTier: t })} />)}</div>}
      </main>
      {showCreate && <CreateUserDialog onOpenChange={(o) => !o && setShowCreate(false)} onCreated={() => { setShowCreate(false); load() }} />}
    </div>
  )
}
function StatCard({ label, value, icon: Icon, tone }: { label: string; value: number; icon: React.ElementType; tone?: string }) {
  const tones: Record<string, string> = { emerald: 'text-primary', clay: 'text-[var(--mx-clay)]', amber: 'text-[var(--mx-warm)]', teal: 'text-[var(--mx-emerald)]' }
  return <Card className="p-4"><div className="flex items-center gap-2 mb-1"><Icon className={cn('h-4 w-4', tone ? tones[tone] : 'text-muted-foreground')} /><p className="text-xl font-bold leading-none">{value}</p></div><p className="text-[10px] text-muted-foreground">{label}</p></Card>
}
function UserRow({ user, expanded, onToggle, onToggleStatus, onDelete, onTierChange }: { user: UserStats; expanded: boolean; onToggle: () => void; onToggleStatus: () => void; onDelete: () => void; onTierChange: (t: string) => void }) {
  const g = user.gamification
  return <Card className="overflow-hidden"><div className="p-3 flex items-center gap-3">
    <Avatar className="h-9 w-9 shrink-0"><AvatarFallback className={cn('text-base', user.role === 'STUDENT' ? 'bg-[var(--mx-emerald-soft)]' : user.role === 'PARENT' ? 'bg-[var(--mx-warm-soft)]' : 'bg-muted')}>{user.avatar ?? user.name[0]}</AvatarFallback></Avatar>
    <div className="flex-1 min-w-0"><div className="flex items-center gap-2 flex-wrap"><p className="font-medium text-sm truncate">{user.name}</p><span className={cn('text-[10px] font-medium px-1.5 py-0.5 rounded-full', user.role === 'ADMIN' ? 'bg-[var(--mx-clay)]/10 text-[var(--mx-clay)]' : user.role === 'STUDENT' ? 'bg-primary/10 text-primary' : user.role === 'PARENT' ? 'bg-[var(--mx-warm)]/10 text-[var(--mx-warm)]' : 'bg-[var(--mx-emerald)]/10 text-[var(--mx-emerald)]')}>{user.role}</span><span className={cn('text-[10px] font-medium px-1.5 py-0.5 rounded-full', TIER_COLORS[user.subscriptionTier] ?? TIER_COLORS.FREE)}>{TIER_LABELS[user.subscriptionTier] ?? user.subscriptionTier}</span>{user.status === 'SUSPENDED' && <span className="text-[10px] text-[var(--mx-clay)]">Suspended</span>}</div><p className="text-xs text-muted-foreground truncate">{user.email}{user.grade ? ` · ${user.grade}` : ''}</p></div>
    {g && <div className="hidden sm:flex items-center gap-3 text-xs text-muted-foreground shrink-0"><span className="flex items-center gap-1"><Star className="h-3 w-3 text-primary" /> L{g.level}</span><span className="flex items-center gap-1"><MessageSquare className="h-3 w-3" /> {user.usage.chatMessages}</span><span className="flex items-center gap-1"><Flame className="h-3 w-3 text-[var(--mx-clay)]" /> {g.streakDays}d</span></div>}
    <Button variant="ghost" size="icon" className="h-7 w-7 shrink-0" onClick={onToggle}>{expanded ? <ChevronUp className="h-4 w-4" /> : <ChevronDown className="h-4 w-4" />}</Button>
  </div>
  {expanded && <div className="border-t bg-muted/20 p-4 space-y-4">
    {g ? <div className="grid grid-cols-3 sm:grid-cols-6 gap-2"><DetailStat label="XP" value={g.xp} /><DetailStat label="Level" value={g.level} /><DetailStat label="Coins" value={g.coins} /><DetailStat label="Streak" value={`${g.streakDays}d`} /><DetailStat label="Badges" value={g.achievements} /><DetailStat label="Items" value={g.cosmetics} /><DetailStat label="Chats" value={user.usage.chatMessages} /><DetailStat label="Homework" value={user.usage.homeworkScans} /><DetailStat label="Reviews" value={user.usage.reviewCards} /><DetailStat label="Memories" value={user.usage.memories} /><DetailStat label="Exam Plans" value={user.usage.examPlans} /><DetailStat label="Courses" value={user.usage.courses} /></div> : <p className="text-sm text-muted-foreground">No gamification data.</p>}
    {g?.lastActive && <p className="text-xs text-muted-foreground">Last active: {new Date(g.lastActive).toLocaleString()}</p>}
    <div className="flex flex-wrap items-center gap-2"><Select value={user.subscriptionTier} onValueChange={onTierChange}><SelectTrigger className="w-32 h-8 text-xs"><SelectValue /></SelectTrigger><SelectContent><SelectItem value="FREE">Starter (Free)</SelectItem><SelectItem value="SCHOLAR">Scholar</SelectItem><SelectItem value="FAMILY">Family</SelectItem><SelectItem value="EDUCATOR">Educator</SelectItem></SelectContent></Select><Button variant="outline" size="sm" className="gap-1.5 h-8" onClick={onToggleStatus}>{user.status === 'ACTIVE' ? <><Ban className="h-3 w-3" /> Suspend</> : <><CheckCircle2 className="h-3 w-3" /> Activate</>}</Button><Button variant="outline" size="sm" className="gap-1.5 h-8 text-[var(--mx-clay)] hover:bg-[var(--mx-clay)]/10" onClick={onDelete}><Trash2 className="h-3 w-3" /> Delete</Button></div>
  </div>}</Card>
}
function DetailStat({ label, value }: { label: string; value: any }) { return <div className="rounded-lg border border-border/60 p-2.5 text-center"><p className="font-bold text-sm leading-none">{value}</p><p className="text-[10px] text-muted-foreground mt-0.5">{label}</p></div> }
function CreateUserDialog({ onOpenChange, onCreated }: { onOpenChange: (o: boolean) => void; onCreated: () => void }) {
  const [name, setName] = React.useState(''); const [email, setEmail] = React.useState(''); const [password, setPassword] = React.useState(''); const [role, setRole] = React.useState('STUDENT'); const [grade, setGrade] = React.useState(''); const [tier, setTier] = React.useState('FREE'); const [saving, setSaving] = React.useState(false)
  const submit = async () => { if (!name.trim() || !email.trim() || !password.trim()) { toast.error('Name, email, password required'); return }; setSaving(true); try { const res = await fetch('/api/admin/create-user', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ name: name.trim(), email: email.trim().toLowerCase(), password, role, grade: role === 'STUDENT' ? grade.trim() || undefined : undefined, subscriptionTier: tier }) }); const data = await res.json(); if (!res.ok) throw new Error(data.error); toast.success(`Created ${role.toLowerCase()} on ${TIER_LABELS[tier]} plan`); onCreated() } catch (e: any) { toast.error(e?.message || 'Failed') } finally { setSaving(false) } }
  return <Dialog open onOpenChange={onOpenChange}><DialogContent><DialogHeader><DialogTitle className="flex items-center gap-2"><UserPlus className="h-4 w-4" /> Create New User</DialogTitle><DialogDescription>Create a student, parent, or teacher account.</DialogDescription></DialogHeader>
    <div className="space-y-4 py-2">
      <div className="space-y-1.5"><Label>Full name</Label><Input value={name} onChange={(e) => setName(e.target.value)} placeholder="e.g. Mia Garcia" /></div>
      <div className="space-y-1.5"><Label>Email</Label><Input type="email" value={email} onChange={(e) => setEmail(e.target.value)} placeholder="mia@school.edu" /></div>
      <div className="grid grid-cols-2 gap-3"><div className="space-y-1.5"><Label>Password</Label><Input type="password" value={password} onChange={(e) => setPassword(e.target.value)} placeholder="Min 6 chars" /></div><div className="space-y-1.5"><Label>Role</Label><Select value={role} onValueChange={setRole}><SelectTrigger><SelectValue /></SelectTrigger><SelectContent><SelectItem value="STUDENT">Student</SelectItem><SelectItem value="PARENT">Parent</SelectItem><SelectItem value="TEACHER">Teacher</SelectItem></SelectContent></Select></div></div>
      <div className="grid grid-cols-2 gap-3"><div className="space-y-1.5"><Label>Tier</Label><Select value={tier} onValueChange={setTier}><SelectTrigger><SelectValue /></SelectTrigger><SelectContent><SelectItem value="FREE">Starter (Free)</SelectItem><SelectItem value="SCHOLAR">Scholar ($7.99/mo)</SelectItem><SelectItem value="FAMILY">Family ($19.99/mo)</SelectItem><SelectItem value="EDUCATOR">Educator ($12.99/mo)</SelectItem></SelectContent></Select></div>{role === 'STUDENT' && <div className="space-y-1.5"><Label>Grade</Label><Input value={grade} onChange={(e) => setGrade(e.target.value)} placeholder="8th Grade" /></div>}</div>
    </div>
    <DialogFooter><Button variant="ghost" onClick={() => onOpenChange(false)}>Cancel</Button><Button onClick={submit} disabled={saving} className="gap-1.5">{saving ? <Loader2 className="h-4 w-4 animate-spin" /> : <UserPlus className="h-4 w-4" />} {saving ? 'Creating…' : 'Create user'}</Button></DialogFooter>
  </DialogContent></Dialog>
}
