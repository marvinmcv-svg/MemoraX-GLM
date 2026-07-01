'use client'

import * as React from 'react'
import { CreditCard, Check, Clock, Loader2, QrCode, RefreshCw, Smartphone, Wallet, X } from 'lucide-react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Skeleton } from '@/components/ui/skeleton'
import { useSession } from '@/lib/session'
import { CheckoutDialog } from '@/components/payments/checkout-dialog'
import { formatBOB, PLAN_NAMES, PLAN_PRICES_BOB, type PlanId, type BillingCycle } from '@/lib/payments'
import { toast } from 'sonner'
import { cn } from '@/lib/utils'

interface BillingData {
  subscription: {
    id: string
    plan: string
    status: string
    cycle: string
    currentPeriodEnd: string
  } | null
  payments: Array<{
    id: string
    provider: string
    amountBob: number
    status: string
    reference: string | null
    payerNote: string | null
    createdAt: string
    confirmedAt: string | null
  }>
}

const PROVIDER_META: Record<string, { label: string; icon: React.ElementType }> = {
  stripe: { label: 'Tarjeta', icon: Wallet },
  qr: { label: 'QR Bancario', icon: QrCode },
  tigo: { label: 'Tigo Money', icon: Smartphone },
}

const STATUS_META: Record<string, { label: string; cls: string }> = {
  paid: { label: 'Pagado', cls: 'bg-[var(--mx-emerald-soft)] text-foreground' },
  pending: { label: 'Pendiente', cls: 'bg-[var(--mx-accent-soft)] text-foreground' },
  failed: { label: 'Fallido', cls: 'bg-[var(--mx-clay)]/10 text-[var(--mx-clay)]' },
  refunded: { label: 'Reembolsado', cls: 'bg-muted text-muted-foreground' },
}

export function ParentBilling() {
  const { user } = useSession()
  const [data, setData] = React.useState<BillingData | null>(null)
  const [loading, setLoading] = React.useState(true)
  const [checkout, setCheckout] = React.useState<{ plan: PlanId; cycle: BillingCycle } | null>(null)

  const load = React.useCallback(async () => {
    if (!user) return
    setLoading(true)
    try {
      const res = await fetch(`/api/payments/billing?userId=${user.id}`, { cache: 'no-store' })
      if (!res.ok) throw new Error(`HTTP ${res.status}`)
      const d = (await res.json()) as BillingData
      setData(d)
    } catch (e: any) {
      toast.error('No se pudo cargar la facturación.', { description: e?.message })
    } finally {
      setLoading(false)
    }
  }, [user])

  React.useEffect(() => {
    load()
  }, [load])

  const sub = data?.subscription
  const currentPlan = (sub?.plan as PlanId) ?? 'free'
  const isPaid = sub && sub.status === 'active'
  const renewal = sub ? new Date(sub.currentPeriodEnd) : null

  const upgradePlans: PlanId[] = ['scholar', 'family', 'educator']

  return (
    <div className="space-y-5">
      {/* Current plan header */}
      <Card className="overflow-hidden">
        <CardHeader className="border-b border-border/60 pb-4">
          <div className="flex items-center gap-2">
            <CreditCard className="h-4 w-4" />
            <CardTitle className="text-base">Plan &amp; Facturación</CardTitle>
          </div>
          <CardDescription className="text-xs">
            Gestiona tu suscripción, métodos de pago e historial.
          </CardDescription>
        </CardHeader>
        <CardContent className="pt-4">
          {loading ? (
            <Skeleton className="h-28 w-full" />
          ) : (
            <div className="flex flex-col sm:flex-row sm:items-center gap-4">
              <div className="flex-1">
                <div className="flex items-center gap-2 mb-1">
                  <p className="text-sm text-muted-foreground">Plan actual</p>
                  <Badge
                    variant="outline"
                    className={cn(
                      'text-[10px]',
                      isPaid ? 'bg-[var(--mx-emerald-soft)]' : 'bg-muted'
                    )}
                  >
                    {sub?.status === 'active' ? 'Activo' : sub?.status === 'trialing' ? 'Prueba' : 'Gratis'}
                  </Badge>
                </div>
                <p className="text-2xl font-bold">{PLAN_NAMES[currentPlan]}</p>
                {sub && (
                  <p className="text-xs text-muted-foreground mt-1">
                    Ciclo: {sub.cycle === 'annual' ? 'anual' : 'mensual'}
                    {renewal && (
                      <> · se renueva el {renewal.toLocaleDateString('es-BO', { day: '2-digit', month: 'short', year: 'numeric' })}</>
                    )}
                  </p>
                )}
                {!sub && (
                  <p className="text-xs text-muted-foreground mt-1">
                    Estás en el plan gratuito. Mejora para desbloquear todo.
                  </p>
                )}
              </div>
              {currentPlan !== 'free' && (
                <Button variant="outline" size="sm" className="gap-1.5 shrink-0" disabled>
                  Cancelar plan
                </Button>
              )}
            </div>
          )}
        </CardContent>
      </Card>

      {/* Available plans — quick upgrade */}
      <div>
        <h3 className="font-semibold text-sm mb-2">Planes disponibles</h3>
        <div className="grid sm:grid-cols-3 gap-3">
          {upgradePlans.map((plan) => {
            const isCurrent = currentPlan === plan && isPaid
            const monthly = PLAN_PRICES_BOB[plan].monthly
            return (
              <Card key={plan} className={cn('p-4', isCurrent && 'ring-2 ring-primary')}>
                <div className="flex items-center justify-between mb-2">
                  <p className="font-semibold text-sm">{PLAN_NAMES[plan]}</p>
                  {isCurrent && <Badge className="text-[10px]">Actual</Badge>}
                </div>
                <p className="text-2xl font-bold mb-1">
                  {(monthly / 100).toFixed(0)} <span className="text-sm font-normal text-muted-foreground">Bs/mes</span>
                </p>
                <Button
                  size="sm"
                  variant={isCurrent ? 'outline' : 'default'}
                  className="w-full gap-1.5 mt-2"
                  disabled={isCurrent || !user}
                  onClick={() => setCheckout({ plan, cycle: 'monthly' })}
                >
                  {isCurrent ? (
                    <><Check className="h-3.5 w-3.5" /> Plan actual</>
                  ) : (
                    <><CreditCard className="h-3.5 w-3.5" /> Suscribir</>
                  )}
                </Button>
              </Card>
            )
          })}
        </div>
      </div>

      {/* Payment history */}
      <Card>
        <CardHeader className="border-b border-border/60 pb-4">
          <div className="flex items-center justify-between">
            <div>
              <CardTitle className="text-base">Historial de pagos</CardTitle>
              <CardDescription className="text-xs mt-0.5">
                Tus últimos pagos y su estado.
              </CardDescription>
            </div>
            <Button variant="ghost" size="sm" className="gap-1.5 h-7" onClick={load} disabled={loading}>
              <RefreshCw className={cn('h-3.5 w-3.5', loading && 'animate-spin')} /> Actualizar
            </Button>
          </div>
        </CardHeader>
        <CardContent className="pt-0">
          {loading ? (
            <div className="space-y-2 p-2">
              {Array.from({ length: 3 }).map((_, i) => (
                <Skeleton key={i} className="h-12 w-full" />
              ))}
            </div>
          ) : !data?.payments || data.payments.length === 0 ? (
            <div className="py-12 text-center">
              <div className="mx-auto h-10 w-10 rounded-full bg-muted grid place-items-center mb-3">
                <CreditCard className="h-5 w-5 text-muted-foreground" />
              </div>
              <p className="text-sm font-medium">Aún no tienes pagos</p>
              <p className="text-xs text-muted-foreground mt-1">
                Cuando te suscribas, tus pagos aparecerán aquí.
              </p>
            </div>
          ) : (
            <div className="max-h-96 overflow-y-auto scroll-thin">
              <table className="w-full text-sm">
                <thead className="text-xs text-muted-foreground">
                  <tr className="border-b border-border/60">
                    <th className="text-left font-medium py-2 pl-2">Fecha</th>
                    <th className="text-left font-medium py-2">Método</th>
                    <th className="text-left font-medium py-2">Referencia</th>
                    <th className="text-right font-medium py-2">Monto</th>
                    <th className="text-right font-medium py-2 pr-2">Estado</th>
                  </tr>
                </thead>
                <tbody>
                  {data.payments.map((p) => {
                    const pm = PROVIDER_META[p.provider] ?? { label: p.provider, icon: CreditCard }
                    const sm = STATUS_META[p.status] ?? { label: p.status, cls: 'bg-muted' }
                    const PmIcon = pm.icon
                    return (
                      <tr key={p.id} className="border-b border-border/40 last:border-0">
                        <td className="py-2.5 pl-2 text-xs text-muted-foreground">
                          {new Date(p.createdAt).toLocaleDateString('es-BO', { day: '2-digit', month: 'short', year: 'numeric' })}
                        </td>
                        <td className="py-2.5">
                          <span className="inline-flex items-center gap-1.5 text-xs">
                            <PmIcon className="h-3.5 w-3.5" /> {pm.label}
                          </span>
                        </td>
                        <td className="py-2.5 text-xs font-mono text-muted-foreground">
                          {p.reference ?? '—'}
                        </td>
                        <td className="py-2.5 text-right text-sm font-medium">
                          {formatBOB(p.amountBob)}
                        </td>
                        <td className="py-2.5 pr-2 text-right">
                          <Badge variant="outline" className={cn('text-[10px]', sm.cls)}>
                            {p.status === 'pending' && <Clock className="h-2.5 w-2.5 mr-0.5" />}
                            {p.status === 'paid' && <Check className="h-2.5 w-2.5 mr-0.5" />}
                            {p.status === 'failed' && <X className="h-2.5 w-2.5 mr-0.5" />}
                            {sm.label}
                          </Badge>
                        </td>
                      </tr>
                    )
                  })}
                </tbody>
              </table>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Checkout dialog */}
      {checkout && user && (
        <CheckoutDialog
          open
          onOpenChange={(o) => !o && setCheckout(null)}
          userId={user.id}
          plan={checkout.plan}
          cycle={checkout.cycle}
          amountBob={PLAN_PRICES_BOB[checkout.plan][checkout.cycle]}
          planName={PLAN_NAMES[checkout.plan]}
          onSuccess={load}
        />
      )}
    </div>
  )
}
