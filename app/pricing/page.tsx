'use client'

import { Check, Sparkles } from 'lucide-react'

import { useState } from 'react'

import { useSession } from 'next-auth/react'
import { useTranslations } from 'next-intl'
import { useRouter } from 'next/navigation'

import { CheckoutButton } from '@/components/checkout-button'
import { Button } from '@/components/ui/button'
import {
    Card,
    CardContent,
    CardDescription,
    CardFooter,
    CardHeader,
    CardTitle,
} from '@/components/ui/card'
import { Switch } from '@/components/ui/switch'

export default function PricingPage() {
    const t = useTranslations('pricing')
    const { data: session } = useSession()
    const router = useRouter()
    const [isYearly, setIsYearly] = useState(false)

    const handleAuthRequired = () => {
        router.push('/login')
    }

    return (
        <div className="container mx-auto max-w-6xl px-4 py-16">
            <div className="mb-12 text-center">
                <h1 className="mb-4 text-4xl font-bold">{t('title')}</h1>
                <p className="text-muted-foreground mb-8 text-xl">
                    {t('subtitle')}
                </p>

                <div className="mb-8 flex items-center justify-center gap-4">
                    <span
                        className={
                            !isYearly ? 'font-medium' : 'text-muted-foreground'
                        }
                    >
                        {t('monthly')}
                    </span>
                    <Switch checked={isYearly} onCheckedChange={setIsYearly} />
                    <span
                        className={
                            isYearly ? 'font-medium' : 'text-muted-foreground'
                        }
                    >
                        {t('yearly')}
                        <span className="ml-1 text-green-600">
                            ({t('save', { amount: '13' })})
                        </span>
                    </span>
                </div>
            </div>

            <div className="mx-auto grid max-w-4xl gap-8 md:grid-cols-2">
                {/* Free Plan */}
                <Card>
                    <CardHeader>
                        <CardTitle>{t('free.title')}</CardTitle>
                        <CardDescription>
                            {t('free.description')}
                        </CardDescription>
                        <div className="mt-4 text-3xl font-bold">
                            $0
                            <span className="text-base font-normal">
                                /{t('month')}
                            </span>
                        </div>
                    </CardHeader>
                    <CardContent>
                        <ul className="space-y-2">
                            <li className="flex items-center gap-2">
                                <Check className="h-4 w-4 text-green-600" />
                                <span>{t('free.features.unlimitedCards')}</span>
                            </li>
                            <li className="flex items-center gap-2">
                                <Check className="h-4 w-4 text-green-600" />
                                <span>{t('free.features.basicStats')}</span>
                            </li>
                            <li className="flex items-center gap-2">
                                <Check className="h-4 w-4 text-green-600" />
                                <span>
                                    {t('free.features.spacedRepetition')}
                                </span>
                            </li>
                        </ul>
                    </CardContent>
                    <CardFooter>
                        <Button variant="outline" className="w-full" disabled>
                            {t('currentPlan')}
                        </Button>
                    </CardFooter>
                </Card>

                {/* Pro Plan */}
                <Card className="border-primary">
                    <CardHeader>
                        <div className="flex items-center justify-between">
                            <CardTitle>{t('pro.title')}</CardTitle>
                            <div className="bg-primary text-primary-foreground rounded-md px-2 py-1 text-xs">
                                {t('pro.badge')}
                            </div>
                        </div>
                        <CardDescription>
                            {t('pro.description')}
                        </CardDescription>
                        <div className="mt-4 text-3xl font-bold">
                            ${isYearly ? 35 : 4}
                            <span className="text-base font-normal">
                                /{isYearly ? t('year') : t('month')}
                            </span>
                        </div>
                    </CardHeader>
                    <CardContent>
                        <ul className="space-y-2">
                            <li className="flex items-center gap-2">
                                <Check className="h-4 w-4 text-green-600" />
                                <span>{t('pro.features.everything')}</span>
                            </li>
                            <li className="flex items-center gap-2">
                                <Sparkles className="h-4 w-4 text-purple-600" />
                                <span className="font-medium">
                                    {t('pro.features.aiFlashcards')}
                                </span>
                            </li>
                            <li className="flex items-center gap-2">
                                <Check className="h-4 w-4 text-green-600" />
                                <span>
                                    {t('pro.features.advancedAnalytics')}
                                </span>
                            </li>
                            <li className="flex items-center gap-2">
                                <Check className="h-4 w-4 text-green-600" />
                                <span>{t('pro.features.prioritySupport')}</span>
                            </li>
                        </ul>
                    </CardContent>
                    <CardFooter>
                        {session ? (
                            <CheckoutButton
                                priceId={
                                    isYearly
                                        ? process.env
                                              .NEXT_PUBLIC_STRIPE_PRO_YEARLY_PRICE_ID!
                                        : process.env
                                              .NEXT_PUBLIC_STRIPE_PRO_MONTHLY_PRICE_ID!
                                }
                            >
                                <Sparkles className="mr-2 h-4 w-4" />
                                {t('pro.cta')}
                            </CheckoutButton>
                        ) : (
                            <Button
                                onClick={handleAuthRequired}
                                className="w-full"
                            >
                                <Sparkles className="mr-2 h-4 w-4" />
                                {t('pro.cta')}
                            </Button>
                        )}
                    </CardFooter>
                </Card>
            </div>
        </div>
    )
}
