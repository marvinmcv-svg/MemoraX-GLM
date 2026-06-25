'use client'

import * as React from 'react'

/**
 * TTS playback for a given text. Caches audio per text so re-clicks are instant.
 */
export function useTTS() {
  const [loading, setLoading] = React.useState(false)
  const [playingId, setPlayingId] = React.useState<string | null>(null)
  const cacheRef = React.useRef<Map<string, string>>(new Map())
  const audioRef = React.useRef<HTMLAudioElement | null>(null)

  const speak = React.useCallback(async (id: string, text: string) => {
    if (!text.trim()) return
    // stop current playback if toggling the same one
    if (playingId === id && audioRef.current) {
      audioRef.current.pause()
      setPlayingId(null)
      return
    }
    // stop any existing
    if (audioRef.current) {
      audioRef.current.pause()
      audioRef.current = null
    }

    let url = cacheRef.current.get(id)
    if (!url) {
      setLoading(true)
      try {
        const res = await fetch('/api/tts', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ text }),
        })
        if (!res.ok) throw new Error('tts failed')
        const blob = await res.blob()
        url = URL.createObjectURL(blob)
        cacheRef.current.set(id, url)
      } catch {
        setLoading(false)
        throw new Error('Could not generate audio.')
      } finally {
        setLoading(false)
      }
    }

    const audio = new Audio(url)
    audioRef.current = audio
    audio.onended = () => setPlayingId(null)
    audio.onerror = () => setPlayingId(null)
    setPlayingId(id)
    audio.play().catch(() => setPlayingId(null))
  }, [playingId])

  const stop = React.useCallback(() => {
    if (audioRef.current) {
      audioRef.current.pause()
      audioRef.current = null
    }
    setPlayingId(null)
  }, [])

  return { speak, stop, loading, playingId }
}
