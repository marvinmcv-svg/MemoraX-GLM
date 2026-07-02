import { NextRequest } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { db } from '@/lib/db'
import { getTelegramBotInfo } from '@/lib/telegram'

export const dynamic = 'force-dynamic'

// GET /api/channels/status — check which channels are linked + available
export async function GET(req: NextRequest) {
  // Try NextAuth session first, fall back to demo mode
  const session = await getServerSession(authOptions)
  let userId: string | null = null

  if (session?.user) {
    userId = (session.user as any).id
  } else {
    const url = new URL(req.url)
    userId = url.searchParams.get('userId')
  }

  if (!userId) return Response.json({ error: 'Unauthorized' }, { status: 401 })

  const user = await db.user.findUnique({
    where: { id: userId },
    select: { id: true, telegramChatId: true, whatsappPhone: true, name: true, email: true },
  })

  if (!user) return Response.json({ error: 'User not found' }, { status: 404 })

  const botInfo = await getTelegramBotInfo()

  return Response.json({
    telegram: {
      linked: !!user.telegramChatId,
      chatId: user.telegramChatId,
      botUsername: botInfo?.username || 'MemoraXBot',
      botName: botInfo?.first_name || 'MemoraX Tutor',
      available: !!process.env.TELEGRAM_BOT_TOKEN,
    },
    whatsapp: {
      linked: !!user.whatsappPhone,
      phone: user.whatsappPhone,
      available: !!process.env.WHATSAPP_ACCESS_TOKEN,
    },
    userName: user.name,
    userEmail: user.email,
  })
}

// POST /api/channels/link — link a phone number for WhatsApp
// body: { channel: 'whatsapp', phone: '+1234567890' }
export async function POST(req: NextRequest) {
  const session = await getServerSession(authOptions)
  let userId: string | null = null

  if (session?.user) {
    userId = (session.user as any).id
  } else {
    const url = new URL(req.url)
    userId = url.searchParams.get('userId')
  }

  if (!userId) return Response.json({ error: 'Unauthorized' }, { status: 401 })

  const { channel, phone } = await req.json()

  if (channel === 'whatsapp' && phone) {
    // Normalize phone to E.164
    const normalized = phone.replace(/[^\d+]/g, '')
    await db.user.update({ where: { id: userId }, data: { whatsappPhone: normalized } })
    return Response.json({ ok: true, phone: normalized })
  }

  if (channel === 'telegram') {
    // Telegram linking happens via the bot (/link command in Telegram)
    // This endpoint is for checking status only
    return Response.json({ error: 'Link Telegram by sending /link your-email to the bot' }, { status: 400 })
  }

  return Response.json({ error: 'Invalid channel' }, { status: 400 })
}

// DELETE — unlink a channel
export async function DELETE(req: NextRequest) {
  const session = await getServerSession(authOptions)
  let userId: string | null = null

  if (session?.user) {
    userId = (session.user as any).id
  } else {
    const url = new URL(req.url)
    userId = url.searchParams.get('userId')
  }

  if (!userId) return Response.json({ error: 'Unauthorized' }, { status: 401 })

  const { channel } = await req.json()

  if (channel === 'telegram') {
    await db.user.update({ where: { id: userId }, data: { telegramChatId: null } })
    return Response.json({ ok: true })
  }

  if (channel === 'whatsapp') {
    await db.user.update({ where: { id: userId }, data: { whatsappPhone: null } })
    return Response.json({ ok: true })
  }

  return Response.json({ error: 'Invalid channel' }, { status: 400 })
}
