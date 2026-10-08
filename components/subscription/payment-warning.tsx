'use client'

import { AlertTriangle, CreditCard, X } from 'lucide-react'
import { toast } from 'sonner'

import { useEffect, useState } from 'react'

import { useSession } from 'next-auth/react'
import { useTranslations } from 'next-intl'

import { createBillingPortalSession } from '@/app/actions/stripe'

import { Alert, AlertDescription } from '@/components/ui/alert'
import { Button } from '@/components/ui/button'

export interface PaymentRecoveryStatus {
    status: 'grace' | 'warning' | 'limited'
    gracePeriodEnd: Date | null
    daysRemaining: number
    amount: number
    currency: string
}

interface PaymentWarningBannerProps {
    className?: string
}

/** True if the banner was dismissed for this status in the last 24 hours. */
function wasDismissedRecently(status: PaymentRecoveryStatus['status']) {
    const dismissedData = localStorage.getItem('payment-warning-dismissed')
    if (!dismissedData) return false
    try {
        const parsed = JSON.parse(dismissedData)
        const hoursSinceDismissal =
            (Date.now() - parsed.timestamp) / (1000 * 60 * 60)
        return hoursSinceDismissal < 24 && parsed.status === status
    } catch (e) {
        console.error('Error parsing dismissed data:', e)
        // Invalid data, proceed to show banner
        return false
    }
}

export function PaymentWarningBanner({
    className = '',
}: PaymentWarningBannerProps) {
    const { data: session } = useSession()
    const t = useTranslations('payment.recovery')
    const [recoveryStatus, setRecoveryStatus] =
        useState<PaymentRecoveryStatus | null>(null)
    const [isDismissed, setIsDismissed] = useState(false)
    const [isUpdatingPayment, setIsUpdatingPayment] = useState(false)
    const userId = session?.user?.id

    useEffect(() => {
        if (!userId) return
        let cancelled = false

        async function checkSubscriptionAndRecoveryStatus() {
            try {
                // First check if user has valid subscription
                const subscriptionResponse = await fetch(
                    '/api/user/subscription-status'
                )
                if (subscriptionResponse.ok) {
                    const { isPro } = await subscriptionResponse.json()

                    // If user has valid pro subscription, no need to check recovery status
                    if (isPro) {
                        if (!cancelled) setRecoveryStatus(null)
                        return
                    }
                }

                // Only check recovery status if user doesn't have valid subscription
                const recoveryResponse = await fetch(
                    '/api/payment/recovery-status'
                )
                if (recoveryResponse.ok && !cancelled) {
                    const data = await recoveryResponse.json()
                    const status: PaymentRecoveryStatus | null =
                        data.recoveryStatus
                    setIsDismissed(
                        status ? wasDismissedRecently(status.status) : false
                    )
                    setRecoveryStatus(status)
                }
            } catch (error) {
                console.error('Error fetching status:', error)
            }
        }

        void checkSubscriptionAndRecoveryStatus()
        return () => {
            cancelled = true
        }
    }, [userId])

    const handleUpdatePayment = async () => {
        setIsUpdatingPayment(true)
        try {
            const result = await createBillingPortalSession()
            if (result.success && result.url) {
                window.location.href = result.url
            } else {
                toast.error(t('updateError'))
            }
        } catch (error) {
            console.error('Error updating payment:', error)
            toast.error(t('updateError'))
        } finally {
            setIsUpdatingPayment(false)
        }
    }

    const handleDismiss = () => {
        setIsDismissed(true)
        // Store dismissal in localStorage with timestamp
        localStorage.setItem(
            'payment-warning-dismissed',
            JSON.stringify({
                timestamp: Date.now(),
                status: recoveryStatus?.status,
            })
        )
    }

    // Don't show while loading, without recovery status, or when dismissed
    if (!recoveryStatus || isDismissed) {
        return null
    }

    const getAlertVariant = () => {
        switch (recoveryStatus.status) {
            case 'grace':
                return 'default'
            case 'warning':
                return 'destructive'
            case 'limited':
                return 'destructive'
            default:
                return 'default'
        }
    }

    const getAlertIcon = () => {
        switch (recoveryStatus.status) {
            case 'grace':
                return <CreditCard className="h-4 w-4" />
            case 'warning':
            case 'limited':
                return <AlertTriangle className="h-4 w-4" />
            default:
                return <CreditCard className="h-4 w-4" />
        }
    }

    const getMessage = () => {
        const amount = new Intl.NumberFormat('en-US', {
            style: 'currency',
            currency: recoveryStatus.currency.toUpperCase(),
        }).format(recoveryStatus.amount / 100)

        switch (recoveryStatus.status) {
            case 'grace':
                return t('grace.message', {
                    amount,
                    days: recoveryStatus.daysRemaining,
                })
            case 'warning':
                return t('warning.message', {
                    amount,
                    days: recoveryStatus.daysRemaining,
                })
            case 'limited':
                return t('limited.message', { amount })
            default:
                return ''
        }
    }

    return (
        <Alert variant={getAlertVariant()} className={`relative ${className}`}>
            {getAlertIcon()}
            <AlertDescription className="flex w-full items-center justify-between">
                <div className="flex-1">
                    <span>{getMessage()}</span>
                </div>
                <div className="ml-4 flex items-center gap-2">
                    <Button
                        variant="outline"
                        size="sm"
                        onClick={handleUpdatePayment}
                        disabled={isUpdatingPayment}
                        className="h-8"
                    >
                        {isUpdatingPayment ? t('updating') : t('updatePayment')}
                    </Button>
                    <Button
                        variant="ghost"
                        size="sm"
                        onClick={handleDismiss}
                        className="h-8 w-8 p-0"
                    >
                        <X className="h-4 w-4" />
                    </Button>
                </div>
            </AlertDescription>
        </Alert>
    )
}
