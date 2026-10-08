'use client'

import { cn } from '@/lib/utils'
import { PlanInfo } from '@/types/stripe'
import { Check, Sparkles } from 'lucide-react'
import { toast } from 'sonner'

import { useEffect, useState } from 'react'

import { useSession } from 'next-auth/react'
import { useTranslations } from 'next-intl'
import Link from 'next/link'
import { useRouter } from 'next/navigation'

import { getCurrentPlan } from '@/app/actions/stripe'

import { PageHero } from '@/components/site/page-hero'
import {
    chunkyCard,
    primaryButton,
    secondaryButton,
} from '@/components/site/styles'
import { CheckoutButton } from '@/components/subscription/checkout-button'

export default function PricingPage() {
    const t = useTranslations('pricing')
    const { data: session } = useSession()
    const router = useRouter()
    const [isYearly, setIsYearly] = useState(false)
    const [currentPlan, setCurrentPlan] = useState<PlanInfo | null>(null)

    const handleAuthRequired = () => {
        router.push('/login')
    }

    useEffect(() => {
        let cancelled = false
        getCurrentPlan()
            .then((result) => {
                if (cancelled || !result.success || !result.currentPlan) return
                setCurrentPlan(result.currentPlan as PlanInfo)
                setIsYearly(result.currentPlan.interval === 'year')
            })
            .catch((error) => {
                console.error('Error loading current plan:', error)
                toast.error(t('loadError'))
            })
        return () => {
            cancelled = true
        }
    }, [t])

    const freeFeatures = [
        t('free.features.unlimitedCards'),
        t('free.features.basicStats'),
        t('free.features.spacedRepetition'),
        t('free.features.allModes'),
    ]
    const proFeatures = [
        t('pro.features.everything'),
        t('pro.features.aiFlashcards'),
        t('pro.features.prioritySupport'),
    ]

    return (
        <div className="pb-20">
            <PageHero
                eyebrow={t('eyebrow')}
                title={t('title')}
                description={t('subtitle')}
            >
                <div
                    role="radiogroup"
                    aria-label={t('billingPeriod')}
                    className="bg-muted mx-auto mt-2 inline-flex rounded-2xl border-2 p-1"
                >
                    {[false, true].map((yearly) => (
                        <button
                            key={String(yearly)}
                            type="button"
                            role="radio"
                            aria-checked={isYearly === yearly}
                            onClick={() => setIsYearly(yearly)}
                            className={cn(
                                'rounded-xl px-5 py-2 text-sm font-bold transition-colors',
                                isYearly === yearly
                                    ? 'bg-background shadow-sm'
                                    : 'text-muted-foreground hover:text-foreground'
                            )}
                        >
                            {yearly ? t('yearly') : t('monthly')}
                            {yearly && (
                                <span className="ml-2 rounded-full bg-emerald-100 px-2 py-0.5 text-xs text-emerald-700 dark:bg-emerald-950 dark:text-emerald-300">
                                    {t('save', { amount: '13' })}
                                </span>
                            )}
                        </button>
                    ))}
                </div>
            </PageHero>

            <div className="mx-auto grid max-w-4xl gap-6 px-4 md:grid-cols-2">
                <div
                    className={cn(chunkyCard, 'flex flex-col gap-6 p-6 sm:p-8')}
                >
                    <div className="space-y-2">
                        <h2 className="text-xl font-extrabold">
                            {t('free.title')}
                        </h2>
                        <p className="text-muted-foreground">
                            {t('free.description')}
                        </p>
                    </div>
                    <p className="text-4xl font-extrabold tracking-tight">
                        0 CHF
                        <span className="text-muted-foreground text-base font-semibold">
                            {' '}
                            / {t('month')}
                        </span>
                    </p>
                    <ul className="flex-1 space-y-3">
                        {freeFeatures.map((feature) => (
                            <li key={feature} className="flex gap-3">
                                <Check
                                    className="mt-0.5 size-5 shrink-0 text-emerald-500"
                                    aria-hidden
                                />
                                {feature}
                            </li>
                        ))}
                    </ul>
                    {session ? (
                        <span
                            className={cn(
                                secondaryButton,
                                'pointer-events-none w-full opacity-70'
                            )}
                        >
                            {currentPlan ? t('free.title') : t('currentPlan')}
                        </span>
                    ) : (
                        <Link
                            href="/login"
                            className={cn(secondaryButton, 'w-full')}
                        >
                            {t('free.cta')}
                        </Link>
                    )}
                </div>

                <div
                    className={cn(
                        chunkyCard,
                        'relative flex flex-col gap-6 border-emerald-500 p-6 shadow-xl shadow-emerald-500/10 sm:p-8'
                    )}
                >
                    <span className="absolute -top-3.5 right-6 rounded-full border-2 border-emerald-700 bg-emerald-500 px-3 py-0.5 text-xs font-extrabold tracking-wide text-white uppercase">
                        {t('pro.badge')}
                    </span>
                    <div className="space-y-2">
                        <h2 className="flex items-center gap-2 text-xl font-extrabold">
                            <Sparkles
                                className="size-5 text-violet-500"
                                aria-hidden
                            />
                            {t('pro.title')}
                        </h2>
                        <p className="text-muted-foreground">
                            {t('pro.description')}
                        </p>
                    </div>
                    <p className="text-4xl font-extrabold tracking-tight">
                        {isYearly ? 35 : 4} CHF
                        <span className="text-muted-foreground text-base font-semibold">
                            {' '}
                            / {isYearly ? t('year') : t('month')}
                        </span>
                    </p>
                    <ul className="flex-1 space-y-3">
                        {proFeatures.map((feature, i) => (
                            <li key={feature} className="flex gap-3">
                                {i === 1 ? (
                                    <Sparkles
                                        className="mt-0.5 size-5 shrink-0 text-violet-500"
                                        aria-hidden
                                    />
                                ) : (
                                    <Check
                                        className="mt-0.5 size-5 shrink-0 text-emerald-500"
                                        aria-hidden
                                    />
                                )}
                                <span
                                    className={cn(i === 1 && 'font-semibold')}
                                >
                                    {feature}
                                </span>
                            </li>
                        ))}
                    </ul>
                    {currentPlan ? (
                        <span
                            className={cn(
                                secondaryButton,
                                'pointer-events-none w-full opacity-70'
                            )}
                        >
                            {t('currentPlan')}
                        </span>
                    ) : session ? (
                        <CheckoutButton
                            className={cn(primaryButton, 'w-full')}
                            priceId={
                                isYearly
                                    ? process.env
                                          .NEXT_PUBLIC_STRIPE_PRO_YEARLY_PRICE_ID!
                                    : process.env
                                          .NEXT_PUBLIC_STRIPE_PRO_MONTHLY_PRICE_ID!
                            }
                        >
                            <Sparkles className="size-4" />
                            {t('pro.cta')}
                        </CheckoutButton>
                    ) : (
                        <button
                            type="button"
                            onClick={handleAuthRequired}
                            className={cn(primaryButton, 'w-full')}
                        >
                            <Sparkles className="size-4" />
                            {t('pro.cta')}
                        </button>
                    )}
                </div>
            </div>

            <p className="text-muted-foreground mx-auto mt-10 max-w-xl px-4 text-center text-sm">
                {t.rich('questions', {
                    help: (chunks) => (
                        <Link
                            href="/help"
                            className="font-semibold text-emerald-600 hover:underline dark:text-emerald-400"
                        >
                            {chunks}
                        </Link>
                    ),
                })}
            </p>
        </div>
    )
}
