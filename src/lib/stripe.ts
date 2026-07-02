import 'server-only'
import Stripe from 'stripe'

// Singleton Stripe instance — uses test key by default, production key if available
const stripeSecretKey = process.env.STRIPE_SECRET_KEY || 'sk_test_51234567890' // placeholder test key

let _stripe: Stripe | null = null

export function getStripe(): Stripe {
  if (!_stripe) {
    _stripe = new Stripe(stripeSecretKey, {
      apiVersion: '2025-01-27.acacia' as any,
    })
  }
  return _stripe
}

// Price IDs for each tier (monthly + annual)
// In production, these are created in the Stripe Dashboard.
// For testing, we create them dynamically if they don't exist.
export const TIER_CONFIG = {
  SCHOLAR: {
    name: 'Scholar',
    monthlyPrice: 799, // $7.99 in cents
    annualPrice: 599,  // $5.99/mo billed annually = $71.88/yr
    description: 'Unlimited AI tutor chat, 50 homework scans/mo, voice notes, solution mode',
  },
  FAMILY: {
    name: 'Family',
    monthlyPrice: 1999, // $19.99
    annualPrice: 1599,  // $15.99/mo
    description: 'Up to 4 students, 2 parents, unlimited everything, priority responses',
  },
  EDUCATOR: {
    name: 'Educator',
    monthlyPrice: 1299, // $12.99
    annualPrice: 999,   // $9.99/mo
    description: 'Unlimited classes, student progress, AI lesson plans, conference reports',
  },
} as const

export type TierCode = keyof typeof TIER_CONFIG

// Ensure Stripe products + prices exist (called on first checkout)
// Returns price IDs that we cache in the DB or env
let _priceCache: Record<string, string> | null = null

export async function ensureStripeProducts(): Promise<Record<string, string>> {
  if (_priceCache) return _priceCache

  const stripe = getStripe()
  const prices: Record<string, string> = {}

  for (const [tierCode, config] of Object.entries(TIER_CONFIG)) {
    try {
      // Create product
      const product = await stripe.products.create({
        name: `MemoraX ${config.name}`,
        description: config.description,
        metadata: { tier: tierCode },
      })

      // Create monthly price
      const monthlyPrice = await stripe.prices.create({
        product: product.id,
        unit_amount: config.monthlyPrice,
        currency: 'usd',
        recurring: { interval: 'month' },
        metadata: { tier: tierCode, billing: 'monthly' },
      })
      prices[`${tierCode}_monthly`] = monthlyPrice.id

      // Create annual price
      const annualPrice = await stripe.prices.create({
        product: product.id,
        unit_amount: config.annualPrice * 12, // annual = monthly * 12
        currency: 'usd',
        recurring: { interval: 'year' },
        metadata: { tier: tierCode, billing: 'annual' },
      })
      prices[`${tierCode}_annual`] = annualPrice.id
    } catch (e: any) {
      // If products already exist (duplicate), skip — in production you'd use fixed price IDs
      console.log(`Stripe product setup for ${tierCode}:`, e?.message)
    }
  }

  _priceCache = prices
  return prices
}
