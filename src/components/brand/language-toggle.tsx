'use client'

import * as React from 'react'
import { Check, Globe, ChevronDown } from 'lucide-react'
import { useI18n, LANGUAGES, type Language } from '@/lib/i18n-store'
import { cn } from '@/lib/utils'

export function LanguageToggle({ compact = false }: { compact?: boolean }) {
  const { lang, setLang } = useI18n()
  const [open, setOpen] = React.useState(false)
  const ref = React.useRef<HTMLDivElement>(null)

  const current = LANGUAGES.find((l) => l.code === lang) ?? LANGUAGES[0]

  React.useEffect(() => {
    if (!open) return
    const handler = (e: MouseEvent) => {
      if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false)
    }
    document.addEventListener('mousedown', handler)
    return () => document.removeEventListener('mousedown', handler)
  }, [open])

  return (
    <div ref={ref} className="relative">
      <button
        onClick={() => setOpen((o) => !o)}
        className={cn(
          'inline-flex items-center gap-1.5 rounded-lg px-2.5 py-1.5 text-sm font-medium transition-colors',
          'hover:bg-muted focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring',
          open && 'bg-muted'
        )}
        aria-label="Change language"
        aria-expanded={open}
      >
        <Globe className="h-4 w-4" />
        {!compact && <span className="hidden sm:inline">{current.nativeName}</span>}
        {compact && <span className="text-base">{current.flag}</span>}
        <ChevronDown className={cn('h-3 w-3 transition-transform', open && 'rotate-180')} />
      </button>

      {open && (
        <div className="absolute right-0 top-full mt-1 w-44 rounded-lg border border-border bg-card shadow-lg z-50 py-1 overflow-hidden">
          {LANGUAGES.map((l) => (
            <button
              key={l.code}
              onClick={() => {
                setLang(l.code as Language)
                setOpen(false)
              }}
              className={cn(
                'w-full flex items-center gap-2.5 px-3 py-2 text-sm transition-colors text-left',
                'hover:bg-muted',
                lang === l.code && 'bg-primary/5'
              )}
            >
              <span className="text-base shrink-0">{l.flag}</span>
              <span className="flex-1 truncate">{l.nativeName}</span>
              {lang === l.code && <Check className="h-3.5 w-3.5 text-primary shrink-0" />}
            </button>
          ))}
        </div>
      )}
    </div>
  )
}
