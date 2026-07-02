import { NextRequest } from 'next/server'
import { db } from '@/lib/db'
import { processMessage } from '@/lib/channel-router'
import { sendWhatsAppMessage } from '@/lib/whatsapp'

export const dynamic = 'force-dynamic'

// GET — WhatsApp webhook verification (Meta sends a verification challenge)
export async function GET(req: NextRequest) {
  const url = new URL(req.url)
  const mode = url.searchParams.get('hub.mode')
  const token = url.searchParams.get('hub.verify_token')
  const challenge = url.searchParams.get('hub.challenge')

  const verifyToken = process.env.WHATSAPP_VERIFY_TOKEN || 'memorax-verify'

  if (mode === 'subscribe' && token === verifyToken) {
    return new Response(challenge, { status: 200 })
  }
  return new Response('Forbidden', { status: 403 })
}

// POST — Receive WhatsApp messages
export async function POST(req: NextRequest) {
  try {
    const body = await req.json()

    // WhatsApp Cloud API webhook payload structure
    const entry = body?.entry?.[0]
    const change = entry?.changes?.[0]
    const messages = change?.value?.messages

    if (!messages || messages.length === 0) {
      return Response.json({ ok: true })
    }

    const message = messages[0]
    const from = message.from // Phone number (E.164)
    const msgType = message.type

    // Find linked user by phone number
    const user = await db.user.findFirst({ where: { whatsappPhone: from } })
    if (!user) {
      // Auto-link: try to find by matching the phone number in the user's email or name
      // For now, send a template message asking them to link
      await sendWhatsAppMessage(
        from,
        'Welcome to MemoraX! To link your WhatsApp to your MemoraX account, please log in to the MemoraX app and go to Settings → Connect WhatsApp.'
      )
      return Response.json({ ok: true })
    }

    if (user.status === 'SUSPENDED') {
      return Response.json({ ok: true })
    }

    // Handle text message
    if (msgType === 'text') {
      const text = message.text?.body
      if (!text) return Response.json({ ok: true })

      // Route to AI brain
      const response = await processMessage({
        channel: 'whatsapp',
        userId: user.id,
        text,
      })

      await sendWhatsAppMessage(from, response.text)
      return Response.json({ ok: true })
    }

    // Handle image (homework photo)
    if (msgType === 'image') {
      const imageId = message.image?.id
      const caption = message.image?.caption || ''

      if (imageId) {
        // Download image from WhatsApp
        const { downloadWhatsAppMedia } = await import('@/lib/whatsapp')
        const imageBuffer = await downloadWhatsAppMedia(imageId)
        const base64Image = `data:image/jpeg;base64,${imageBuffer.toString('base64')}`

        // Analyze with VLM
        const { analyzeHomeworkImage } = await import('@/lib/ai')
        const analysis = await analyzeHomeworkImage(base64Image, caption || undefined)

        // Save as homework memory
        await db.memory.create({
          data: {
            studentId: user.id,
            type: 'HOMEWORK',
            content: `Homework photo via WhatsApp. Subject: ${analysis.subject}. Problem: ${analysis.problemText.slice(0, 200)}`,
            tags: [analysis.subject, ...analysis.topics].slice(0, 6).join(','),
            importance: 4,
          },
        })

        await db.chatMessage.create({
          data: {
            studentId: user.id,
            role: 'user',
            content: `📷 Uploaded homework via WhatsApp (${analysis.subject}). ${caption || analysis.summary}`,
            imageUrl: base64Image,
          },
        })

        await sendWhatsAppMessage(
          from,
          `✅ Problem read!\n\nSubject: ${analysis.subject}\nTopics: ${analysis.topics.join(', ')}\n\n${analysis.problemText.slice(0, 200)}\n\nLet's work through this together — what do you notice about the problem?`
        )
      }
      return Response.json({ ok: true })
    }

    return Response.json({ ok: true })
  } catch (e: any) {
    console.error('WhatsApp webhook error:', e?.message)
    return Response.json({ ok: true }) // Always 200 to WhatsApp
  }
}
