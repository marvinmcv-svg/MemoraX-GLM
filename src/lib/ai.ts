import 'server-only'
import ZAI from 'z-ai-web-dev-sdk'

// Singleton ZAI instance
let _zai: Awaited<ReturnType<typeof ZAI.create>> | null = null
export async function getZAI() {
  if (!_zai) _zai = await ZAI.create()
  return _zai
}

export interface ChatTurn {
  role: 'system' | 'user' | 'assistant'
  content: string
}

/**
 * Stream a tutor chat completion. Yields text deltas.
 * The z-ai SDK returns a Web ReadableStream when stream:true — we read it
 * and parse OpenAI-style SSE chunks (data: {"choices":[{"delta":{"content":...}}]}).
 */
export async function* streamChat(
  messages: ChatTurn[],
  opts: { signal?: AbortSignal } = {}
): AsyncGenerator<string> {
  const zai = await getZAI()
  const result: any = await zai.chat.completions.create({
    messages: messages as any,
    stream: true,
    thinking: { type: 'disabled' },
  } as any)

  // If the SDK returned a plain object (non-streaming fallback), yield its content.
  if (result && typeof result === 'object' && !result.getReader && !result[Symbol.asyncIterator]) {
    const text = result?.choices?.[0]?.message?.content
    if (typeof text === 'string' && text.length > 0) yield text
    return
  }

  // Web ReadableStream path
  let reader: ReadableStreamDefaultReader<Uint8Array> | null = null
  if (result && typeof result.getReader === 'function') {
    reader = result.getReader()
  } else if (result && typeof result[Symbol.asyncIterator] === 'function') {
    // async-iterable fallback
    for await (const chunk of result as AsyncIterable<any>) {
      if (opts.signal?.aborted) break
      const delta = chunk?.choices?.[0]?.delta?.content
      if (typeof delta === 'string' && delta.length > 0) yield delta
    }
    return
  }

  if (!reader) {
    // last-resort: treat as object
    const text = result?.choices?.[0]?.message?.content
    if (typeof text === 'string') yield text
    return
  }

  const decoder = new TextDecoder()
  let buffer = ''
  try {
    while (true) {
      if (opts.signal?.aborted) break
      const { done, value } = await reader.read()
      if (done) break
      buffer += decoder.decode(value, { stream: true })
      const lines = buffer.split('\n')
      buffer = lines.pop() ?? ''
      for (const raw of lines) {
        const line = raw.trim()
        if (!line || !line.startsWith('data:')) continue
        const payload = line.slice(5).trim()
        if (payload === '[DONE]') return
        try {
          const parsed = JSON.parse(payload)
          const delta = parsed?.choices?.[0]?.delta?.content
          if (typeof delta === 'string' && delta.length > 0) {
            yield delta
          }
        } catch {
          // partial JSON — skip; will be completed on next chunk
        }
      }
    }
  } finally {
    try {
      reader.releaseLock()
    } catch {
      /* noop */
    }
  }
}

/**
 * Non-streaming chat (for short structured calls, e.g. memory extraction).
 */
export async function chatOnce(
  messages: ChatTurn[],
  opts: { thinking?: boolean } = {}
): Promise<string> {
  const zai = await getZAI()
  const completion = await zai.chat.completions.create({
    messages: messages as any,
    thinking: opts.thinking ? { type: 'enabled' } : { type: 'disabled' },
  } as any)
  return completion?.choices?.[0]?.message?.content ?? ''
}

/**
 * Analyze a homework image (base64 data URL) and return a structured read.
 * Returns: { problemText, subject, topics[], difficulty, hint }
 */
export async function analyzeHomeworkImage(
  imageDataUrl: string,
  studentQuestion?: string
): Promise<{
  problemText: string
  subject: string
  topics: string[]
  difficulty: 'easy' | 'medium' | 'hard'
  summary: string
}> {
  const zai = await getZAI()
  const prompt = `You are looking at a student's homework. Carefully read the problem(s) shown.
Return STRICT JSON only (no markdown fences) with this exact shape:
{
  "problemText": "the full text of the problem(s) as written, transcribed faithfully",
  "subject": "best-guess school subject (e.g. Math, Science, English, History)",
  "topics": ["2-4 specific topic tags"],
  "difficulty": "easy | medium | hard",
  "summary": "one sentence describing what the student is being asked to do"
}
${studentQuestion ? `Student note: ${studentQuestion}` : ''}`

  const response = await zai.chat.completions.createVision({
    messages: [
      {
        role: 'user',
        content: [
          { type: 'text', text: prompt },
          { type: 'image_url', image_url: { url: imageDataUrl } },
        ],
      },
    ],
    thinking: { type: 'disabled' },
  } as any)

  const raw = response?.choices?.[0]?.message?.content ?? ''
  // extract JSON even if wrapped in fences
  const match = raw.match(/\{[\s\S]*\}/)
  if (match) {
    try {
      return JSON.parse(match[0])
    } catch {
      /* fall through */
    }
  }
  return {
    problemText: raw.slice(0, 600),
    subject: 'General',
    topics: [],
    difficulty: 'medium',
    summary: raw.slice(0, 200),
  }
}
