import { NextRequest } from 'next/server'
import { db } from '@/lib/db'
import { processMessage } from '@/lib/channel-router'
import { sendTelegramMessage, downloadTelegramFile, type TelegramUpdate } from '@/lib/telegram'
import { analyzeHomeworkImage } from '@/lib/ai'

export const dynamic = 'force-dynamic'

// POST /api/telegram/webhook
// Receives Telegram updates and routes them to the AI tutor
export async function POST(req: NextRequest) {
  try {
    const update: TelegramUpdate = await req.json()

    // Only handle messages
    if (!update.message) {
      return Response.json({ ok: true })
    }

    const chatId = String(update.message.chat.id)
    const msgText = update.message.text || ''
    const fromName = update.message.from?.first_name || 'there'

    // Handle /start command — link account
    if (msgText.startsWith('/start')) {
      // Check if this chat ID is already linked
      const linkedUser = await db.user.findFirst({ where: { telegramChatId: chatId } })
      if (linkedUser) {
        await sendTelegramMessage(
          chatId,
          `Welcome back, ${linkedUser.name}! 👋\n\nI'm your MemoraX tutor. Ask me anything about your homework, and I'll guide you through it.`
        )
      } else {
        await sendTelegramMessage(
          chatId,
          `Hi ${fromName}! 👋 I'm the MemoraX AI tutor.\n\nTo get started, I need to link your Telegram to your MemoraX account.\n\nSend me your account email like this:\n/link your@email.com`
        )
      }
      return Response.json({ ok: true })
    }

    // Handle /link command — link Telegram to MemoraX account
    if (msgText.startsWith('/link ')) {
      const email = msgText.slice(6).trim().toLowerCase()
      const user = await db.user.findUnique({ where: { email } })

      if (!user) {
        await sendTelegramMessage(chatId, `I couldn't find an account with email ${email}. Make sure you've registered on MemoraX first.`)
        return Response.json({ ok: true })
      }

      if (user.role !== 'STUDENT') {
        await sendTelegramMessage(chatId, `This account is a ${user.role.toLowerCase()}, not a student. The Telegram tutor is for students only.`)
        return Response.json({ ok: true })
      }

      // Link the chat ID
      await db.user.update({ where: { id: user.id }, data: { telegramChatId: chatId } })
      await sendTelegramMessage(
        chatId,
        `✅ Linked to ${user.name}'s account!\n\nI'm your MemoraX tutor now. I remember everything we've worked on. Ask me anything! 📚`
      )
      return Response.json({ ok: true })
    }

    // Handle /help command
    if (msgText === '/help') {
      await sendTelegramMessage(
        chatId,
        `📚 *MemoraX Tutor Commands*\n\n• Just send me a message and I'll help you with your homework!\n• Send a photo of your homework and I'll read it\n• /link email — link your MemoraX account\n• /help — show this help\n\nI remember what you've worked on, so I get smarter every time we chat. 💪`
      )
      return Response.json({ ok: true })
    }

    // Find the linked user
    const user = await db.user.findFirst({ where: { telegramChatId: chatId } })
    if (!user) {
      await sendTelegramMessage(
        chatId,
        `I don't recognize you yet! Send me /link your-email@example.com to connect your MemoraX account.`
      )
      return Response.json({ ok: true })
    }

    // Check if user is suspended
    if (user.status === 'SUSPENDED') {
      await sendTelegramMessage(chatId, `Your account has been suspended. Please contact your administrator.`)
      return Response.json({ ok: true })
    }

    // Handle photo (homework scan)
    if (update.message.photo && update.message.photo.length > 0) {
      const largestPhoto = update.message.photo[update.message.photo.length - 1]
      await sendTelegramMessage(chatId, `📖 Reading your homework...`)

      try {
        const imageBuffer = await downloadTelegramFile(largestPhoto.file_id)
        const base64Image = `data:image/jpeg;base64,${imageBuffer.toString('base64')}`

        // Analyze with VLM
        const analysis = await analyzeHomeworkImage(base64Image, msgText || undefined)

        // Save as a homework memory
        await db.memory.create({
          data: {
            studentId: user.id,
            type: 'HOMEWORK',
            content: `Homework photo via Telegram. Subject: ${analysis.subject}. Problem: ${analysis.problemText.slice(0, 200)}`,
            tags: [analysis.subject, ...analysis.topics].slice(0, 6).join(','),
            importance: 4,
          },
        })

        // Save the user's photo message
        await db.chatMessage.create({
          data: {
            studentId: user.id,
            role: 'user',
            content: `📷 Uploaded homework via Telegram (${analysis.subject}). ${msgText || analysis.summary}`,
            imageUrl: base64Image,
          },
        })

        // Send analysis summary
        await sendTelegramMessage(
          chatId,
          `✅ *Problem read!*\n\n*Subject:* ${analysis.subject}\n*Topics:* ${analysis.topics.join(', ')}\n*Difficulty:* ${analysis.difficulty}\n\n*Problem:* ${analysis.problemText.slice(0, 300)}\n\nNow — let's work through this together. What do you notice about the problem?`
        )
      } catch (e: any) {
        await sendTelegramMessage(chatId, `Sorry, I couldn't read that photo. Try a clearer picture, or just type your question!`)
      }
      return Response.json({ ok: true })
    }

    // Regular text message → route to AI brain
    if (msgText && !msgText.startsWith('/')) {
      // Send "typing" indicator
      await sendTelegramMessage(chatId, '🤔')

      const response = await processMessage({
        channel: 'telegram',
        userId: user.id,
        text: msgText,
      })

      await sendTelegramMessage(chatId, response.text)
      return Response.json({ ok: true })
    }

    return Response.json({ ok: true })
  } catch (e: any) {
    console.error('Telegram webhook error:', e?.message)
    return Response.json({ ok: true }) // Always return 200 to Telegram
  }
}

// GET — webhook verification (Telegram sends this on setup)
export async function GET() {
  return Response.json({ ok: true, service: 'MemoraX Telegram Bot' })
}
