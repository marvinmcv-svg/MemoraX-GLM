import { NextRequest } from 'next/server'
import { db } from '@/lib/db'
import { COSMETICS, getOrCreateProfile } from '@/lib/gamify'

export const dynamic = 'force-dynamic'

// POST /api/student/[studentId]/avatar — equip cosmetics
// body: { scene?, character?, pet?, accessory? }
// Only equips owned cosmetics (or free defaults).
export async function POST(req: NextRequest, { params }: { params: Promise<{ studentId: string }> }) {
  const { studentId } = await params
  const { scene, character, pet, accessory } = await req.json()

  const updates: Record<string, string> = {}
  const fields: [string, string | undefined][] = [
    ['scene', scene],
    ['character', character],
    ['pet', pet],
    ['accessory', accessory],
  ]

  for (const [field, id] of fields) {
    if (!id) continue
    const cosmetic = COSMETICS.find((c) => c.id === id)
    if (!cosmetic) continue
    // free cosmetics can always be equipped; paid ones must be owned
    if (cosmetic.cost === 0) {
      updates[field] = id
    } else {
      const owned = await db.studentCosmetic.findUnique({
        where: { studentId_cosmeticId: { studentId, cosmeticId: id } },
      })
      if (owned) updates[field] = id
    }
  }

  if (Object.keys(updates).length === 0) {
    return Response.json({ error: 'nothing to equip' }, { status: 400 })
  }

  await getOrCreateProfile(studentId)
  const updated = await db.studentProfile.update({
    where: { studentId },
    data: updates,
  })

  return Response.json({ ok: true, avatar: { scene: updated.scene, character: updated.character, pet: updated.pet, accessory: updated.accessory } })
}
