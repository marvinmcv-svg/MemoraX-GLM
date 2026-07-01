'use client'

import * as React from 'react'
import {
  Check,
  Sparkles,
  GraduationCap,
  HeartHandshake,
  Users,
  X,
  ArrowRight,
} from 'lucide-react'
import { motion } from 'framer-motion'
import { Card } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { cn } from '@/lib/utils'
import { toast } from 'sonner'
import { useSession } from '@/lib/session'
import { CheckoutDialog } from '@/components/payments/checkout-dialog'
import { PLAN_PRICES_BOB, PLAN_NAMES, type PlanId, type BillingCycle } from '@/lib/payments'

type Billing = 'monthly' | 'annual'

interface Tier {
  id: string
  name: string
  tagline: string
  icon: React.ElementType
  accent: 'emerald' | 'amber' | 'clay' | 'teal'
  monthly: number
  annual: number // per month, billed annually
  popular?: boolean
  cta: string
  features: { text: string; included: boolean }[]
  note?: string
}

const TIERS: Tier[] = [
  {
    id: 'free',
    name: 'Starter',
    tagline: 'Try MemoraX solo',
    icon: Sparkles,
    accent: 'teal',
    monthly: 0,
    annual: 0,
    cta: 'Start free',
    features: [
      { text: '1 student account', included: true },
      { text: '20 tutor messages / day', included: true },
      { text: '3 homework photo scans / month', included: true },
      { text: 'Google Classroom sync', included: true },
      { text: '1 parent reminder inbox', included: true },
      { text: 'Memory layer (last 30 days)', included: true },
      { text: 'Voice notes & TTS playback', included: false },
      { text: '“Show me the solution” mode', included: false },
    ],
    note: 'No credit card required',
  },
  {
    id: 'scholar',
    name: 'Scholar',
    tagline: 'For the serious student',
    icon: GraduationCap,
    accent: 'emerald',
    monthly: 7.99,
    annual: 5.99,
    popular: true,
    cta: 'Go Scholar',
    features: [
      { text: '1 student account', included: true },
      { text: 'Unlimited tutor chat', included: true },
      { text: '50 homework photo scans / month', included: true },
      { text: 'Google Classroom sync', included: true },
      { text: '1 parent reminder inbox', included: true },
      { text: 'Unlimited memory layer', included: true },
      { text: 'Voice notes & TTS playback', included: true },
      { text: '“Show me the solution” mode', included: true },
    ],
    note: 'Most students pick this',
  },
  {
    id: 'family',
    name: 'Family',
    tagline: 'The whole household, in sync',
    icon: HeartHandshake,
    accent: 'amber',
    monthly: 19.99,
    annual: 15.99,
    cta: 'Go Family',
    features: [
      { text: 'Up to 4 student accounts', included: true },
      { text: '2 parent reminder inboxes', included: true },
      { text: 'Unlimited tutor chat (all students)', included: true },
      { text: 'Unlimited homework photo scans', included: true },
      { text: '7 PM digest + morning-of + overdue alerts', included: true },
      { text: 'Weekly progress reports for parents', included: true },
      { text: 'Voice notes & TTS playback', included: true },
      { text: 'Priority tutor responses', included: true },
    ],
    note: 'Best value for households',
  },
  {
    id: 'educator',
    name: 'Educator',
    tagline: 'For teachers & tutors',
    icon: Users,
    accent: 'clay',
    monthly: 12.99,
    annual: 9.99,
    cta: 'Go Educator',
    features: [
      { text: 'Unlimited classes & assignments', included: true },
      { text: 'Student progress dashboard', included: true },
      { text: 'Tutor insights per student (memory layer)', included: true },
      { text: 'Message students via assistant', included: true },
      { text: 'Roster analytics & at-risk flags', included: true },
      { text: 'Google Classroom import', included: true },
      { text: 'Free for verified classroom teachers*', included: true },
      { text: 'Voice notes & TTS playback', included: true },
    ],
    note: '*Verified .edu / school email — free forever',
  },
]

const ACCENTS = {
  emerald: {
    badge: 'bg-primary/10 text-primary',
    icon: 'bg-primary text-primary-foreground',
    check: 'text-primary',
    ring: 'ring-[var(--mx-emerald-soft)]',
  },
  amber: {
    badge: 'bg-[var(--mx-warm)]/10 text-[var(--mx-warm)]',
    icon: 'bg-[var(--mx-warm)] text-white',
    check: 'text-[var(--mx-warm)]',
    ring: 'ring-[var(--mx-warm-soft)]',
  },
  clay: {
    badge: 'bg-[var(--mx-clay)]/10 text-[var(--mx-clay)]',
    icon: 'bg-[var(--mx-clay)] text-white',
    check: 'text-[var(--mx-clay)]',
    ring: 'ring-[var(--mx-clay)]/20',
  },
  teal: {
    badge: 'bg-primary/10 text-primary',
    icon: 'bg-[var(--mx-emerald)] text-primary-foreground',
    check: 'text-primary',
    ring: 'ring-[var(--mx-emerald-soft)]',
  },
}

export function Pricing({ onCta }: { onCta?: (tier: string) => void }) {
  const [billing, setBilling] = React.useState<Billing>('monthly')
  const { user } = useSession()
  const [checkout, setCheckout] = React.useState<{ plan: PlanId; cycle: BillingCycle } | null>(null)

  const handleCta = (tier: Tier) => {
    onCta?.(tier.id)
    if (tier.id === 'free') {
      toast('El plan Starter gratis está activo en este demo — ¡elige un rol para explorar!', {
        description: 'Todas las funciones están desbloqueadas para que pruebes todo.',
      })
      return
    }
    if (!user) {
      toast('Elige un rol de usuario primero para suscribirte.', {
        description: 'Toca una tarjeta de rol arriba (estudiante, padre o profesor).',
      })
      return
    }
    setCheckout({ plan: tier.id as PlanId, cycle: billing as BillingCycle })
  }

  return (
    <section id="pricing" className="mx-auto max-w-6xl px-4 sm:px-6 py-16 w-full">
      <div className="text-center max-w-2xl mx-auto mb-10">
        <Badge variant="secondary" className="mb-3 gap-1.5">
          <Sparkles className="h-3.5 w-3.5 text-[var(--mx-accent)]" /> Precios en bolivianos
        </Badge>
        <h2 className="text-3xl sm:text-4xl font-bold tracking-tight">Planes simples que crecen contigo</h2>
        <p className="mt-3 text-muted-foreground">
          Empieza gratis, mejora cuando estés listo. Las familias ahorran más, los profesores aprenden gratis.
        </p>
        <div className="mt-4 flex flex-wrap items-center justify-center gap-2 text-xs text-muted-foreground">
          <span className="inline-flex items-center gap-1 rounded-full border border-border/60 px-2.5 py-1">
            💳 Tarjeta (Stripe)
          </span>
          <span className="inline-flex items-center gap-1 rounded-full border border-border/60 px-2.5 py-1">
            📲 QR Bancario
          </span>
          <span className="inline-flex items-center gap-1 rounded-full border border-border/60 px-2.5 py-1">
            📱 Tigo Money
          </span>
        </div>
      </div>

      {/* Billing toggle */}
      <div className="flex items-center justify-center gap-3 mb-10">
        <span className={cn('text-sm font-medium', billing === 'monthly' ? 'text-foreground' : 'text-muted-foreground')}>
          Monthly
        </span>
        <button
          onClick={() => setBilling((b) => (b === 'monthly' ? 'annual' : 'monthly'))}
          className={cn(
            'relative h-7 w-12 rounded-full transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 focus-visible:ring-offset-background',
            billing === 'annual' ? 'bg-primary' : 'bg-muted'
          )}
          aria-label="Toggle billing period"
        >
          <span
            className={cn(
              'absolute top-1 h-5 w-5 rounded-full bg-card shadow transition-transform',
              billing === 'annual' ? 'translate-x-6' : 'translate-x-1'
            )}
          />
        </button>
        <span className={cn('text-sm font-medium', billing === 'annual' ? 'text-foreground' : 'text-muted-foreground')}>
          Annual
        </span>
        <Badge variant="outline" className="text-[11px] gap-1 text-primary border-primary/30">
          Save 25%
        </Badge>
      </div>

      {/* Tier grid */}
      <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-5 items-start">
        {TIERS.map((tier, i) => (
          <TierCard key={tier.id} tier={tier} billing={billing} index={i} onCta={handleCta} />
        ))}
      </div>

      {/* Feature comparison note */}
      <motion.div
        initial={{ opacity: 0, y: 10 }}
        whileInView={{ opacity: 1, y: 0 }}
        viewport={{ once: true }}
        className="mt-10"
      >
        <Card className="p-5 bg-muted/20">
          <div className="flex flex-col sm:flex-row items-start sm:items-center gap-3">
            <div className="h-9 w-9 rounded-lg bg-primary/10 text-primary grid place-items-center shrink-0">
              <HeartHandshake className="h-4.5 w-4.5" />
            </div>
            <div className="flex-1">
              <p className="font-medium text-sm">Every plan includes</p>
              <p className="text-xs text-muted-foreground mt-1 leading-relaxed">
                Socratic AI tutor · Google Classroom sync · Memory layer · Family bundle support ·
                Privacy-first architecture · Cancel anytime.
              </p>
            </div>
          </div>
        </Card>
      </motion.div>

      {/* FAQ-ish row */}
      <div className="grid sm:grid-cols-3 gap-4 mt-6">
        <FaqItem q="¿Hay opción gratis para profesores?" a="Sí — los profesores verificados con email escolar tienen Educator gratis para siempre." />
        <FaqItem q="¿Puedo cambiar de plan después?" a="Cuando quieras. Mejoras inmediatas; bajadas de plan al final del ciclo." />
        <FaqItem q="¿Qué pagos aceptan en Bolivia?" a="Tarjeta internacional (Stripe), QR bancario interbancario y Tigo Money. Todo en bolivianos." />
      </div>

      {checkout && user && (
        <CheckoutDialog
          open
          onOpenChange={(o) => !o && setCheckout(null)}
          userId={user.id}
          plan={checkout.plan}
          cycle={checkout.cycle}
          amountBob={checkout.cycle === 'annual' ? PLAN_PRICES_BOB[checkout.plan].annual : PLAN_PRICES_BOB[checkout.plan].monthly}
          planName={PLAN_NAMES[checkout.plan]}
        />
      )}
    </section>
  )
}

function TierCard({
  tier,
  billing,
  index,
  onCta,
}: {
  tier: Tier
  billing: Billing
  index: number
  onCta: (t: Tier) => void
}) {
  const a = ACCENTS[tier.accent]
  const Icon = tier.icon
  const planId = tier.id as PlanId
  const bobCents = billing === 'monthly' ? PLAN_PRICES_BOB[planId].monthly : PLAN_PRICES_BOB[planId].annual
  const bobDisplay = (bobCents / 100).toFixed(bobCents % 100 === 0 ? 0 : 2)
  const annualTotal = (PLAN_PRICES_BOB[planId].annual * 12 / 100).toFixed(0)
  return (
    <motion.div
      initial={{ opacity: 0, y: 12 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true }}
      transition={{ delay: index * 0.06 }}
    >
      <Card
        className={cn(
          'p-6 flex flex-col h-full relative overflow-hidden',
          tier.popular ? 'ring-2 ring-primary shadow-lg' : 'ring-1',
          a.ring
        )}
      >
        {tier.popular && (
          <div className="absolute top-0 right-0 bg-primary text-primary-foreground text-[10px] font-bold px-3 py-1 rounded-bl-lg">
            MÁS POPULAR
          </div>
        )}
        <div className={cn('h-11 w-11 rounded-xl grid place-items-center mb-4', a.icon)}>
          <Icon className="h-5 w-5" />
        </div>
        <h3 className="font-semibold text-lg">{tier.name}</h3>
        <p className="text-xs text-muted-foreground mb-4">{tier.tagline}</p>

        <div className="mb-4">
          <div className="flex items-baseline gap-1">
            <span className="text-3xl font-bold">{bobDisplay}</span>
            <span className="text-sm text-muted-foreground">Bs</span>
            <span className="text-xs text-muted-foreground ml-0.5">/mes</span>
          </div>
          <p className="text-[11px] text-muted-foreground mt-0.5">
            {tier.monthly === 0
              ? tier.note
              : billing === 'annual'
              ? `facturado anual (${annualTotal} Bs/año)`
              : 'facturado mensual'}
          </p>
        </div>

        <Button
          variant={tier.popular ? 'default' : 'outline'}
          className="w-full gap-1.5 mb-5"
          onClick={() => onCta(tier)}
        >
          {tier.cta} <ArrowRight className="h-3.5 w-3.5" />
        </Button>

        <ul className="space-y-2 text-sm mt-auto">
          {tier.features.map((f, idx) => (
            <li key={idx} className="flex gap-2 items-start">
              {f.included ? (
                <Check className={cn('h-4 w-4 shrink-0 mt-0.5', a.check)} />
              ) : (
                <X className="h-4 w-4 shrink-0 mt-0.5 text-muted-foreground/50" />
              )}
              <span className={cn(f.included ? 'text-foreground' : 'text-muted-foreground/60 line-through')}>
                {f.text}
              </span>
            </li>
          ))}
        </ul>
      </Card>
    </motion.div>
  )
}

function FaqItem({ q, a }: { q: string; a: string }) {
  return (
    <div className="rounded-xl border border-border/60 p-4">
      <p className="text-sm font-medium">{q}</p>
      <p className="text-xs text-muted-foreground mt-1 leading-relaxed">{a}</p>
    </div>
  )
}
