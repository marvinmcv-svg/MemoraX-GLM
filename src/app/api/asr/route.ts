import { NextRequest, NextResponse } from 'next/server'
import { getZAI } from '@/lib/ai'

export const dynamic = 'force-dynamic'

// POST /api/asr — transcribe a voice note (base64 audio) to text
// body: { audio: <base64 data URL or raw base64> }
// returns: { text }
export async function POST(req: NextRequest) {
  try {
    const { audio } = await req.json()
    if (!audio) {
      return NextResponse.json({ error: 'audio required' }, { status: 400 })
    }

    // strip data URL prefix if present ("data:audio/webm;base64,XXXX")
    const base64 = audio.includes(',') ? audio.split(',')[1] : audio

    const zai = await getZAI()
    const response: any = await zai.audio.asr.create({
      file_base64: base64,
    })

    const text = response?.text ?? ''
    if (!text || !text.trim()) {
      return NextResponse.json({ error: 'Could not transcribe — try speaking again.' }, { status: 422 })
    }
    return NextResponse.json({ text: text.trim() })
  } catch (e: any) {
    console.error('asr error', e)
    return NextResponse.json({ error: e?.message ?? 'transcription failed' }, { status: 500 })
  }
}
