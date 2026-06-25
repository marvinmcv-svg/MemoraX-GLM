'use client'

import { cn } from '@/lib/utils'
import { getCosmetic } from '@/lib/gamify-catalog'

export interface AvatarConfig {
  scene: string
  character: string
  pet: string
  accessory: string
}

export function Avatar({
  config,
  size = 'md',
  className,
}: {
  config: AvatarConfig
  size?: 'sm' | 'md' | 'lg' | 'xl'
  className?: string
}) {
  const scene = getCosmetic(config.scene)
  const character = getCosmetic(config.character)
  const pet = getCosmetic(config.pet)
  const accessory = getCosmetic(config.accessory)

  const dims = size === 'sm' ? 'h-16 w-16' : size === 'md' ? 'h-28 w-28' : size === 'lg' ? 'h-40 w-40' : 'h-56 w-56'
  const charSize = size === 'sm' ? 'text-3xl' : size === 'md' ? 'text-5xl' : size === 'lg' ? 'text-7xl' : 'text-8xl'
  const petSize = size === 'sm' ? 'text-base' : size === 'md' ? 'text-2xl' : size === 'lg' ? 'text-3xl' : 'text-5xl'
  const accSize = size === 'sm' ? 'text-xs' : size === 'md' ? 'text-xl' : size === 'lg' ? 'text-2xl' : 'text-4xl'
  const decorSize = size === 'sm' ? 'text-[8px]' : size === 'md' ? 'text-sm' : size === 'lg' ? 'text-lg' : 'text-2xl'

  const gradient = scene?.gradient ?? 'from-amber-100 to-orange-200'
  const decor = scene?.decor ?? []

  return (
    <div
      className={cn(
        'relative rounded-2xl overflow-hidden bg-gradient-to-br shadow-inner',
        gradient,
        dims,
        className
      )}
      role="img"
      aria-label={`Avatar with ${character?.name ?? 'student'} in ${scene?.name ?? 'bedroom'} scene${pet && pet.id !== 'none' ? ` with ${pet.name} pet` : ''}`}
    >
      {decor.map((d, i) => (
        <span
          key={i}
          className={cn('absolute opacity-70 select-none', decorSize)}
          style={{
            top: `${[8, 12, 6][i % 3]}%`,
            left: `${[6, 78, 88][i % 3]}%`,
            transform: `rotate(${[-12, 8, -5][i % 3]}deg)`,
          }}
        >
          {d}
        </span>
      ))}

      {accessory && accessory.id !== 'none_acc' && accessory.emoji && (
        <span className={cn('absolute top-1 right-1 drop-shadow', accSize)} style={{ transform: 'rotate(8deg)' }}>
          {accessory.emoji}
        </span>
      )}

      <div className="absolute inset-0 flex items-center justify-center">
        <span className={cn(charSize, 'drop-shadow-md select-none')} style={{ transform: 'translateY(-4%)' }}>
          {character?.emoji ?? '🧑‍🎓'}
        </span>
      </div>

      {pet && pet.id !== 'none' && pet.emoji && (
        <span className={cn('absolute bottom-1 right-1 drop-shadow', petSize)} style={{ transform: 'translateY(8%)' }}>
          {pet.emoji}
        </span>
      )}

      {size !== 'sm' && scene && scene.id !== 'bedroom' && (
        <span className={cn('absolute bottom-1 left-1 opacity-50', decorSize)}>{scene.emoji}</span>
      )}
    </div>
  )
}

export function RarityBadge({ rarity }: { rarity: string }) {
  const colors: Record<string, string> = {
    common: 'bg-slate-100 text-slate-600 dark:bg-slate-200/20 dark:text-slate-300',
    rare: 'bg-sky-100 text-sky-700 dark:bg-sky-200/20 dark:text-sky-300',
    epic: 'bg-fuchsia-100 text-fuchsia-700 dark:bg-fuchsia-200/20 dark:text-fuchsia-300',
    legendary: 'bg-amber-100 text-amber-700 dark:bg-amber-200/20 dark:text-amber-300',
  }
  return (
    <span className={cn('text-[10px] font-medium px-1.5 py-0.5 rounded-full capitalize', colors[rarity] ?? colors.common)}>
      {rarity}
    </span>
  )
}
