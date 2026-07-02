import 'server-only'
import { PlanId, BillingCycle, priceForCycle, formatBOB } from './index'
import { TIGO_MERCHANT, createPendingPayment } from './server'

// ============================================================
// Tigo Money provider.
// Tigo Money is a Bolivian mobile wallet. To pay, the parent either:
//   1. Dials *555# on their phone and follows the send-money menu, OR
//   2. Opens the Tigo Money app and sends to our merchant number.
// They must include our reference code so we can match the payment.
//
// We also generate a Tigo Money deep link (tigo://) that opens the wallet
// app pre-filled where supported.
// ============================================================

export interface TigoPayment {
  paymentId: string
  reference: string
  amountBob: number
  merchant: typeof TIGO_MERCHANT
  ussdCode: string       // the dial code the parent types
  deepLink: string       // opens the Tigo Money app
  instructions: string[] // step-by-step
  expiresAt: string
}

export async function createTigoPayment(opts: {
  userId: string
  plan: PlanId
  cycle: BillingCycle
}): Promise<TigoPayment> {
  const amountBob = priceForCycle(opts.plan, opts.cycle)
  const { id: paymentId, reference } = await createPendingPayment({
    userId: opts.userId,
    provider: 'tigo',
    amountBob,
    plan: opts.plan,
    cycle: opts.cycle,
  })

  const amountStr = (amountBob / 100).toFixed(2)
  const expiresAt = new Date(Date.now() + 30 * 60 * 1000)

  return {
    paymentId,
    reference,
    amountBob,
    merchant: TIGO_MERCHANT,
    // USSD menu: send money to merchant number with amount + reference
    ussdCode: `*555*1*${TIGO_MERCHANT.phoneNumber}*${amountStr.replace('.', '')}*${reference}#`,
    // Deep link to the Tigo Money app (if installed)
    deepLink: `tigomoney://pay?merchant=${TIGO_MERCHANT.phoneNumber}&amount=${amountStr}&reference=${reference}`,
    instructions: [
      `Abre la app de Tigo Money o marca *555# desde tu celular.`,
      `Selecciona "Enviar dinero" → "A comerciante".`,
      `Ingresa el número comerciante: ${TIGO_MERCHANT.phoneNumber} (${TIGO_MERCHANT.merchantName}).`,
      `Monto exacto: ${formatBOB(amountBob)}.`,
      `En "Concepto" o "Referencia" escribe: ${reference}`,
      `Confirma. Guarda el código de confirmación que te envíe Tigo Money.`,
      `Pega ese código abajo y presiona "Ya pagué" para confirmar.`,
    ],
    expiresAt: expiresAt.toISOString(),
  }
}
