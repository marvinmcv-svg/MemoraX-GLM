import { NextRequest } from 'next/server'
import { db } from '@/lib/db'
import { analyzeHomeworkImage } from '@/lib/ai'
import { awardXp, touchStreak, incrementCounter, notifyFamilyOfCelebration } from '@/lib/gamify'

export const dynamic = 'force-dynamic'

// POST /api/homework/analyze
// body: { studentId, imageDataUrl, assignmentId?, question? }
// Returns the VLM's structured read of the problem. Also stores a memory + chat message.
export async function POST(req: NextRequest) {
  try {
    const { studentId, imageDataUrl, assignmentId, question } = await req.json()
    if (!studentId || !imageDataUrl) {
      return Response.json({ error: 'studentId and imageDataUrl required' }, { status: 400 })
    }

    const analysis = await analyzeHomeworkImage(imageDataUrl, question)

    // Save a HOMEWORK memory referencing this image
    const memory = await db.memory.create({
      data: {
        studentId,
        type: 'HOMEWORK',
        content: `Homework photo uploaded. Subject: ${analysis.subject}. Problem: ${analysis.problemText.slice(0, 220)}${analysis.problemText.length > 220 ? '…' : ''} Summary: ${analysis.summary}`,
        tags: [analysis.subject, ...analysis.topics].slice(0, 6).join(','),
        importance: 4,
        relatedAssignmentId: assignmentId ?? null,
      },
    })

    // Save a user chat message with the image attached so the tutor thread reflects it
    const chatMsg = await db.chatMessage.create({
      data: {
        studentId,
        role: 'user',
        content: question
          ? `📷 Uploaded homework (${analysis.subject}). ${question}`
          : `📷 Uploaded homework (${analysis.subject}). ${analysis.summary}`,
        imageUrl: imageDataUrl,
      },
    })

    // Gamification: streak + XP for homework scan (non-blocking)
    touchStreak(studentId)
      .then(({ streakBonus }) =>
        incrementCounter(studentId, 'totalHomework').then(() =>
          awardXp(studentId, 15 + streakBonus, { coins: 3, reason: 'homework' })
        )
      )
      .then((r) => notifyFamilyOfCelebration(studentId, r).catch(() => {}))
      .catch(() => {})

    return Response.json({ analysis, memoryId: memory.id, chatMessageId: chatMsg.id })
  } catch (e: any) {
    console.error('homework analyze error', e)
    return Response.json({ error: e?.message ?? 'unknown' }, { status: 500 })
  }
}
