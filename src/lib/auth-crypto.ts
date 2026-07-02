import 'server-only'
import bcrypt from 'bcryptjs'
import { db } from '@/lib/db'

export async function hashPassword(password: string): Promise<string> {
  return bcrypt.hash(password, 10)
}

export async function verifyPassword(password: string, hash: string): Promise<boolean> {
  return bcrypt.compare(password, hash)
}

export async function ensureDefaultAdmin(): Promise<void> {
  const adminEmail = 'admin@memorax.app'
  const existing = await db.user.findUnique({ where: { email: adminEmail } })
  if (!existing) {
    const hash = await hashPassword('admin123')
    await db.user.create({
      data: { email: adminEmail, name: 'MemoraX Admin', role: 'ADMIN', avatar: '🔧', passwordHash: hash }
    })
  }
}
