'use client'

import * as React from 'react'

interface UseVoiceNotesOptions {
  onTranscribed: (text: string) => void
  onError?: (msg: string) => void
}

/**
 * Browser voice-note recording via MediaRecorder.
 * record() starts capture; stop() ends it and POSTs the audio to /api/asr.
 */
export function useVoiceNotes({ onTranscribed, onError }: UseVoiceNotesOptions) {
  const [recording, setRecording] = React.useState(false)
  const [transcribing, setTranscribing] = React.useState(false)
  const [seconds, setSeconds] = React.useState(0)
  const mediaRef = React.useRef<MediaRecorder | null>(null)
  const chunksRef = React.useRef<BlobPart[]>([])
  const streamRef = React.useRef<MediaStream | null>(null)
  const timerRef = React.useRef<ReturnType<typeof setInterval> | null>(null)

  const cleanup = React.useCallback(() => {
    if (timerRef.current) {
      clearInterval(timerRef.current)
      timerRef.current = null
    }
    streamRef.current?.getTracks().forEach((t) => t.stop())
    streamRef.current = null
    mediaRef.current = null
    chunksRef.current = []
    setSeconds(0)
  }, [])

  const record = React.useCallback(async () => {
    try {
      if (!navigator.mediaDevices?.getUserMedia) {
        onError?.('Voice notes need microphone access. Try a different browser.')
        return
      }
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true })
      streamRef.current = stream
      const mime = MediaRecorder.isTypeSupported('audio/webm;codecs=opus')
        ? 'audio/webm;codecs=opus'
        : MediaRecorder.isTypeSupported('audio/webm')
        ? 'audio/webm'
        : ''
      const mr = new MediaRecorder(stream, mime ? { mimeType: mime } : undefined)
      mediaRef.current = mr
      chunksRef.current = []
      mr.ondataavailable = (e) => {
        if (e.data.size > 0) chunksRef.current.push(e.data)
      }
      mr.start()
      setRecording(true)
      setSeconds(0)
      timerRef.current = setInterval(() => setSeconds((s) => s + 1), 1000)
    } catch (e: any) {
      onError?.(e?.name === 'NotAllowedError' ? 'Microphone permission denied.' : 'Could not start recording.')
    }
  }, [onError])

  const stop = React.useCallback(async () => {
    const mr = mediaRef.current
    if (!mr) return
    setRecording(false)
    if (timerRef.current) {
      clearInterval(timerRef.current)
      timerRef.current = null
    }
    await new Promise<void>((resolve) => {
      mr.onstop = () => resolve()
      if (mr.state !== 'inactive') mr.stop()
      else resolve()
    })

    const blob = new Blob(chunksRef.current, { type: mr.mimeType || 'audio/webm' })
    cleanup()

    if (blob.size === 0) {
      onError?.('Recording was empty. Try again.')
      return
    }
    if (blob.size > 8_000_000) {
      onError?.('Voice note too long (max ~8MB). Keep it under a minute.')
      return
    }

    setTranscribing(true)
    try {
      const reader = new FileReader()
      const dataUrl: string = await new Promise((resolve, reject) => {
        reader.onload = () => resolve(reader.result as string)
        reader.onerror = reject
        reader.readAsDataURL(blob)
      })
      const res = await fetch('/api/asr', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ audio: dataUrl }),
      })
      const data = await res.json()
      if (!res.ok) throw new Error(data.error || 'transcription failed')
      if (data.text) onTranscribed(data.text)
    } catch (e: any) {
      onError?.(e?.message || 'Could not transcribe your voice note.')
    } finally {
      setTranscribing(false)
    }
  }, [cleanup, onTranscribed, onError])

  const cancel = React.useCallback(() => {
    const mr = mediaRef.current
    if (mr && mr.state !== 'inactive') mr.stop()
    setRecording(false)
    cleanup()
  }, [cleanup])

  React.useEffect(() => () => cleanup(), [cleanup])

  return { recording, transcribing, seconds, record, stop, cancel }
}
