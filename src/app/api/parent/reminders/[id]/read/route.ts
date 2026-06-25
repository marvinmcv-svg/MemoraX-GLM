import { NextRequest } from 'next/server'
import { db } from '@/lib/db'

export const dynamic = 'force-dynamic'

// POST /api/parent/reminders/[id]/read — mark a reminder as read
export async function POST(_req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params
  await db.reminder.update({
    where: { id },
    data: { readAt: new Date() },
  })
  return Response.json({ ok: true })
}
