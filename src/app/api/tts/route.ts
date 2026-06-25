import { NextRequest, NextResponse } from 'next/server'
import { getZAI } from '@/lib/ai'

export const dynamic = 'force-dynamic'

// POST /api/tts — convert text to a WAV audio response (streamed back as binary)
// body: { text, voice?, speed? }
// returns: audio/wav binary
const VOICES = ['tongtong', 'chuichui', 'xiaochen', 'jam', 'kazi', 'douji', 'luodo'] as const

export async function POST(req: NextRequest) {
  try {
    const { text, voice = 'tongtong', speed = 1.0 } = await req.json()
    if (!text || !text.trim()) {
      return NextResponse.json({ error: 'text required' }, { status: 400 })
    }
    // TTS API limit is 1024 chars; truncate to keep a single request
    const clean = text.replace(/\s+/g, ' ').trim().slice(0, 1000)
    const v = (VOICES as readonly string[]).includes(voice) ? voice : 'tongtong'
    const s = Math.min(2, Math.max(0.5, Number(speed) || 1.0))

    const zai = await getZAI()
    const response: any = await zai.audio.tts.create({
      input: clean,
      voice: v,
      speed: s,
      response_format: 'wav',
      stream: false,
    })

    const arrayBuffer = await response.arrayBuffer()
    const buffer = Buffer.from(new Uint8Array(arrayBuffer))

    return new NextResponse(buffer, {
      status: 200,
      headers: {
        'Content-Type': 'audio/wav',
        'Content-Length': buffer.length.toString(),
        'Cache-Control': 'no-cache',
      },
    })
  } catch (e: any) {
    console.error('tts error', e)
    return NextResponse.json({ error: e?.message ?? 'tts failed' }, { status: 500 })
  }
}
