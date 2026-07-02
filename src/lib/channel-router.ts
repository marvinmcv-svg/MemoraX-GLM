import 'server-only'
import { db } from '@/lib/db'
import { streamChat, type ChatTurn } from '@/lib/ai'
import { awardXp, touchStreak, incrementCounter, notifyFamilyOfCelebration, maybeNotifyFrustration } from '@/lib/gamify'
import { levelFromXp } from '@/lib/gamify'
import { moderateInput, sanitizeInput, getSafetyClauses, moderateOutput } from '@/lib/safety'

export type Channel = 'web' | 'telegram' | 'whatsapp'

export interface IncomingMessage {
  channel: Channel
  userId: string
  text: string
  imageUrl?: string // URL or base64 data URL
}

export interface OutgoingMessage {
  text: string
  imageUrl?: string
}

/**
 * The unified AI brain — processes a message from any channel (web, Telegram, WhatsApp)
 * and returns the tutor's response. This is the single entry point for all AI interactions.
 *
 * 1. Loads student context (memory, assignments, recent chat)
 * 2. Calls the streaming LLM with Socratic system prompt
 * 3. Saves the exchange to the DB
 * 4. Awards XP, touches streak, detects frustration
 * 5. Returns the full response text
 */
export async function processMessage(msg: IncomingMessage): Promise<OutgoingMessage> {
  const { userId, text, imageUrl, channel } = msg

  // Load student
  const student = await db.user.findUnique({ where: { id: userId } })
  if (!student) throw new Error('Student not found')

  // --- Content moderation: check for inappropriate content ---
  const moderation = moderateInput(text)
  if (moderation.flagged && moderation.severity !== 'low') {
    // Save the flagged interaction for admin review
    await db.chatMessage.create({ data: { studentId: userId, role: 'user', content: `[FLAGGED: ${moderation.category}] ${text}` } })
    await db.chatMessage.create({ data: { studentId: userId, role: 'assistant', content: moderation.reason, mode: 'socratic' } })
    return { text: moderation.reason }
  }

  // --- Prompt injection defense: sanitize the input ---
  const { cleaned: sanitizedText, injected } = sanitizeInput(text)
  const safeText = injected ? sanitizedText : text

  // Load context (same as /api/chat)
  const [recentChat, memories, upcoming] = await Promise.all([
    db.chatMessage.findMany({
      where: { studentId: userId },
      orderBy: { createdAt: 'desc' },
      take: 12,
    }),
    db.memory.findMany({
      where: { studentId: userId },
      orderBy: { importance: 'desc' },
      take: 12,
    }),
    db.assignment.findMany({
      where: {
        course: { enrollments: { some: { studentId: userId } } },
        dueDate: { gte: new Date(Date.now() - 7 * 86400000) },
      },
      include: { course: true },
      orderBy: { dueDate: 'asc' },
      take: 6,
    }),
  ])

  const isSocratic = true // Telegram/WhatsApp always starts in Socratic mode
  const memoryBlock = memories
    .map((m) => `- [${m.type}${m.importance >= 4 ? ', HIGH' : ''}] ${m.content}${m.tags ? ` (tags: ${m.tags})` : ''}`)
    .join('\n')

  const assignmentBlock = upcoming
    .map((a) => `- ${a.title} (${a.course.name}, due ${a.dueDate.toISOString().slice(0, 10)}, type ${a.type})`)
    .join('\n')

  const systemPrompt = `You are MemoraX, a warm, patient AI study tutor for ${student.name} (${student.grade ?? 'a student'}).

# Your teaching philosophy
You teach using the SOCRATIC METHOD. You almost NEVER just give the answer. Instead you:
- Ask guiding questions that lead the student to discover the answer themselves
- Break problems into smaller steps
- Acknowledge what they already know
- If truly stuck after 2-3 exchanges, offer a hint — still framed as a question
- Use plain, friendly language. Be encouraging, never condescending.
- Keep replies concise (2-4 short paragraphs max). This is a chat message on ${channel}, not an essay.
- When relevant, draw on the student's memory below to personalize guidance.

# What you remember about ${student.name}
${memoryBlock || '(no memories yet — this is a fresh start)'}

# ${student.name}'s upcoming assignments (for context)
${assignmentBlock || '(none loaded)'}

# Rules
- Never invent facts about the student that aren't in memory.
- Use light Markdown: **bold** for key terms, \`code\` for math.
- If the student seems frustrated, acknowledge it before continuing.
- This message came via ${channel}. Keep formatting simple — no complex markdown for mobile chat apps.${getSafetyClauses()}`

  const historyTurns: ChatTurn[] = recentChat
    .reverse()
    .map((m) => ({
      role: (m.role === 'user' ? 'user' : 'assistant') as 'user' | 'assistant',
      content: m.imageUrl
        ? `[Student uploaded a homework photo. Earlier analysis: ${m.content}]`
        : m.content,
    }))

  const userContent = imageUrl
    ? `${safeText}\n\n[Attached: a homework photo.]`
    : safeText

  const turns: ChatTurn[] = [
    { role: 'system', content: systemPrompt },
    ...historyTurns,
    { role: 'user', content: userContent },
  ]

  // Save user message
  await db.chatMessage.create({
    data: {
      studentId: userId,
      role: 'user',
      content: safeText,
      imageUrl: imageUrl ?? null,
    },
  })

  // Stream the response (collect full text for non-web channels)
  let fullResponse = ''
  for await (const delta of streamChat(turns)) {
    fullResponse += delta
  }

  // --- Output moderation: check AI response ---
  const outputMod = moderateOutput(fullResponse)
  const finalResponse = outputMod.flagged
    ? 'I apologize, but I need to redirect our conversation. Let\'s focus on your homework! What subject are you working on? 📚'
    : fullResponse

  // Save assistant reply
  await db.chatMessage.create({
    data: {
      studentId: userId,
      role: 'assistant',
      content: finalResponse,
      mode: 'socratic',
    },
  })

  // Gamification (non-blocking)
  touchStreak(userId)
    .then(({ streakBonus }) =>
      incrementCounter(userId, 'totalChats').then(() =>
        awardXp(userId, 5 + streakBonus, { reason: `${channel}-chat` })
      )
    )
    .then((r) => {
      if (r.leveledUp || r.unlockedAchievements.length > 0) {
        const parts: string[] = []
        if (r.leveledUp) parts.push(`🎉 Level up! You reached **level ${r.newLevel}**!`)
        for (const a of r.unlockedAchievements) {
          parts.push(`🏅 Achievement: **${a.name}** — ${a.desc}`)
        }
        if (parts.length > 0) {
          db.chatMessage
            .create({ data: { studentId: userId, role: 'assistant', content: parts.join('\n\n'), mode: 'socratic' } })
            .catch(() => {})
        }
        notifyFamilyOfCelebration(userId, r).catch(() => {})
      }
    })
    .catch(() => {})

  // Frustration detection (non-blocking)
  maybeNotifyFrustration(userId, safeText).catch(() => {})

  return { text: finalResponse }
}
