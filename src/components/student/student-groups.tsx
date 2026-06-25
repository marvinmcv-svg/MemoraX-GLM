'use client'

import * as React from 'react'
import { Users, Plus, Loader2, UserPlus, MessageSquare, Sparkles } from 'lucide-react'
import { Card } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Avatar, AvatarFallback } from '@/components/ui/avatar'
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from '@/components/ui/dialog'
import { useSession } from '@/lib/session'
import { api } from '@/lib/api-client'
import { toast } from 'sonner'

interface GroupData {
  id: string
  name: string
  subject: string | null
  createdBy: string
  memberCount: number
  members?: { name: string; avatar: string | null }[]
  joinedAt?: string
}

export function StudentGroups() {
  const { user } = useSession()
  const [mine, setMine] = React.useState<GroupData[]>([])
  const [available, setAvailable] = React.useState<GroupData[]>([])
  const [loading, setLoading] = React.useState(true)
  const [showNew, setShowNew] = React.useState(false)
  const [joining, setJoining] = React.useState<string | null>(null)

  const load = React.useCallback(async () => {
    if (!user) return
    setLoading(true)
    try {
      const r = await api.groups(user.id)
      setMine(r.mine)
      setAvailable(r.available)
    } catch {
      toast.error('Could not load study groups')
    } finally {
      setLoading(false)
    }
  }, [user])

  React.useEffect(() => {
    load()
  }, [load])

  const join = async (groupId: string) => {
    if (!user) return
    setJoining(groupId)
    try {
      await api.joinGroup(user.id, groupId)
      toast.success('Joined the study group!')
      load()
    } catch {
      toast.error('Could not join group')
    } finally {
      setJoining(null)
    }
  }

  return (
    <div className="space-y-5">
      <Card className="overflow-hidden">
        <div className="flex items-center gap-4 p-5 bg-gradient-to-r from-[var(--mx-emerald-soft)] to-[var(--mx-warm-soft)]/40">
          <div className="h-12 w-12 rounded-xl bg-card grid place-items-center shadow-sm shrink-0">
            <Users className="h-6 w-6 text-primary" />
          </div>
          <div className="flex-1 min-w-0">
            <h2 className="font-semibold text-lg">Study groups</h2>
            <p className="text-sm text-muted-foreground">
              Team up with classmates. The tutor remembers everyone&apos;s gaps and helps the whole group.
            </p>
          </div>
          <Button size="sm" className="gap-1.5 shrink-0" onClick={() => setShowNew(true)}>
            <Plus className="h-4 w-4" /> New group
          </Button>
        </div>
      </Card>

      {/* My groups */}
      <div>
        <h3 className="font-semibold text-sm mb-2 flex items-center gap-2">
          <Users className="h-4 w-4 text-primary" /> My groups
          <Badge variant="outline" className="text-[11px]">{mine.length}</Badge>
        </h3>
        {loading ? (
          <div className="space-y-2">
            {[...Array(2)].map((_, i) => (
              <div key={i} className="h-20 rounded-xl bg-muted animate-pulse" />
            ))}
          </div>
        ) : mine.length === 0 ? (
          <Card className="p-6 text-center">
            <p className="text-sm text-muted-foreground">
              You haven&apos;t joined any groups yet. Create one or join a classmate&apos;s group below.
            </p>
          </Card>
        ) : (
          <div className="space-y-2">
            {mine.map((g) => (
              <Card key={g.id} className="p-4">
                <div className="flex items-start gap-3">
                  <div className="h-11 w-11 rounded-xl bg-[var(--mx-emerald-soft)] grid place-items-center shrink-0">
                    <Users className="h-5 w-5 text-primary" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="font-medium truncate">{g.name}</p>
                    <div className="flex items-center gap-2 mt-0.5">
                      {g.subject && <Badge variant="outline" className="text-[10px] py-0">{g.subject}</Badge>}
                      <span className="text-xs text-muted-foreground">by {g.createdBy}</span>
                    </div>
                    {g.members && g.members.length > 0 && (
                      <div className="flex items-center -space-x-1.5 mt-2">
                        {g.members.slice(0, 5).map((m, i) => (
                          <Avatar key={i} className="h-6 w-6 border-2 border-card">
                            <AvatarFallback className="text-[10px] bg-[var(--mx-emerald-soft)]">{m.avatar ?? m.name[0]}</AvatarFallback>
                          </Avatar>
                        ))}
                        {g.members.length > 5 && (
                          <div className="h-6 w-6 rounded-full bg-muted border-2 border-card grid place-items-center text-[10px] font-medium">
                            +{g.members.length - 5}
                          </div>
                        )}
                      </div>
                    )}
                  </div>
                  <Button variant="outline" size="sm" className="gap-1.5 shrink-0" onClick={() => toast('Shared tutor session coming soon — for now, your group is saved!')}>
                    <MessageSquare className="h-3.5 w-3.5" /> Open
                  </Button>
                </div>
              </Card>
            ))}
          </div>
        )}
      </div>

      {/* Available groups */}
      {available.length > 0 && (
        <div>
          <h3 className="font-semibold text-sm mb-2 flex items-center gap-2">
            <Sparkles className="h-4 w-4 text-[var(--mx-warm)]" /> Classmate groups
          </h3>
          <div className="space-y-2">
            {available.map((g) => (
              <Card key={g.id} className="p-4">
                <div className="flex items-center gap-3">
                  <div className="h-10 w-10 rounded-xl bg-muted grid place-items-center shrink-0">
                    <Users className="h-4.5 w-4.5 text-muted-foreground" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="font-medium text-sm truncate">{g.name}</p>
                    <div className="flex items-center gap-2 mt-0.5">
                      {g.subject && <Badge variant="outline" className="text-[10px] py-0">{g.subject}</Badge>}
                      <span className="text-xs text-muted-foreground">by {g.createdBy} · {g.memberCount} members</span>
                    </div>
                  </div>
                  <Button
                    variant="outline"
                    size="sm"
                    className="gap-1.5 shrink-0"
                    onClick={() => join(g.id)}
                    disabled={joining === g.id}
                  >
                    {joining === g.id ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <UserPlus className="h-3.5 w-3.5" />}
                    Join
                  </Button>
                </div>
              </Card>
            ))}
          </div>
        </div>
      )}

      {showNew && (
        <NewGroupDialog
          onOpenChange={(o) => !o && setShowNew(false)}
          onCreated={() => {
            setShowNew(false)
            load()
          }}
        />
      )}
    </div>
  )
}

function NewGroupDialog({ onOpenChange, onCreated }: { onOpenChange: (o: boolean) => void; onCreated: () => void }) {
  const { user } = useSession()
  const [name, setName] = React.useState('')
  const [subject, setSubject] = React.useState('')
  const [saving, setSaving] = React.useState(false)

  const submit = async () => {
    if (!user || !name.trim()) return
    setSaving(true)
    try {
      await api.createGroup(user.id, { name, subject })
      setName('')
      setSubject('')
      onCreated()
      toast.success('Study group created!')
    } catch {
      toast.error('Could not create group')
    } finally {
      setSaving(false)
    }
  }

  return (
    <Dialog open onOpenChange={onOpenChange}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Create a study group</DialogTitle>
          <DialogDescription>
            Classmates from your courses can discover and join your group.
          </DialogDescription>
        </DialogHeader>
        <div className="space-y-4 py-2">
          <div className="space-y-1.5">
            <Label htmlFor="gn">Group name</Label>
            <Input id="gn" value={name} onChange={(e) => setName(e.target.value)} placeholder="e.g. Algebra II Study Squad" />
          </div>
          <div className="space-y-1.5">
            <Label htmlFor="gs">Subject (optional)</Label>
            <Input id="gs" value={subject} onChange={(e) => setSubject(e.target.value)} placeholder="Math" />
          </div>
        </div>
        <DialogFooter>
          <Button variant="ghost" onClick={() => onOpenChange(false)}>Cancel</Button>
          <Button onClick={submit} disabled={saving || !name.trim()} className="gap-1.5">
            {saving ? <Loader2 className="h-4 w-4 animate-spin" /> : <Plus className="h-4 w-4" />}
            Create group
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}
