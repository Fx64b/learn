import Stripe from 'stripe'

// Validate all required Stripe environment variables at startup
const requiredEnvVars = [
    'STRIPE_SECRET_KEY',
    'STRIPE_PUBLISHABLE_KEY',
    'STRIPE_WEBHOOK_SECRET',
    'NEXT_PUBLIC_STRIPE_PRO_MONTHLY_PRICE_ID',
    'NEXT_PUBLIC_STRIPE_PRO_YEARLY_PRICE_ID',
] as const

const missingVars = requiredEnvVars.filter((envVar) => !process.env[envVar])

if (missingVars.length > 0) {
    throw new Error(
        `Missing required Stripe environment variables: ${missingVars.join(', ')}\n` +
            'Please check your .env.local file and ensure all Stripe configuration is present.'
    )
}

if (!process.env.STRIPE_SECRET_KEY) {
    throw new Error('STRIPE_SECRET_KEY is not set')
}

// Validate that the secret key has the correct format
if (!process.env.STRIPE_SECRET_KEY.startsWith('sk_')) {
    throw new Error(
        'STRIPE_SECRET_KEY must start with "sk_" - please check your Stripe secret key'
    )
}

// Warn about test vs live mode
const isTestMode = process.env.STRIPE_SECRET_KEY.includes('test')
const isProduction = process.env.NODE_ENV === 'production'

if (isProduction && isTestMode) {
    console.warn(
        '⚠️  WARNING: Using Stripe test keys in production environment. ' +
            'Make sure to use live keys for production!'
    )
}

export const stripe = new Stripe(process.env.STRIPE_SECRET_KEY, {
    apiVersion: '2025-06-30.basil',
    typescript: true,
    telemetry: false,
})

export const stripeConfig = {
    isTestMode,
    webhookSecret: process.env.STRIPE_WEBHOOK_SECRET!,
    priceIds: {
        proMonthly: process.env.NEXT_PUBLIC_STRIPE_PRO_MONTHLY_PRICE_ID!,
        proYearly: process.env.NEXT_PUBLIC_STRIPE_PRO_YEARLY_PRICE_ID!,
    },
} as const
