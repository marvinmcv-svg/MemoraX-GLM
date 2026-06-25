import { NextRequest } from 'next/server'
import { db } from '@/lib/db'
import { streamChat, type ChatTurn } from '@/lib/ai'

export const dynamic = 'force-dynamic'

// POST /api/chat — streaming Socratic tutor
// body: { studentId, message, mode: 'socratic'|'solution', imageUrl?: string }
export async function POST(req: NextRequest) {
  try {
    const { studentId, message, mode, imageUrl } = await req.json()
    if (!studentId || !message) {
      return new Response(JSON.stringify({ error: 'studentId and message required' }), {
        status: 400,
      })
    }

    const student = await db.user.findUnique({ where: { id: studentId } })
    if (!student) {
      return new Response(JSON.stringify({ error: 'student not found' }), { status: 404 })
    }

    // Load context: recent chat (last 12) + relevant memories + upcoming assignments
    const [recentChat, memories, upcoming] = await Promise.all([
      db.chatMessage.findMany({
        where: { studentId },
        orderBy: { createdAt: 'desc' },
        take: 12,
      }),
      db.memory.findMany({
        where: { studentId },
        orderBy: { importance: 'desc' },
        take: 12,
      }),
      db.assignment.findMany({
        where: {
          course: { enrollments: { some: { studentId } } },
          dueDate: { gte: new Date(Date.now() - 7 * 86400000) },
        },
        include: { course: true },
        orderBy: { dueDate: 'asc' },
        take: 6,
      }),
    ])

    // Build system prompt
    const memoryBlock = memories
      .map(
        (m) =>
          `- [${m.type}${m.importance >= 4 ? ', HIGH' : ''}] ${m.content}${
            m.tags ? ` (tags: ${m.tags})` : ''
          }`
      )
      .join('\n')

    const assignmentBlock = upcoming
      .map(
        (a) =>
          `- ${a.title} (${a.course.name}, due ${a.dueDate.toISOString().slice(0, 10)}, type ${a.type})`
      )
      .join('\n')

    const isSocratic = mode !== 'solution'

    const systemPrompt = `You are MemoraX, a warm, patient AI study tutor for ${student.name} (${student.grade ?? 'a student'}).

# Your teaching philosophy
${isSocratic ? `You teach using the SOCRATIC METHOD. You almost NEVER just give the answer. Instead you:
- Ask guiding questions that lead the student to discover the answer themselves
- Break problems into smaller steps
- Acknowledge what they already know (praise effort, not just correctness)
- If they're truly stuck after 2-3 exchanges, offer a hint — but still framed as a question
- Use plain, friendly language. Be encouraging, never condescending.
- Keep replies concise (2-5 short paragraphs max). This is a chat, not an essay.
- When relevant, draw on the student's memory below to personalize guidance.` : `The student has explicitly asked to SEE THE SOLUTION. Provide a clear, fully worked solution with each step explained. After the solution, add a short "💡 To master this" tip that suggests how to practice or a common pitfall to watch for. Keep it focused — this is a chat.`}

# What you remember about ${student.name}
${memoryBlock || '(no memories yet — this is a fresh start)'}

# ${student.name}'s upcoming assignments (for context)
${assignmentBlock || '(none loaded)'}

# Rules
- Never invent facts about the student that aren't in memory.
- If the student uploads a homework photo, an image description / transcribed problem will be included in their message. Treat it as the problem they need help with.
- Use light Markdown: **bold** for key terms, \`code\` for math, and occasional 👍 / 💡 / 🤔 emojis (sparingly).
- If the student seems frustrated, acknowledge it before continuing.`

    const historyTurns: ChatTurn[] = recentChat
      .reverse()
      .map((m) => ({
        role: (m.role === 'user' ? 'user' : 'assistant') as 'user' | 'assistant',
        content: m.imageUrl
          ? `[Student uploaded a homework photo. Earlier analysis: ${m.content}]`
          : m.content,
      }))

    const userContent = imageUrl
      ? `${message}\n\n[Attached: a homework photo. The image has been analyzed and its content is referenced above.]`
      : message

    const turns: ChatTurn[] = [
      { role: 'system', content: systemPrompt },
      ...historyTurns,
      { role: 'user', content: userContent },
    ]

    // Save the user message now (so it persists even if streaming fails)
    await db.chatMessage.create({
      data: {
        studentId,
        role: 'user',
        content: message,
        imageUrl: imageUrl ?? null,
      },
    })

    // Stream
    const encoder = new TextEncoder()
    const stream = new ReadableStream({
      async start(controller) {
        let full = ''
        try {
          for await (const delta of streamChat(turns)) {
            full += delta
            controller.enqueue(encoder.encode(`data: ${JSON.stringify({ delta })}\n\n`))
          }
          // Save assistant reply
          const saved = await db.chatMessage.create({
            data: {
              studentId,
              role: 'assistant',
              content: full,
              mode: isSocratic ? 'socratic' : 'solution',
            },
          })
          controller.enqueue(
            encoder.encode(
              `data: ${JSON.stringify({ done: true, messageId: saved.id })}\n\n`
            )
          )
          // Best-effort: extract a memory from the exchange (non-blocking)
          extractMemoryInBackground(studentId, message, full).catch(() => {})
        } catch (e: any) {
          controller.enqueue(
            encoder.encode(`data: ${JSON.stringify({ error: e?.message ?? 'stream error' })}\n\n`)
          )
        } finally {
          controller.enqueue(encoder.encode('data: [DONE]\n\n'))
          controller.close()
        }
      },
    })

    return new Response(stream, {
      headers: {
        'Content-Type': 'text/event-stream',
        'Cache-Control': 'no-cache, no-transform',
        Connection: 'keep-alive',
      },
    })
  } catch (e: any) {
    console.error('chat error', e)
    return new Response(JSON.stringify({ error: e?.message ?? 'unknown' }), { status: 500 })
  }
}

// Lightweight background memory extraction
async function extractMemoryInBackground(studentId: string, userMsg: string, assistantMsg: string) {
  if (userMsg.length < 15) return
  try {
    const { chatOnce } = await import('@/lib/ai')
    const out = await chatOnce([
      {
        role: 'system',
        content:
          'You inspect a student-tutor exchange and decide if a durable memory should be stored. Return STRICT JSON only: {"store": true|false, "type": "CONCEPT|WEAK_AREA|STUDY_TIP|TUTOR_SESSION", "content": "one sentence", "importance": 1-5, "tags": "comma,separated"}. store=false if nothing memorable (small talk, greetings).',
      },
      {
        role: 'user',
        content: `Student said: ${userMsg}\n\nTutor replied: ${assistantMsg}`,
      },
    ])
    const m = out.match(/\{[\s\S]*\}/)
    if (m) {
      const parsed = JSON.parse(m[0])
      if (parsed.store && parsed.content) {
        await db.memory.create({
          data: {
            studentId,
            type: parsed.type ?? 'TUTOR_SESSION',
            content: String(parsed.content).slice(0, 400),
            tags: parsed.tags ?? null,
            importance: Number(parsed.importance ?? 3) || 3,
          },
        })
      }
    }
  } catch {
    /* best-effort */
  }
}
