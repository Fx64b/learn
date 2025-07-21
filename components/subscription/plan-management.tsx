'use client'

import {
    AlertTriangle,
    Check,
    CreditCard,
    ExternalLink,
    Loader2,
    Settings,
    Sparkles,
    Zap,
} from 'lucide-react'
import { toast } from 'sonner'

import { useEffect, useState } from 'react'

import { useTranslations } from 'next-intl'

import {
    createBillingPortalSession,
    getCurrentPlan,
} from '@/app/actions/stripe'

import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import {
    Card,
    CardContent,
    CardDescription,
    CardHeader,
    CardTitle,
} from '@/components/ui/card'
import {
    Dialog,
    DialogContent,
    DialogDescription,
    DialogFooter,
    DialogHeader,
    DialogTitle,
} from '@/components/ui/dialog'

interface PlanInfo {
    priceId: string
    name: string
    interval: 'month' | 'year'
    status: string
    cancelAtPeriodEnd: boolean
    currentPeriodEnd: Date | null
}

interface PlanOption {
    priceId: string
    name: string
    interval: 'month' | 'year'
    price: string
    savings?: string
    description: string
    popular?: boolean
}

const PLAN_OPTIONS: PlanOption[] = [
    {
        priceId: process.env.NEXT_PUBLIC_STRIPE_PRO_MONTHLY_PRICE_ID!,
        name: 'Pro Monthly',
        interval: 'month',
        price: '$4',
        description: 'Perfect for trying out Pro features',
    },
    {
        priceId: process.env.NEXT_PUBLIC_STRIPE_PRO_YEARLY_PRICE_ID!,
        name: 'Pro Yearly',
        interval: 'year',
        price: '$35',
        savings: 'Save $13/year',
        description: 'Best value for committed learners',
        popular: true,
    },
]

export function PlanManagement() {
    const t = useTranslations('profile.billing')
    const [currentPlan, setCurrentPlan] = useState<PlanInfo | null>(null)
    const [isLoading, setIsLoading] = useState(true)
    const [isChanging, setIsChanging] = useState<string | null>(null)
    const [isBillingPortalLoading, setIsBillingPortalLoading] = useState(false)
    const [showConfirmDialog, setShowConfirmDialog] = useState(false)
    const [selectedPlan, setSelectedPlan] = useState<PlanOption | null>(null)

    useEffect(() => {
        loadCurrentPlan()
    }, [])

    const loadCurrentPlan = async () => {
        setIsLoading(true)
        try {
            const result = await getCurrentPlan()
            if (result.success && result.currentPlan) {
                setCurrentPlan(result.currentPlan as PlanInfo)
            }
        } catch (error) {
            console.error('Error loading current plan:', error)
            toast.error(t('loadError'))
        } finally {
            setIsLoading(false)
        }
    }

    const handleBillingPortal = async () => {
        setIsBillingPortalLoading(true)
        try {
            const result = await createBillingPortalSession()
            if (result.success && result.url) {
                window.location.href = result.url
            } else {
                toast.error(result.error || t('billingPortalError'))
            }
        } catch (error) {
            console.error('Error opening billing portal:', error)
            toast.error(t('billingPortalError'))
        } finally {
            setIsBillingPortalLoading(false)
        }
    }

    const handlePlanChangeClick = (plan: PlanOption) => {
        if (!currentPlan || plan.priceId === currentPlan.priceId) {
            return
        }
        setSelectedPlan(plan)
        setShowConfirmDialog(true)
    }

    const handleConfirmPlanChange = async () => {
        if (!selectedPlan) return

        setShowConfirmDialog(false)
        setIsChanging(selectedPlan.priceId)

        try {
            const response = await fetch('/api/stripe/change-plan', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({ newPriceId: selectedPlan.priceId }),
            })

            const data = await response.json()
            if (response.ok && data.success) {
                toast.success(data.message || t('planChanged'))
                setTimeout(async () => {
                    await loadCurrentPlan()
                }, 1000) // Refresh current plan
            } else {
                const errorMessage =
                    data.error || data.details?.[0]?.message || t('changeError')
                toast.error(errorMessage)
            }
        } catch (error) {
            console.error('Error changing plan:', error)
            toast.error(t('changeError'))
        } finally {
            setIsChanging(null)
            setSelectedPlan(null)
        }
    }

    const handleCancelPlanChange = () => {
        setShowConfirmDialog(false)
        setSelectedPlan(null)
    }

    if (isLoading) {
        return (
            <Card>
                <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                        <CreditCard className="h-5 w-5" />
                        {t('title')}
                    </CardTitle>
                </CardHeader>
                <CardContent>
                    <div className="flex items-center justify-center py-8">
                        <Loader2 className="h-6 w-6 animate-spin" />
                    </div>
                </CardContent>
            </Card>
        )
    }

    if (!currentPlan) {
        return (
            <Card>
                <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                        <CreditCard className="h-5 w-5" />
                        {t('title')}
                    </CardTitle>
                </CardHeader>
                <CardContent>
                    <p className="text-muted-foreground py-4 text-center">
                        {t('noPlan')}
                    </p>
                </CardContent>
            </Card>
        )
    }

    return (
        <>
            <Card>
                <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                        <CreditCard className="h-5 w-5" />
                        {t('title')}
                    </CardTitle>
                    <CardDescription>{t('description')}</CardDescription>
                </CardHeader>
                <CardContent className="space-y-6">
                    {/* Current Plan Status */}
                    <div className="bg-muted/50 rounded-lg p-4">
                        <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
                            <div className="flex-1">
                                <div className="flex items-center gap-2">
                                    <h3 className="font-medium">
                                        {t('currentPlan')}
                                    </h3>
                                    <Badge
                                        variant="outline"
                                        className="text-xs"
                                    >
                                        {currentPlan.name}
                                    </Badge>
                                </div>
                                <p
                                    className={`text-sm ${currentPlan.cancelAtPeriodEnd ? 'text-red-500' : 'text-green-500'}`}
                                >
                                    {currentPlan.cancelAtPeriodEnd
                                        ? t('cancellingOn', {
                                              date:
                                                  currentPlan.currentPeriodEnd?.toLocaleDateString() ||
                                                  'unknown',
                                          })
                                        : t('renewsOn', {
                                              date:
                                                  currentPlan.currentPeriodEnd?.toLocaleDateString() ||
                                                  'unknown',
                                          })}
                                </p>
                            </div>
                            <div className="flex flex-row items-center justify-between gap-2">
                                <Button
                                    variant="outline"
                                    size="sm"
                                    onClick={handleBillingPortal}
                                    disabled={isBillingPortalLoading}
                                    className="min-w-40 gap-2 bg-transparent sm:w-auto"
                                >
                                    {isBillingPortalLoading ? (
                                        <>
                                            <Loader2 className="h-3 w-3 animate-spin" />
                                            {t('loading')}
                                        </>
                                    ) : (
                                        <>
                                            <Settings className="h-3 w-3" />
                                            {t('manageSubscription')}
                                            <ExternalLink className="h-3 w-3" />
                                        </>
                                    )}
                                </Button>
                                <div className="flex items-center gap-2">
                                    <Sparkles className="h-4 w-4 text-purple-500" />
                                    <span className="text-sm font-medium">
                                        Pro
                                    </span>
                                </div>
                            </div>
                        </div>
                    </div>

                    {/* Plan Options */}
                    <div>
                        <h3 className="mb-3 font-medium">
                            {t('availablePlans')}
                        </h3>
                        <div className="grid gap-3 md:grid-cols-2">
                            {PLAN_OPTIONS.map((plan) => {
                                const isCurrent =
                                    plan.priceId === currentPlan.priceId
                                const isChangingToPlan =
                                    isChanging === plan.priceId

                                return (
                                    <Card
                                        key={plan.priceId}
                                        className={`relative ${
                                            isCurrent
                                                ? 'border-primary bg-primary/5'
                                                : plan.popular
                                                  ? 'border-purple-200 dark:border-purple-800'
                                                  : ''
                                        }`}
                                    >
                                        {plan.popular && !isCurrent && (
                                            <Badge className="absolute -top-2 left-4 bg-purple-500 hover:bg-purple-600">
                                                {t('popular')}
                                            </Badge>
                                        )}
                                        <CardContent className="p-4">
                                            <div className="space-y-3">
                                                <div>
                                                    <div className="flex items-center justify-between">
                                                        <h4 className="font-medium">
                                                            {plan.name}
                                                        </h4>
                                                        {isCurrent && (
                                                            <Badge
                                                                variant="secondary"
                                                                className="text-xs"
                                                            >
                                                                {t('current')}
                                                            </Badge>
                                                        )}
                                                    </div>
                                                    <p className="text-muted-foreground text-sm">
                                                        {plan.description}
                                                    </p>
                                                </div>
                                                <div className="flex items-baseline gap-1">
                                                    <span className="text-xl font-bold">
                                                        {plan.price}
                                                    </span>
                                                    <span className="text-muted-foreground text-sm">
                                                        /{plan.interval}
                                                    </span>
                                                    {plan.savings && (
                                                        <Badge
                                                            variant="outline"
                                                            className="ml-2 text-xs text-green-600"
                                                        >
                                                            {plan.savings}
                                                        </Badge>
                                                    )}
                                                </div>
                                                <Button
                                                    onClick={() =>
                                                        handlePlanChangeClick(
                                                            plan
                                                        )
                                                    }
                                                    disabled={
                                                        isCurrent ||
                                                        isChangingToPlan ||
                                                        !!isChanging
                                                    }
                                                    variant={
                                                        isCurrent
                                                            ? 'outline'
                                                            : 'default'
                                                    }
                                                    className="w-full"
                                                    size="sm"
                                                >
                                                    {isChangingToPlan ? (
                                                        <>
                                                            <Loader2 className="mr-2 h-3 w-3 animate-spin" />
                                                            {t('changing')}
                                                        </>
                                                    ) : isCurrent ? (
                                                        <>
                                                            <Check className="mr-2 h-3 w-3" />
                                                            {t('currentPlan')}
                                                        </>
                                                    ) : (
                                                        <>
                                                            <Zap className="mr-2 h-3 w-3" />
                                                            {t('switchTo')}
                                                        </>
                                                    )}
                                                </Button>
                                            </div>
                                        </CardContent>
                                    </Card>
                                )
                            })}
                        </div>
                    </div>

                    {/* Proration Notice */}
                    <div className="rounded-lg border border-blue-200 bg-blue-50 p-3 dark:border-blue-800 dark:bg-blue-950/20">
                        <p className="text-sm text-blue-800 dark:text-blue-200">
                            <strong>{t('prorationNotice.title')}</strong>{' '}
                            {t('prorationNotice.description')}
                        </p>
                        <p className="mt-1 text-xs text-blue-700 dark:text-blue-300">
                            {t('prorationNotice.intervalChange')}
                        </p>
                    </div>
                </CardContent>
            </Card>

            {/* Confirmation Dialog */}
            <Dialog
                open={showConfirmDialog}
                onOpenChange={setShowConfirmDialog}
            >
                <DialogContent className="sm:max-w-lg lg:max-w-2xl">
                    <DialogHeader>
                        <DialogTitle className="flex items-center gap-2">
                            <AlertTriangle className="h-5 w-5 text-amber-500" />
                            Confirm Plan Change
                        </DialogTitle>
                        <DialogDescription className="text-left">
                            {selectedPlan && currentPlan && (
                                <>
                                    You're about to switch from{' '}
                                    <span className="font-medium">
                                        {currentPlan.name}
                                    </span>{' '}
                                    to{' '}
                                    <span className="font-medium">
                                        {selectedPlan.name}
                                    </span>
                                    .
                                </>
                            )}
                        </DialogDescription>
                    </DialogHeader>

                    <div className="space-y-4">
                        {/* Plan comparison */}
                        {selectedPlan && currentPlan && (
                            <div className="bg-muted/50 rounded-lg border p-3">
                                <div className="grid grid-cols-2 gap-4 text-sm">
                                    <div>
                                        <p className="text-muted-foreground font-medium">
                                            Current Plan
                                        </p>
                                        <p className="font-semibold">
                                            {currentPlan.name}
                                        </p>
                                        <p className="text-muted-foreground">
                                            Next billing:{' '}
                                            {currentPlan.currentPeriodEnd?.toLocaleDateString()}
                                        </p>
                                    </div>
                                    <div>
                                        <p className="text-muted-foreground font-medium">
                                            New Plan
                                        </p>
                                        <p className="font-semibold">
                                            {selectedPlan.name}
                                        </p>
                                        <p className="text-muted-foreground">
                                            {selectedPlan.price}/
                                            {selectedPlan.interval}
                                        </p>
                                    </div>
                                </div>
                            </div>
                        )}

                        {/* Proration warning */}
                        <div className="rounded-lg border border-amber-200 bg-amber-50 p-3 dark:border-amber-800 dark:bg-amber-950/20">
                            <div className="flex gap-2">
                                <AlertTriangle className="mt-0.5 h-4 w-4 flex-shrink-0 text-amber-600 dark:text-amber-400" />
                                <div className="space-y-1">
                                    <p className="text-sm font-medium text-amber-800 dark:text-amber-200">
                                        Billing Changes
                                    </p>
                                    <p className="text-xs text-amber-700 dark:text-amber-300">
                                        Your subscription will be prorated
                                        automatically. You'll be charged or
                                        credited the difference for the
                                        remaining billing period.
                                    </p>
                                    {selectedPlan &&
                                        currentPlan &&
                                        selectedPlan.interval !==
                                            currentPlan.interval && (
                                            <p className="text-xs text-amber-700 dark:text-amber-300">
                                                Your billing cycle will change
                                                from {currentPlan.interval}ly to{' '}
                                                {selectedPlan.interval}ly.
                                            </p>
                                        )}
                                </div>
                            </div>
                        </div>
                    </div>

                    <DialogFooter className="flex-col gap-2 sm:flex-row">
                        <Button
                            variant="outline"
                            onClick={handleCancelPlanChange}
                            className="w-full bg-transparent sm:w-auto"
                        >
                            Cancel
                        </Button>
                        <Button
                            onClick={handleConfirmPlanChange}
                            className="w-full sm:w-auto"
                        >
                            <Zap className="mr-2 h-4 w-4" />
                            Confirm Switch
                        </Button>
                    </DialogFooter>
                </DialogContent>
            </Dialog>
        </>
    )
}
