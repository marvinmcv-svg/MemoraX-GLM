'use client'

import { cn } from '@/lib/utils'
import { getCosmetic } from '@/lib/gamify-catalog'

export interface RobloxAvatarConfig {
  skinTone: string
  face: string
  hat: string
  shirt: string
  pants: string
  tool: string
  scene: string
}

// SVG dimension constants (classic R6 proportions)
const HEAD_W = 64
const HEAD_H = 56
const TORSO_W = 56
const TORSO_H = 56
const ARM_W = 22
const ARM_H = 56
const LEG_W = 26
const LEG_H = 56

export function RobloxAvatar({
  config,
  size = 'md',
  className,
}: {
  config: RobloxAvatarConfig
  size?: 'sm' | 'md' | 'lg' | 'xl'
  className?: string
}) {
  const skin = SKIN_TONES[config.skinTone] ?? SKIN_TONES.tone1
  const shirt = SHIRT_COLORS[config.shirt] ?? SHIRT_COLORS.default_shirt
  const pants = PANTS_COLORS[config.pants] ?? PANTS_COLORS.default_pants

  const dims = size === 'sm' ? 'h-24 w-20' : size === 'md' ? 'h-40 w-32' : size === 'lg' ? 'h-56 w-44' : 'h-72 w-56'
  const scene = getCosmetic(config.scene)
  const gradient = scene?.gradient ?? 'from-amber-100 to-orange-200'
  const decor = scene?.decor ?? []

  // SVG viewBox: 200 wide x 320 tall
  const centerX = 100
  const headY = 20
  const torsoY = headY + HEAD_H + 4
  const legY = torsoY + TORSO_H + 4
  const armY = torsoY

  return (
    <div
      className={cn(
        'relative rounded-2xl overflow-hidden bg-gradient-to-br shadow-inner',
        gradient,
        dims,
        className
      )}
      role="img"
      aria-label="Customizable avatar"
    >
      {/* Scene decor */}
      {decor.map((d, i) => (
        <span
          key={i}
          className="absolute opacity-60 select-none text-xs sm:text-sm"
          style={{
            top: `${[6, 10, 85][i % 3]}%`,
            left: `${[8, 85, 90][i % 3]}%`,
          }}
        >
          {d}
        </span>
      ))}

      <svg
        viewBox="0 0 200 320"
        className="absolute inset-0 w-full h-full"
        preserveAspectRatio="xMidYMax meet"
      >
        {/* Shadow under character */}
        <ellipse cx={centerX} cy={310} rx={50} ry={6} fill="rgba(0,0,0,0.12)" />

        {/* Left arm */}
        <rect
          x={centerX - TORSO_W / 2 - ARM_W - 2}
          y={armY}
          width={ARM_W}
          height={ARM_H}
          rx={4}
          fill={shirt.color}
          stroke="rgba(0,0,0,0.1)"
          strokeWidth={1}
        />
        {/* Left hand */}
        <rect
          x={centerX - TORSO_W / 2 - ARM_W - 2}
          y={armY + ARM_H - 2}
          width={ARM_W}
          height={16}
          rx={4}
          fill={skin.color}
        />

        {/* Right arm */}
        <rect
          x={centerX + TORSO_W / 2 + 2}
          y={armY}
          width={ARM_W}
          height={ARM_H}
          rx={4}
          fill={shirt.color}
          stroke="rgba(0,0,0,0.1)"
          strokeWidth={1}
        />
        {/* Right hand */}
        <rect
          x={centerX + TORSO_W / 2 + 2}
          y={armY + ARM_H - 2}
          width={ARM_W}
          height={16}
          rx={4}
          fill={skin.color}
        />

        {/* Legs */}
        <rect
          x={centerX - LEG_W - 1}
          y={legY}
          width={LEG_W}
          height={LEG_H}
          rx={3}
          fill={pants.color}
          stroke="rgba(0,0,0,0.1)"
          strokeWidth={1}
        />
        <rect
          x={centerX + 1}
          y={legY}
          width={LEG_W}
          height={LEG_H}
          rx={3}
          fill={pants.color}
          stroke="rgba(0,0,0,0.1)"
          strokeWidth={1}
        />
        {/* Shoes */}
        <rect x={centerX - LEG_W - 1} y={legY + LEG_H - 8} width={LEG_W} height={10} rx={3} fill="#2a2a2a" />
        <rect x={centerX + 1} y={legY + LEG_H - 8} width={LEG_W} height={10} rx={3} fill="#2a2a2a" />

        {/* Torso */}
        <rect
          x={centerX - TORSO_W / 2}
          y={torsoY}
          width={TORSO_W}
          height={TORSO_H}
          rx={5}
          fill={shirt.color}
          stroke="rgba(0,0,0,0.1)"
          strokeWidth={1}
        />
        {/* Shirt pattern overlay */}
        {shirt.pattern === 'stripes' && (
          <>
            <rect x={centerX - TORSO_W / 2} y={torsoY + 8} width={TORSO_W} height={4} fill="rgba(255,255,255,0.25)" />
            <rect x={centerX - TORSO_W / 2} y={torsoY + 20} width={TORSO_W} height={4} fill="rgba(255,255,255,0.25)" />
            <rect x={centerX - TORSO_W / 2} y={torsoY + 32} width={TORSO_W} height={4} fill="rgba(255,255,255,0.25)" />
            <rect x={centerX - TORSO_W / 2} y={torsoY + 44} width={TORSO_W} height={4} fill="rgba(255,255,255,0.25)" />
          </>
        )}
        {shirt.pattern === 'star' && (
          <text x={centerX} y={torsoY + TORSO_H / 2 + 6} textAnchor="middle" fontSize="24" fill="rgba(255,255,255,0.8)">⭐</text>
        )}
        {shirt.pattern === 'lightning' && (
          <text x={centerX} y={torsoY + TORSO_H / 2 + 6} textAnchor="middle" fontSize="22" fill="rgba(255,255,0,0.9)">⚡</text>
        )}

        {/* Head */}
        <rect
          x={centerX - HEAD_W / 2}
          y={headY}
          width={HEAD_W}
          height={HEAD_H}
          rx={8}
          fill={skin.color}
          stroke="rgba(0,0,0,0.08)"
          strokeWidth={1}
        />

        {/* Face */}
        <FaceSVG face={config.face} cx={centerX} cy={headY + HEAD_H / 2} />

        {/* Hat */}
        <HatSVG hat={config.hat} cx={centerX} topY={headY} headW={HEAD_W} skinColor={skin.color} />

        {/* Accessory on face (glasses etc.) — uses config.hat slot for backward compat or separate */}
        {/* Tool in right hand */}
        <ToolSVG tool={config.tool} x={centerX + TORSO_W / 2 + 2 + ARM_W / 2} y={armY + ARM_H - 10} />
      </svg>

      {/* Pet (still emoji for now, bottom-right) */}
      <PetEmoji scene={config.scene} />
    </div>
  )
}

// ---------- Skin tones ----------
export const SKIN_TONES: Record<string, { color: string; name: string }> = {
  tone1: { color: '#fdbcb4', name: 'Light' },
  tone2: { color: '#e8b48d', name: 'Medium Light' },
  tone3: { color: '#c68642', name: 'Medium' },
  tone4: { color: '#8d5524', name: 'Medium Dark' },
  tone5: { color: '#5c3317', name: 'Dark' },
  tone6: { color: '#3b2613', name: 'Deep' },
  green: { color: '#7cc043', name: 'Alien Green' },
  blue: { color: '#5b9bd5', name: 'Sky Blue' },
  purple: { color: '#b084cc', name: 'Galaxy Purple' },
  robot: { color: '#9ca3af', name: 'Robot Grey' },
}

// ---------- Shirt colors ----------
export const SHIRT_COLORS: Record<string, { color: string; name: string; pattern?: 'stripes' | 'star' | 'lightning' }> = {
  default_shirt: { color: '#10b981', name: 'Emerald Tee' },
  red_shirt: { color: '#ef4444', name: 'Red Tee' },
  orange_shirt: { color: '#f97316', name: 'Orange Tee' },
  yellow_shirt: { color: '#facc15', name: 'Sunny Yellow' },
  purple_shirt: { color: '#a855f7', name: 'Purple Tee' },
  pink_shirt: { color: '#ec4899', name: 'Pink Tee' },
  black_shirt: { color: '#1f2937', name: 'Midnight Black' },
  white_shirt: { color: '#f3f4f6', name: 'Classic White' },
  striped_shirt: { color: '#3b82f6', name: 'Striped Jersey', pattern: 'stripes' },
  star_shirt: { color: '#7c3aed', name: 'Star Shirt', pattern: 'star' },
  lightning_shirt: { color: '#0ea5e9', name: 'Lightning Bolt', pattern: 'lightning' },
  tuxedo: { color: '#111827', name: 'Tuxedo' },
  hoodie: { color: '#6366f1', name: 'Cool Hoodie' },
  jersey: { color: '#dc2626', name: 'Sports Jersey', pattern: 'stripes' },
  rainbow_shirt: { color: '#f59e0b', name: 'Golden Armor', pattern: 'star' },
}

// ---------- Pants colors ----------
export const PANTS_COLORS: Record<string, { color: string; name: string }> = {
  default_pants: { color: '#374151', name: 'Dark Jeans' },
  blue_jeans: { color: '#3b82f6', name: 'Blue Jeans' },
  khaki_pants: { color: '#d4a574', name: 'Khaki Pants' },
  black_pants: { color: '#1f2937', name: 'Black Pants' },
  shorts: { color: '#60a5fa', name: 'Blue Shorts' },
  sweatpants: { color: '#6b7280', name: 'Grey Sweatpants' },
  red_pants: { color: '#dc2626', name: 'Red Pants' },
  green_pants: { color: '#16a34a', name: 'Forest Pants' },
  purple_pants: { color: '#7c3aed', name: 'Royal Pants' },
  pink_pants: { color: '#ec4899', name: 'Pink Pants' },
}

// ---------- Face SVG ----------
function FaceSVG({ face, cx, cy }: { face: string; cx: number; cy: number }) {
  const eyeY = cy - 4
  const mouthY = cy + 12

  switch (face) {
    case 'happy':
      return (
        <g>
          <circle cx={cx - 12} cy={eyeY} r={4} fill="#1f2937" />
          <circle cx={cx + 12} cy={eyeY} r={4} fill="#1f2937" />
          <path d={`M ${cx - 8} ${mouthY} Q ${cx} ${mouthY + 6} ${cx + 8} ${mouthY}`} stroke="#1f2937" strokeWidth={2.5} fill="none" strokeLinecap="round" />
        </g>
      )
    case 'cool':
      return (
        <g>
          <rect x={cx - 20} y={eyeY - 5} width={16} height={10} rx={3} fill="#1f2937" />
          <rect x={cx + 4} y={eyeY - 5} width={16} height={10} rx={3} fill="#1f2937" />
          <rect x={cx - 4} y={eyeY - 2} width={8} height={2} fill="#1f2937" />
          <path d={`M ${cx - 6} ${mouthY} Q ${cx} ${mouthY + 4} ${cx + 6} ${mouthY}`} stroke="#1f2937" strokeWidth={2} fill="none" strokeLinecap="round" />
        </g>
      )
    case 'focused':
      return (
        <g>
          <rect x={cx - 16} y={eyeY - 2} width={8} height={4} rx={1} fill="#1f2937" />
          <rect x={cx + 8} y={eyeY - 2} width={8} height={4} rx={1} fill="#1f2937" />
          <rect x={cx - 4} y={mouthY} width={8} height={3} rx={1} fill="#1f2937" />
        </g>
      )
    case 'winky':
      return (
        <g>
          <circle cx={cx - 12} cy={eyeY} r={4} fill="#1f2937" />
          <path d={`M ${cx + 6} ${eyeY} Q ${cx + 12} ${eyeY - 3} ${cx + 18} ${eyeY}`} stroke="#1f2937" strokeWidth={2.5} fill="none" strokeLinecap="round" />
          <path d={`M ${cx - 8} ${mouthY} Q ${cx} ${mouthY + 6} ${cx + 8} ${mouthY}`} stroke="#1f2937" strokeWidth={2.5} fill="none" strokeLinecap="round" />
        </g>
      )
    case 'silly':
      return (
        <g>
          <circle cx={cx - 12} cy={eyeY} r={4} fill="#1f2937" />
          <path d={`M ${cx + 8} ${eyeY - 2} L ${cx + 16} ${eyeY + 2} L ${cx + 8} ${eyeY + 2} Z`} fill="#1f2937" />
          <path d={`M ${cx - 8} ${mouthY} Q ${cx} ${mouthY + 8} ${cx + 8} ${mouthY}`} stroke="#1f2937" strokeWidth={2.5} fill="#ef4444" strokeLinecap="round" />
          <ellipse cx={cx + 2} cy={mouthY + 6} rx={3} ry={4} fill="#ef4444" />
        </g>
      )
    case 'sleepy':
      return (
        <g>
          <path d={`M ${cx - 16} ${eyeY} Q ${cx - 12} ${eyeY + 3} ${cx - 8} ${eyeY}`} stroke="#1f2937" strokeWidth={2} fill="none" strokeLinecap="round" />
          <path d={`M ${cx + 8} ${eyeY} Q ${cx + 12} ${eyeY + 3} ${cx + 16} ${eyeY}`} stroke="#1f2937" strokeWidth={2} fill="none" strokeLinecap="round" />
          <ellipse cx={cx} cy={mouthY + 1} rx={4} ry={3} fill="#1f2937" />
        </g>
      )
    case 'love':
      return (
        <g>
          <text x={cx - 12} y={eyeY + 5} textAnchor="middle" fontSize="12" fill="#ef4444">❤</text>
          <text x={cx + 12} y={eyeY + 5} textAnchor="middle" fontSize="12" fill="#ef4444">❤</text>
          <path d={`M ${cx - 8} ${mouthY} Q ${cx} ${mouthY + 6} ${cx + 8} ${mouthY}`} stroke="#1f2937" strokeWidth={2.5} fill="none" strokeLinecap="round" />
        </g>
      )
    case 'robot':
      return (
        <g>
          <rect x={cx - 18} y={eyeY - 4} width={12} height={8} rx={1} fill="#06b6d4" stroke="#1f2937" strokeWidth={1} />
          <rect x={cx + 6} y={eyeY - 4} width={12} height={8} rx={1} fill="#06b6d4" stroke="#1f2937" strokeWidth={1} />
          <rect x={cx - 10} y={mouthY} width={20} height={4} rx={1} fill="#1f2937" />
          <rect x={cx - 8} y={mouthY} width={3} height={4} fill="#06b6d4" />
          <rect x={cx - 1} y={mouthY} width={3} height={4} fill="#06b6d4" />
          <rect x={cx + 6} y={mouthY} width={3} height={4} fill="#06b6d4" />
        </g>
      )
    case 'angry':
      return (
        <g>
          <path d={`M ${cx - 18} ${eyeY - 6} L ${cx - 8} ${eyeY - 2}`} stroke="#1f2937" strokeWidth={2.5} strokeLinecap="round" />
          <path d={`M ${cx + 8} ${eyeY - 2} L ${cx + 18} ${eyeY - 6}`} stroke="#1f2937" strokeWidth={2.5} strokeLinecap="round" />
          <circle cx={cx - 12} cy={eyeY + 1} r={3} fill="#1f2937" />
          <circle cx={cx + 12} cy={eyeY + 1} r={3} fill="#1f2937" />
          <path d={`M ${cx - 6} ${mouthY + 4} Q ${cx} ${mouthY} ${cx + 6} ${mouthY + 4}`} stroke="#1f2937" strokeWidth={2.5} fill="none" strokeLinecap="round" />
        </g>
      )
    default:
      return <FaceSVG face="happy" cx={cx} cy={cy} />
  }
}

// ---------- Hat SVG ----------
function HatSVG({ hat, cx, topY, headW, skinColor }: { hat: string; cx: number; topY: number; headW: number; skinColor: string }) {
  const hatTop = topY - 2
  switch (hat) {
    case 'none_hat':
      return null
    case 'cap':
      return (
        <g>
          <path d={`M ${cx - headW / 2} ${hatTop + 6} Q ${cx} ${hatTop - 14} ${cx + headW / 2} ${hatTop + 6} L ${cx + headW / 2 + 4} ${hatTop + 6} L ${cx + headW / 2 + 4} ${hatTop + 10} L ${cx - headW / 2} ${hatTop + 10} Z`} fill="#dc2626" />
          <ellipse cx={cx} cy={hatTop + 8} rx={headW / 2} ry={6} fill="#991b1b" />
        </g>
      )
    case 'beanie':
      return (
        <g>
          <path d={`M ${cx - headW / 2} ${hatTop + 8} Q ${cx} ${hatTop - 16} ${cx + headW / 2} ${hatTop + 8} Z`} fill="#3b82f6" />
          <ellipse cx={cx} cy={hatTop + 8} rx={headW / 2} ry={5} fill="#1e40af" />
          <circle cx={cx} cy={hatTop - 14} r={5} fill="#60a5fa" />
        </g>
      )
    case 'crown':
      return (
        <g>
          <path d={`M ${cx - headW / 2 + 4} ${hatTop + 4} L ${cx - headW / 2 + 4} ${hatTop - 12} L ${cx - 10} ${hatTop - 4} L ${cx} ${hatTop - 18} L ${cx + 10} ${hatTop - 4} L ${cx + headW / 2 - 4} ${hatTop - 12} L ${cx + headW / 2 - 4} ${hatTop + 4} Z`} fill="#fbbf24" stroke="#d97706" strokeWidth={1.5} />
          <circle cx={cx} cy={hatTop - 14} r={3} fill="#ef4444" />
          <circle cx={cx - 14} cy={hatTop - 6} r={2} fill="#3b82f6" />
          <circle cx={cx + 14} cy={hatTop - 6} r={2} fill="#3b82f6" />
        </g>
      )
    case 'wizard_hat':
      return (
        <g>
          <path d={`M ${cx - headW / 2 + 2} ${hatTop + 6} L ${cx + 8} ${hatTop - 28} L ${cx + headW / 2 - 2} ${hatTop + 6} Z`} fill="#4c1d95" />
          <ellipse cx={cx} cy={hatTop + 6} rx={headW / 2} ry={5} fill="#312e81" />
          <text x={cx + 2} y={hatTop - 8} textAnchor="middle" fontSize="12" fill="#fbbf24">⭐</text>
        </g>
      )
    case 'graduation_cap':
      return (
        <g>
          <path d={`M ${cx - headW / 2 + 2} ${hatTop + 4} L ${cx} ${hatTop - 8} L ${cx + headW / 2 - 2} ${hatTop + 4} Z`} fill="#1f2937" />
          <rect x={cx - headW / 2 + 4} y={hatTop + 4} width={headW - 8} height={6} rx={2} fill="#1f2937" />
          <line x1={cx + headW / 2 - 4} y1={hatTop + 7} x2={cx + headW / 2 + 4} y2={hatTop + 14} stroke="#fbbf24" strokeWidth={2} />
          <circle cx={cx + headW / 2 + 4} cy={hatTop + 14} r={3} fill="#fbbf24" />
        </g>
      )
    case 'headphones':
      return (
        <g>
          <path d={`M ${cx - headW / 2 - 2} ${hatTop + 10} Q ${cx} ${hatTop - 18} ${cx + headW / 2 + 2} ${hatTop + 10}`} stroke="#1f2937" strokeWidth={4} fill="none" />
          <rect x={cx - headW / 2 - 4} y={hatTop + 6} width={10} height={14} rx={3} fill="#1f2937" />
          <rect x={cx + headW / 2 - 6} y={hatTop + 6} width={10} height={14} rx={3} fill="#1f2937" />
        </g>
      )
    case 'halo':
      return (
        <g>
          <ellipse cx={cx} cy={hatTop - 2} rx={headW / 2 - 4} ry={6} stroke="#fbbf24" strokeWidth={3} fill="none" />
        </g>
      )
    case 'horns':
      return (
        <g>
          <path d={`M ${cx - headW / 2 + 6} ${hatTop + 4} L ${cx - headW / 2 - 2} ${hatTop - 12} L ${cx - 8} ${hatTop + 2} Z`} fill="#7f1d1d" />
          <path d={`M ${cx + headW / 2 - 6} ${hatTop + 4} L ${cx + headW / 2 + 2} ${hatTop - 12} L ${cx + 8} ${hatTop + 2} Z`} fill="#7f1d1d" />
        </g>
      )
    case 'space_helmet':
      return (
        <g>
          <ellipse cx={cx} cy={hatTop + 14} rx={headW / 2 + 2} ry={16} fill="rgba(150,200,255,0.3)" stroke="#9ca3af" strokeWidth={2} />
          <rect x={cx - 6} y={hatTop + 2} width={12} height={4} rx={1} fill="#9ca3af" />
        </g>
      )
    case 'pirate_hat':
      return (
        <g>
          <path d={`M ${cx - headW / 2 - 4} ${hatTop + 8} Q ${cx} ${hatTop - 8} ${cx + headW / 2 + 4} ${hatTop + 8} L ${cx + headW / 2} ${hatTop + 4} Q ${cx} ${hatTop + 10} ${cx - headW / 2} ${hatTop + 4} Z`} fill="#1f2937" />
          <text x={cx} y={hatTop + 6} textAnchor="middle" fontSize="10" fill="#fbbf24">☠</text>
        </g>
      )
    case 'top_hat':
      return (
        <g>
          <rect x={cx - headW / 2 + 6} y={hatTop + 2} width={headW - 12} height={6} rx={1} fill="#1f2937" />
          <rect x={cx - 12} y={hatTop - 16} width={24} height={20} rx={2} fill="#1f2937" />
          <rect x={cx - 12} y={hatTop - 4} width={24} height={4} fill="#dc2626" />
        </g>
      )
    case 'flower_crown':
      return (
        <g>
          <circle cx={cx - 16} cy={hatTop + 4} r={4} fill="#ec4899" />
          <circle cx={cx - 6} cy={hatTop + 2} r={4} fill="#fbbf24" />
          <circle cx={cx + 6} cy={hatTop + 2} r={4} fill="#ec4899" />
          <circle cx={cx + 16} cy={hatTop + 4} r={4} fill="#fbbf24" />
          <circle cx={cx} cy={hatTop + 6} r={3} fill="#10b981" />
        </g>
      )
    case 'bat_wings':
      return (
        <g>
          <path d={`M ${cx - 4} ${hatTop + 2} L ${cx - 20} ${hatTop - 10} L ${cx - 16} ${hatTop + 2} L ${cx - 22} ${hatTop + 6} L ${cx - 8} ${hatTop + 8} Z`} fill="#4c1d95" />
          <path d={`M ${cx + 4} ${hatTop + 2} L ${cx + 20} ${hatTop - 10} L ${cx + 16} ${hatTop + 2} L ${cx + 22} ${hatTop + 6} L ${cx + 8} ${hatTop + 8} Z`} fill="#4c1d95" />
        </g>
      )
    default:
      return null
  }
}

// ---------- Tool SVG (held in right hand) ----------
function ToolSVG({ tool, x, y }: { tool: string; x: number; y: number }) {
  switch (tool) {
    case 'none_tool':
      return null
    case 'sword':
      return (
        <g>
          <rect x={x - 2} y={y - 30} width={4} height={28} fill="#e5e7eb" stroke="#9ca3af" strokeWidth={1} />
          <rect x={x - 6} y={y - 4} width={12} height={4} rx={1} fill="#92400e" />
          <rect x={x - 2} y={y} width={4} height={6} fill="#92400e" />
        </g>
      )
    case 'wand':
      return (
        <g>
          <rect x={x - 1} y={y - 24} width={3} height={24} rx={1} fill="#92400e" />
          <text x={x} y={y - 22} textAnchor="middle" fontSize="14">⭐</text>
        </g>
      )
    case 'book':
      return (
        <g>
          <rect x={x - 8} y={y - 14} width={16} height={14} rx={1} fill="#1e40af" stroke="#1e3a8a" strokeWidth={1} />
          <line x1={x} y1={y - 14} x2={x} y2={y} stroke="#1e3a8a" strokeWidth={1} />
          <rect x={x - 5} y={y - 10} width={3} height={2} fill="#fbbf24" />
          <rect x={x + 2} y={y - 10} width={3} height={2} fill="#fbbf24" />
        </g>
      )
    case 'pencil':
      return (
        <g>
          <rect x={x - 2} y={y - 22} width={4} height={20} fill="#fbbf24" />
          <path d={`M ${x - 2} ${y - 22} L ${x} ${y - 28} L ${x + 2} ${y - 22} Z`} fill="#f3f4f6" />
          <rect x={x - 2} y={y - 2} width={4} height={4} fill="#92400e" />
          <path d={`M ${x - 2} ${y + 2} L ${x} ${y + 6} L ${x + 2} ${y + 2} Z`} fill="#1f2937" />
        </g>
      )
    case 'phone':
      return (
        <g>
          <rect x={x - 5} y={y - 16} width={10} height={16} rx={2} fill="#1f2937" />
          <rect x={x - 3.5} y={y - 14} width={7} height={12} rx={1} fill="#3b82f6" />
        </g>
      )
    case 'guitar':
      return (
        <g>
          <ellipse cx={x} cy={y - 4} rx={8} ry={10} fill="#92400e" />
          <circle cx={x} cy={y - 4} r={3} fill="#1f2937" />
          <rect x={x - 1.5} y={y - 26} width={3} height={20} fill="#92400e" />
          <rect x={x - 2} y={y - 28} width={5} height={4} fill="#1f2937" />
        </g>
      )
    case 'basketball':
      return (
        <g>
          <circle cx={x} cy={y - 6} r={8} fill="#f97316" stroke="#9a3412" strokeWidth={1} />
          <line x1={x - 8} y1={y - 6} x2={x + 8} y2={y - 6} stroke="#9a3412" strokeWidth={1} />
          <line x1={x} y1={y - 14} x2={x} y2={y + 2} stroke="#9a3412" strokeWidth={1} />
        </g>
      )
    case 'controller':
      return (
        <g>
          <rect x={x - 9} y={y - 10} width={18} height={10} rx={4} fill="#1f2937" />
          <circle cx={x - 5} cy={y - 5} r={2} fill="#60a5fa" />
          <circle cx={x + 5} cy={y - 5} r={2} fill="#ef4444" />
        </g>
      )
    case 'trophy':
      return (
        <g>
          <path d={`M ${x - 6} ${y - 16} L ${x + 6} ${y - 16} L ${x + 4} ${y - 4} L ${x - 4} ${y - 4} Z`} fill="#fbbf24" />
          <rect x={x - 2} y={y - 4} width={4} height={4} fill="#d97706" />
          <rect x={x - 5} y={y} width={10} height={3} rx={1} fill="#d97706" />
        </g>
      )
    default:
      return null
  }
}

function PetEmoji({ scene }: { scene: string }) {
  // Pets are kept as emoji for simplicity (legacy from old avatar system)
  // The new RobloxAvatar focuses on the character itself
  return null
}
