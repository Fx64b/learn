declare module 'stripe' {
    namespace Stripe {
        interface Subscription {
            current_period_end: number
            current_period_start: number
        }
    }
}

export interface PlanInfo {
    priceId: string
    name: string
    interval: 'month' | 'year'
    status: string
    cancelAtPeriodEnd: boolean
    currentPeriodEnd: Date | null
}

export interface PlanOption {
    priceId: string
    name: string
    interval: 'month' | 'year'
    price: string
    savings?: string
    description: string
    popular?: boolean
}
