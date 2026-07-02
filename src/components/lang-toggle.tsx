'use client'

import { Languages } from 'lucide-react'
import { useLang, type Lang } from '@/lib/i18n'
import { cn } from '@/lib/utils'

/**
 * ES/EN language toggle. A compact segmented control with a globe icon.
 * Spanish is the default (Bolivia launch). Selection persists via localStorage.
 */
export function LangToggle({ className }: { className?: string }) {
  const { lang, setLang } = useLang()
  const options: { id: Lang; label: string }[] = [
    { id: 'es', label: 'ES' },
    { id: 'en', label: 'EN' },
  ]
  return (
    <div
      className={cn(
        'inline-flex items-center rounded-lg border border-border/60 bg-card p-0.5 gap-0.5',
        className
      )}
      role="group"
      aria-label="Language"
    >
      <Languages className="h-3.5 w-3.5 text-muted-foreground mx-1" aria-hidden="true" />
      {options.map((o) => (
        <button
          key={o.id}
          onClick={() => setLang(o.id)}
          aria-pressed={lang === o.id}
          className={cn(
            'px-2 py-1 rounded-md text-xs font-medium transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring',
            lang === o.id
              ? 'bg-primary text-primary-foreground'
              : 'text-muted-foreground hover:text-foreground hover:bg-muted'
          )}
        >
          {o.label}
        </button>
      ))}
    </div>
  )
}
