'use client'

import { create } from 'zustand'
import { persist } from 'zustand/middleware'

export type Language = 'en' | 'es' | 'fr' | 'de' | 'zh' | 'ja' | 'it' | 'hi'

export const LANGUAGES: { code: Language; label: string; flag: string; nativeName: string }[] = [
  { code: 'en', label: 'English', flag: '🇬🇧', nativeName: 'English' },
  { code: 'es', label: 'Spanish', flag: '🇪🇸', nativeName: 'Español' },
  { code: 'fr', label: 'French', flag: '🇫🇷', nativeName: 'Français' },
  { code: 'de', label: 'German', flag: '🇩🇪', nativeName: 'Deutsch' },
  { code: 'zh', label: 'Mandarin', flag: '🇨🇳', nativeName: '中文' },
  { code: 'ja', label: 'Japanese', flag: '🇯🇵', nativeName: '日本語' },
  { code: 'it', label: 'Italian', flag: '🇮🇹', nativeName: 'Italiano' },
  { code: 'hi', label: 'Hindi', flag: '🇮🇳', nativeName: 'हिन्दी' },
]

interface I18nState {
  lang: Language
  setLang: (l: Language) => void
}

export const useI18n = create<I18nState>()(
  persist(
    (set) => ({
      lang: 'en',
      setLang: (lang) => set({ lang }),
    }),
    { name: 'memorax-lang' }
  )
)
