import { NextRequest } from 'next/server'
import { db } from '@/lib/db'

export const dynamic = 'force-dynamic'

// GET /api/student/[studentId]/chat — full chat history (oldest first)
export async function GET(_req: NextRequest, { params }: { params: Promise<{ studentId: string }> }) {
  const { studentId } = await params
  const messages = await db.chatMessage.findMany({
    where: { studentId },
    orderBy: { createdAt: 'asc' },
  })
  return Response.json({ messages })
}
