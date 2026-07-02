'use client'

import * as React from 'react'
import { Loader2, UserPlus, Pencil } from 'lucide-react'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { toast } from 'sonner'
import type { Role, SafeUser } from '@/lib/types'

const AVATAR_PRESETS = [
  '🛡️', '👩🏽‍🏫', '👨🏽‍🏫', '👩🏻', '👨🏻', '👧🏽', '👦🏽', '🧒', '👩‍🎓',
  '👨‍🎓', '🧑‍🔬', '👩‍🔬', '🧑‍🏫', '🦉', '📚', '✏️', '🎓', '🌟',
]

const ROLES: { value: Role; label: string }[] = [
  { value: 'STUDENT', label: 'Student' },
  { value: 'PARENT', label: 'Parent' },
  { value: 'TEACHER', label: 'Teacher' },
  { value: 'ADMIN', label: 'Admin' },
]

interface UserFormDialogProps {
  /** When provided, we're editing. When null, we're creating. */
  user?: SafeUser | null
  trigger?: React.ReactNode
  onSaved?: () => void
}

export function UserFormDialog({ user, trigger, onSaved }: UserFormDialogProps) {
  const [open, setOpen] = React.useState(false)
  const isEdit = !!user

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        {trigger ?? (
          <Button size="sm" className="gap-1.5">
            {isEdit ? <Pencil className="h-3.5 w-3.5" /> : <UserPlus className="h-3.5 w-3.5" />}
            {isEdit ? 'Edit' : 'New user'}
          </Button>
        )}
      </DialogTrigger>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>{isEdit ? `Edit ${user!.name}` : 'Create user'}</DialogTitle>
          <DialogDescription>
            {isEdit
              ? 'Update profile, role, or set a new password.'
              : 'Add a new user. They will be able to sign in with the password you set.'}
          </DialogDescription>
        </DialogHeader>
        <UserFormBody
          user={user ?? null}
          onCancel={() => setOpen(false)}
          onSaved={() => {
            setOpen(false)
            onSaved?.()
          }}
        />
      </DialogContent>
    </Dialog>
  )
}

function UserFormBody({
  user,
  onCancel,
  onSaved,
}: {
  user: SafeUser | null
  onCancel: () => void
  onSaved: () => void
}) {
  const isEdit = !!user
  const [name, setName] = React.useState(user?.name ?? '')
  const [email, setEmail] = React.useState(user?.email ?? '')
  const [role, setRole] = React.useState<Role>(user?.role ?? 'STUDENT')
  const [avatar, setAvatar] = React.useState<string>(user?.avatar ?? '🛡️')
  const [grade, setGrade] = React.useState(user?.grade ?? '')
  const [password, setPassword] = React.useState('')
  const [submitting, setSubmitting] = React.useState(false)

  const submit = async () => {
    if (submitting) return
    setSubmitting(true)
    try {
      const payload: Record<string, unknown> = {
        name,
        email,
        role,
        avatar,
      }
      if (role === 'STUDENT') {
        payload.grade = grade
      }
      if (password) {
        payload.password = password
      }

      const url = isEdit ? `/api/admin/users/${user!.id}` : '/api/admin/users'
      const method = isEdit ? 'PATCH' : 'POST'
      const res = await fetch(url, {
        method,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      })
      const json = await res.json()
      if (!res.ok) {
        toast.error(json?.error ?? 'Could not save user')
        return
      }
      toast.success(isEdit ? 'User updated' : 'User created')
      onSaved()
    } catch (e: any) {
      toast.error(e?.message ?? 'Network error')
    } finally {
      setSubmitting(false)
    }
  }

  return (
    <div className="space-y-4">
      <div className="space-y-1.5">
        <Label>Avatar</Label>
        <div className="grid grid-cols-9 gap-1.5">
          {AVATAR_PRESETS.map((a) => (
            <button
              key={a}
              type="button"
              onClick={() => setAvatar(a)}
              aria-pressed={avatar === a}
              className={`h-9 w-9 rounded-md text-lg grid place-items-center border transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring ${
                avatar === a
                  ? 'bg-primary/10 border-primary'
                  : 'bg-card border-border/60 hover:bg-muted'
              }`}
            >
              {a}
            </button>
          ))}
        </div>
        <p className="text-[11px] text-muted-foreground">
          Selected: <span className="font-medium">{avatar}</span>
        </p>
      </div>

      <div className="grid grid-cols-2 gap-3">
        <div className="space-y-1.5 col-span-2 sm:col-span-1">
          <Label htmlFor="uf-name">Name</Label>
          <Input
            id="uf-name"
            value={name}
            onChange={(e) => setName(e.target.value)}
            placeholder="e.g. Mia Garcia"
          />
        </div>
        <div className="space-y-1.5 col-span-2 sm:col-span-1">
          <Label htmlFor="uf-email">Email</Label>
          <Input
            id="uf-email"
            type="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            placeholder="user@memorax.school"
          />
        </div>
      </div>

      <div className="grid grid-cols-2 gap-3">
        <div className="space-y-1.5">
          <Label>Role</Label>
          <Select value={role} onValueChange={(v) => setRole(v as Role)}>
            <SelectTrigger>
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              {ROLES.map((r) => (
                <SelectItem key={r.value} value={r.value}>
                  {r.label}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
        {role === 'STUDENT' && (
          <div className="space-y-1.5">
            <Label htmlFor="uf-grade">Grade</Label>
            <Input
              id="uf-grade"
              value={grade}
              onChange={(e) => setGrade(e.target.value)}
              placeholder="e.g. 8th Grade"
            />
          </div>
        )}
      </div>

      <div className="space-y-1.5">
        <Label htmlFor="uf-pw">
          {isEdit ? 'New password (optional)' : 'Password'}
        </Label>
        <Input
          id="uf-pw"
          type="password"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          placeholder={isEdit ? 'Leave blank to keep current' : 'At least 6 characters'}
        />
        <p className="text-[11px] text-muted-foreground">
          {isEdit
            ? 'Only set this if you want to reset the user\u2019s password.'
            : 'Used for credentials sign-in. Minimum 6 characters.'}
        </p>
      </div>

      <DialogFooter>
        <Button variant="ghost" onClick={onCancel} disabled={submitting}>
          Cancel
        </Button>
        <Button onClick={submit} disabled={submitting} className="gap-1.5">
          {submitting && <Loader2 className="h-4 w-4 animate-spin" />}
          {isEdit ? 'Save changes' : 'Create user'}
        </Button>
      </DialogFooter>
    </div>
  )
}

/** Lightweight inline delete confirmation dialog. */
export function DeleteUserDialog({
  user,
  onDeleted,
}: {
  user: SafeUser
  onDeleted?: () => void
}) {
  const [open, setOpen] = React.useState(false)
  const [submitting, setSubmitting] = React.useState(false)

  const confirm = async () => {
    if (submitting) return
    setSubmitting(true)
    try {
      const res = await fetch(`/api/admin/users/${user.id}`, { method: 'DELETE' })
      const json = await res.json()
      if (!res.ok) {
        toast.error(json?.error ?? 'Could not delete user')
        return
      }
      toast.success(`${user.name} deleted`)
      setOpen(false)
      onDeleted?.()
    } catch (e: any) {
      toast.error(e?.message ?? 'Network error')
    } finally {
      setSubmitting(false)
    }
  }

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button
          size="sm"
          variant="outline"
          className="gap-1.5 text-[var(--mx-clay)] border-[var(--mx-clay)]/40 hover:bg-[var(--mx-clay)]/10"
        >
          Delete
        </Button>
      </DialogTrigger>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>Delete {user.name}?</DialogTitle>
          <DialogDescription>
            This permanently removes the user and all of their associated data
            (chats, memories, submissions, reminders, etc.). This cannot be undone.
          </DialogDescription>
        </DialogHeader>
        <div className="rounded-lg border border-[var(--mx-clay)]/30 bg-[var(--mx-clay)]/5 px-3 py-2 text-sm">
          <p className="font-medium">{user.name}</p>
          <p className="text-xs text-muted-foreground">{user.email} · {user.role}</p>
        </div>
        <DialogFooter>
          <Button variant="ghost" onClick={() => setOpen(false)} disabled={submitting}>
            Cancel
          </Button>
          <Button
            onClick={confirm}
            disabled={submitting}
            className="gap-1.5 bg-[var(--mx-clay)] text-white hover:bg-[var(--mx-clay)]/90"
          >
            {submitting && <Loader2 className="h-4 w-4 animate-spin" />}
            Delete user
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}
