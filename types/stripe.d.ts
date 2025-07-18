declare module 'stripe' {
    namespace Stripe {
        interface Subscription {
            current_period_end: number
            current_period_start: number
        }
    }
}
