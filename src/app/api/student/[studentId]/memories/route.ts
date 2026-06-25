import { NextRequest } from 'next/server'
import { db } from '@/lib/db'

export const dynamic = 'force-dynamic'

// GET /api/student/[studentId]/memories
export async function GET(_req: NextRequest, { params }: { params: Promise<{ studentId: string }> }) {
  const { studentId } = await params
  const memories = await db.memory.findMany({
    where: { studentId },
    orderBy: [{ importance: 'desc' }, { createdAt: 'desc' }],
  })
  return Response.json({ memories })
}
