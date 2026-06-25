'use client'

import { Brain } from 'lucide-react'
import { cn } from '@/lib/utils'

export function Logo({ className, size = 'md' }: { className?: string; size?: 'sm' | 'md' | 'lg' }) {
  const dims = size === 'sm' ? 'h-7 w-7' : size === 'lg' ? 'h-11 w-11' : 'h-9 w-9'
  const text = size === 'sm' ? 'text-lg' : size === 'lg' ? 'text-2xl' : 'text-xl'
  return (
    <div className={cn('flex items-center gap-2', className)}>
      <div
        className={cn(
          'relative grid place-items-center rounded-xl bg-primary text-primary-foreground shadow-sm',
          dims
        )}
      >
        <Brain className={size === 'sm' ? 'h-4 w-4' : 'h-5 w-5'} strokeWidth={2.2} />
        <span className="absolute -right-0.5 -top-0.5 h-2.5 w-2.5 rounded-full bg-[var(--mx-warm)] ring-2 ring-background" />
      </div>
      <span className={cn('font-bold tracking-tight', text)}>
        Memora<span className="text-primary">X</span>
      </span>
    </div>
  )
}
