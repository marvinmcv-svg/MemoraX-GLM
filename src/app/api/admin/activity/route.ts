import { NextResponse } from 'next/server'
import { db } from '@/lib/db'
import { requireAdmin } from '@/lib/auth'

export const dynamic = 'force-dynamic'

interface ActivityItem {
  id: string
  kind: 'chat' | 'memory' | 'reminder'
  createdAt: string
  text: string
  actorName: string
  actorAvatar: string | null
  meta?: Record<string, unknown>
}

/** GET /api/admin/activity — recent 20 chats + 20 memories + 20 reminders, merged + sorted desc. */
export async function GET() {
  const guard = await requireAdmin()
  if (!guard.ok) return guard.response

  try {
    const [chats, memories, reminders] = await Promise.all([
      db.chatMessage.findMany({
        take: 20,
        orderBy: { createdAt: 'desc' },
        include: { student: { select: { name: true, avatar: true } } },
      }),
      db.memory.findMany({
        take: 20,
        orderBy: { createdAt: 'desc' },
        include: { student: { select: { name: true, avatar: true } } },
      }),
      db.reminder.findMany({
        take: 20,
        orderBy: { createdAt: 'desc' },
        include: { student: { select: { name: true, avatar: true } } },
      }),
    ])

    const items: ActivityItem[] = []

    for (const c of chats) {
      items.push({
        id: `chat:${c.id}`,
        kind: 'chat',
        createdAt: c.createdAt.toISOString(),
        text: c.content,
        actorName: c.student.name,
        actorAvatar: c.student.avatar,
        meta: { role: c.role, mode: c.mode },
      })
    }
    for (const m of memories) {
      items.push({
        id: `memory:${m.id}`,
        kind: 'memory',
        createdAt: m.createdAt.toISOString(),
        text: m.content,
        actorName: m.student.name,
        actorAvatar: m.student.avatar,
        meta: { type: m.type, tags: m.tags, importance: m.importance },
      })
    }
    for (const r of reminders) {
      items.push({
        id: `reminder:${r.id}`,
        kind: 'reminder',
        createdAt: r.createdAt.toISOString(),
        text: `${r.title} — ${r.body}`,
        actorName: r.student.name,
        actorAvatar: r.student.avatar,
        meta: { type: r.type },
      })
    }

    items.sort((a, b) => (a.createdAt < b.createdAt ? 1 : -1))

    return NextResponse.json({ activity: items })
  } catch (e: any) {
    return NextResponse.json(
      { error: e?.message ?? 'unknown' },
      { status: 500 }
    )
  }
}
