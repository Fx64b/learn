import { Stripe, loadStripe } from '@stripe/stripe-js'

let stripePromise: Promise<Stripe | null> | null = null

export const getStripe = () => {
    if (!stripePromise) {
        if (!process.env.NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY) {
            throw new Error('NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY is not set')
        }
        stripePromise = loadStripe(
            process.env.NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY
        )
    }
    return stripePromise
}
