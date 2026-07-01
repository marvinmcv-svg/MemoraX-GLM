'use client'

import * as React from 'react'
import {
  Check,
  Clock,
  Copy,
  Landmark,
  Loader2,
  QrCode,
  ShieldCheck,
  Smartphone,
  Wallet,
} from 'lucide-react'
import { toast } from 'sonner'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'
import { Tabs, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Badge } from '@/components/ui/badge'
import { formatBOB, type PlanId, type BillingCycle } from '@/lib/payments'

type Provider = 'stripe' | 'qr' | 'tigo'

interface CheckoutDialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  userId: string
  plan: PlanId
  cycle: BillingCycle
  amountBob: number
  planName: string
  onSuccess?: () => void
}

interface QrResult {
  paymentId: string
  reference: string
  amountBob: number
  qrDataUrl: string
  merchant: { bankName: string; accountHolder: string; accountNumber: string; ci: string }
  expiresAt: string
}

interface TigoResult {
  paymentId: string
  reference: string
  amountBob: number
  merchant: { phoneNumber: string; merchantName: string }
  ussdCode: string
  deepLink: string
  instructions: string[]
  expiresAt: string
}

export function CheckoutDialog({
  open,
  onOpenChange,
  userId,
  plan,
  cycle,
  amountBob,
  planName,
  onSuccess,
}: CheckoutDialogProps) {
  const [provider, setProvider] = React.useState<Provider>('stripe')
  const [busy, setBusy] = React.useState(false)
  const [polling, setPolling] = React.useState(false)
  const [qr, setQr] = React.useState<QrResult | null>(null)
  const [tigo, setTigo] = React.useState<TigoResult | null>(null)
  const [payerNote, setPayerNote] = React.useState('')

  const total = cycle === 'annual' ? amountBob * 12 : amountBob

  const startStripe = async () => {
    setBusy(true)
    try {
      const res = await fetch('/api/payments/checkout', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ userId, plan, cycle }),
      })
      const data = await res.json()
      if (!res.ok) throw new Error(data?.error ?? 'failed')
      window.location.href = data.url
    } catch (e: any) {
      toast.error('No se pudo iniciar el pago con tarjeta.', { description: e?.message })
    } finally {
      setBusy(false)
    }
  }

  const startQr = async () => {
    setBusy(true)
    try {
      const res = await fetch('/api/payments/qr', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ userId, plan, cycle }),
      })
      const data = await res.json()
      if (!res.ok) throw new Error(data?.error ?? 'failed')
      setQr(data)
    } catch (e: any) {
      toast.error('No se pudo generar el QR.', { description: e?.message })
    } finally {
      setBusy(false)
    }
  }

  const startTigo = async () => {
    setBusy(true)
    try {
      const res = await fetch('/api/payments/tigo', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ userId, plan, cycle }),
      })
      const data = await res.json()
      if (!res.ok) throw new Error(data?.error ?? 'failed')
      setTigo(data)
    } catch (e: any) {
      toast.error('No se pudo iniciar el pago con Tigo Money.', { description: e?.message })
    } finally {
      setBusy(false)
    }
  }

  const confirm = async (paymentId: string) => {
    setPolling(true)
    try {
      const res = await fetch('/api/payments/confirm', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ paymentId, payerNote }),
      })
      const data = await res.json()
      if (!res.ok) throw new Error(data?.error ?? 'failed')
      toast.success('¡Pago confirmado! Tu plan está activo.', {
        description: `Referencia ${paymentId.slice(-8)}`,
      })
      onSuccess?.()
      onOpenChange(false)
      setQr(null)
      setTigo(null)
      setPayerNote('')
    } catch (e: any) {
      toast.error('No pudimos confirmar el pago.', { description: e?.message })
    } finally {
      setPolling(false)
    }
  }

  React.useEffect(() => {
    if (!open) {
      setQr(null)
      setTigo(null)
      setPayerNote('')
      setProvider('stripe')
    }
  }, [open])

  React.useEffect(() => {
    if (!open) return
    if (provider === 'qr' && !qr) startQr()
    if (provider === 'tigo' && !tigo) startTigo()
  }, [open, provider])

  const copy = (text: string, label: string) => {
    navigator.clipboard?.writeText(text).then(
      () => toast.success(`${label} copiado`),
      () => toast.error('No se pudo copiar')
    )
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-lg">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <ShieldCheck className="h-5 w-5 text-[var(--mx-accent)]" />
            Suscribir a {planName}
          </DialogTitle>
          <DialogDescription>
            {cycle === 'annual' ? 'Plan anual (12 meses)' : 'Plan mensual'} · {formatBOB(total)}
            {cycle === 'annual' && (
              <span className="text-[var(--mx-accent)] ml-1">— ahorras ~30%</span>
            )}
          </DialogDescription>
        </DialogHeader>

        <Tabs value={provider} onValueChange={(v) => setProvider(v as Provider)}>
          <TabsList className="grid w-full grid-cols-3 h-auto">
            <TabsTrigger value="stripe" className="gap-1.5 py-2 text-xs">
              <Wallet className="h-3.5 w-3.5" /> Tarjeta
            </TabsTrigger>
            <TabsTrigger value="qr" className="gap-1.5 py-2 text-xs">
              <QrCode className="h-3.5 w-3.5" /> QR Bancario
            </TabsTrigger>
            <TabsTrigger value="tigo" className="gap-1.5 py-2 text-xs">
              <Smartphone className="h-3.5 w-3.5" /> Tigo Money
            </TabsTrigger>
          </TabsList>

          {/* ───────── Stripe ───────── */}
          {provider === 'stripe' && (
            <div className="space-y-4 py-2">
              <div className="rounded-lg border border-border/60 p-4 bg-muted/30">
                <div className="flex items-center gap-2 mb-2">
                  <Wallet className="h-4 w-4" />
                  <p className="text-sm font-medium">Paga con tarjeta (Visa / Mastercard)</p>
                </div>
                <p className="text-xs text-muted-foreground leading-relaxed">
                  Serás redirigido a Stripe, el procesador de pagos seguro de MemoraX. Tu tarjeta
                  no se guarda en nuestros servidores. Se cobrará en bolivianos (BOB).
                </p>
              </div>
              <div className="flex items-center justify-between text-sm">
                <span className="text-muted-foreground">Total a pagar</span>
                <span className="font-semibold">{formatBOB(total)}</span>
              </div>
              <Button className="w-full gap-2" onClick={startStripe} disabled={busy}>
                {busy ? <Loader2 className="h-4 w-4 animate-spin" /> : <Wallet className="h-4 w-4" />}
                Pagar {formatBOB(total)} con tarjeta
              </Button>
              <p className="text-[11px] text-muted-foreground text-center flex items-center justify-center gap-1">
                <ShieldCheck className="h-3 w-3" /> Pago seguro cifrado · SSL
              </p>
            </div>
          )}

          {/* ───────── QR Bancario ───────── */}
          {provider === 'qr' && (
            <div className="space-y-4 py-2">
              {busy && !qr ? (
                <div className="py-10 flex flex-col items-center gap-3">
                  <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
                  <p className="text-sm text-muted-foreground">Generando QR…</p>
                </div>
              ) : qr ? (
                <>
                  <div className="flex flex-col items-center gap-3">
                    <div className="rounded-xl border-2 border-foreground p-2 bg-white">
                      <img src={qr.qrDataUrl} alt="QR de pago bancario" className="h-44 w-44" />
                    </div>
                    <Badge variant="outline" className="gap-1 text-xs">
                      <Clock className="h-3 w-3" /> Expira a las{' '}
                      {new Date(qr.expiresAt).toLocaleTimeString('es-BO', {
                        hour: '2-digit',
                        minute: '2-digit',
                      })}
                    </Badge>
                  </div>

                  <div className="rounded-lg border border-border/60 p-3 space-y-1.5 text-xs">
                    <div className="flex justify-between">
                      <span className="text-muted-foreground">Banco</span>
                      <span className="font-medium">{qr.merchant.bankName}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-muted-foreground">Titular</span>
                      <span className="font-medium">{qr.merchant.accountHolder}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-muted-foreground">Cuenta</span>
                      <button
                        className="font-medium hover:text-[var(--mx-accent)] inline-flex items-center gap-1"
                        onClick={() => copy(qr.merchant.accountNumber, 'Número de cuenta')}
                      >
                        {qr.merchant.accountNumber} <Copy className="h-3 w-3" />
                      </button>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-muted-foreground">Monto</span>
                      <span className="font-bold">{formatBOB(qr.amountBob)}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-muted-foreground">Referencia</span>
                      <button
                        className="font-mono font-medium hover:text-[var(--mx-accent)] inline-flex items-center gap-1"
                        onClick={() => copy(qr.reference, 'Referencia')}
                      >
                        {qr.reference} <Copy className="h-3 w-3" />
                      </button>
                    </div>
                  </div>

                  <div className="rounded-lg bg-[var(--mx-accent-soft)]/40 p-3 text-xs leading-relaxed">
                    <p className="font-medium flex items-center gap-1.5 mb-1">
                      <Landmark className="h-3.5 w-3.5" /> Cómo pagar
                    </p>
                    <ol className="list-decimal list-inside space-y-0.5 text-muted-foreground">
                      <li>Abre la app de tu banco en tu celular.</li>
                      <li>Escanea este QR con la opción "Pagar con QR".</li>
                      <li>Verifica que el monto coincida y confirma.</li>
                      <li>Cuando termines, presiona "Ya pagué".</li>
                    </ol>
                  </div>

                  <div className="space-y-1.5">
                    <Label htmlFor="payer-note" className="text-xs">
                      Código de confirmación del banco (opcional)
                    </Label>
                    <Input
                      id="payer-note"
                      value={payerNote}
                      onChange={(e) => setPayerNote(e.target.value)}
                      placeholder="Ej. COMPROBANTE-7845"
                      className="text-sm"
                    />
                  </div>

                  <Button className="w-full gap-2" onClick={() => confirm(qr.paymentId)} disabled={polling}>
                    {polling ? <Loader2 className="h-4 w-4 animate-spin" /> : <Check className="h-4 w-4" />}
                    Ya pagué — confirmar
                  </Button>
                </>
              ) : null}
            </div>
          )}

          {/* ───────── Tigo Money ───────── */}
          {provider === 'tigo' && (
            <div className="space-y-4 py-2">
              {busy && !tigo ? (
                <div className="py-10 flex flex-col items-center gap-3">
                  <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
                  <p className="text-sm text-muted-foreground">Preparando pago Tigo Money…</p>
                </div>
              ) : tigo ? (
                <>
                  <div className="flex items-center gap-3 rounded-lg border border-border/60 p-3 bg-muted/30">
                    <div className="h-10 w-10 rounded-full bg-[var(--mx-accent)] grid place-items-center text-[var(--mx-accent-foreground)]">
                      <Smartphone className="h-5 w-5" />
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-medium">{tigo.merchant.merchantName}</p>
                      <p className="text-xs text-muted-foreground">
                        Número comerciante:{' '}
                        <button
                          className="font-mono hover:text-[var(--mx-accent)] inline-flex items-center gap-1"
                          onClick={() => copy(tigo.merchant.phoneNumber, 'Número')}
                        >
                          {tigo.merchant.phoneNumber} <Copy className="h-3 w-3" />
                        </button>
                      </p>
                    </div>
                  </div>

                  <div className="flex items-center justify-between text-sm px-1">
                    <span className="text-muted-foreground">Monto a enviar</span>
                    <span className="font-bold">{formatBOB(tigo.amountBob)}</span>
                  </div>

                  <div className="rounded-lg bg-[var(--mx-accent-soft)]/40 p-3 text-xs space-y-1.5">
                    <p className="font-medium mb-1">Instrucciones paso a paso</p>
                    <ol className="list-decimal list-inside space-y-0.5 text-muted-foreground leading-relaxed">
                      {tigo.instructions.map((line, i) => (
                        <li key={i}>{line}</li>
                      ))}
                    </ol>
                  </div>

                  <div className="rounded-lg border border-dashed border-border p-3 text-center">
                    <p className="text-[11px] text-muted-foreground mb-1">O marca desde tu celular</p>
                    <button
                      className="font-mono text-sm font-medium hover:text-[var(--mx-accent)]"
                      onClick={() => copy(tigo.ussdCode, 'Código USSD')}
                    >
                      {tigo.ussdCode} <Copy className="inline h-3 w-3 ml-1" />
                    </button>
                  </div>

                  <div className="flex items-center justify-between text-xs px-1">
                    <span className="text-muted-foreground">Referencia</span>
                    <button
                      className="font-mono font-medium hover:text-[var(--mx-accent)] inline-flex items-center gap-1"
                      onClick={() => copy(tigo.reference, 'Referencia')}
                    >
                      {tigo.reference} <Copy className="h-3 w-3" />
                    </button>
                  </div>

                  <div className="space-y-1.5">
                    <Label htmlFor="tigo-note" className="text-xs">
                      Código de confirmación de Tigo Money
                    </Label>
                    <Input
                      id="tigo-note"
                      value={payerNote}
                      onChange={(e) => setPayerNote(e.target.value)}
                      placeholder="Ej. TG-9876543210"
                      className="text-sm"
                    />
                  </div>

                  <Button className="w-full gap-2" onClick={() => confirm(tigo.paymentId)} disabled={polling}>
                    {polling ? <Loader2 className="h-4 w-4 animate-spin" /> : <Check className="h-4 w-4" />}
                    Ya pagué — confirmar
                  </Button>
                </>
              ) : null}
            </div>
          )}
        </Tabs>

        <DialogFooter className="text-center">
          <p className="text-[11px] text-muted-foreground w-full">
            Al suscribirte aceptas los términos de MemoraX. Cancela cuando quieras desde
            <span className="text-foreground font-medium"> Plan &amp; Facturación</span>.
          </p>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}
