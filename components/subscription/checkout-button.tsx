'use client'

import { Loader2 } from 'lucide-react'
import { toast } from 'sonner'

import React, { useState } from 'react'

import { useRouter } from 'next/navigation'

import { Button } from '@/components/ui/button'

interface CheckoutButtonProps {
    priceId: string
    children: React.ReactNode
    className?: string
    variant?:
        | 'default'
        | 'destructive'
        | 'outline'
        | 'secondary'
        | 'ghost'
        | 'link'
    size?: 'default' | 'sm' | 'lg' | 'icon'
    disabled?: boolean
}

interface CheckoutResponse {
    url?: string
    error?: string
    requiresAuth?: boolean
}

export function CheckoutButton({
    priceId,
    children,
    className,
    variant = 'default',
    size = 'default',
    disabled = false,
}: CheckoutButtonProps) {
    const [isLoading, setIsLoading] = useState(false)
    const router = useRouter()

    const handleCheckout = async () => {
        if (disabled || isLoading) return

        setIsLoading(true)

        try {
            // Validate price ID
            if (!priceId || typeof priceId !== 'string') {
                throw new Error('Invalid pricing plan selected')
            }

            // Call the API
            const response = await fetch(
                '/api/stripe/create-checkout-session',
                {
                    method: 'POST',
                    headers: {
                        'Content-Type': 'application/json',
                    },
                    body: JSON.stringify({ priceId }),
                }
            )

            const data: CheckoutResponse = await response.json()

            // Handle different response scenarios
            if (!response.ok) {
                if (response.status === 401) {
                    toast.error('Please sign in to continue')
                    router.push('/login')
                    return
                }

                if (response.status === 400) {
                    toast.error(
                        data.error || 'Invalid request. Please try again.'
                    )
                    return
                }

                if (response.status === 429) {
                    toast.error(
                        'Too many requests. Please try again in a moment.'
                    )
                    return
                }

                if (response.status >= 500) {
                    toast.error(
                        'Service temporarily unavailable. Please try again later.'
                    )
                    return
                }

                throw new Error(data.error || 'Something went wrong')
            }

            // Success - redirect to Stripe
            if (data.url) {
                // Add a small delay to show loading state
                await new Promise((resolve) => setTimeout(resolve, 500))
                window.location.href = data.url
            } else {
                throw new Error('No checkout URL received')
            }
        } catch (error) {
            console.error('Checkout error:', error)

            // Show user-friendly error messages
            if (error instanceof Error) {
                if (error.message.includes('fetch')) {
                    toast.error(
                        'Network error. Please check your connection and try again.'
                    )
                } else if (error.message.includes('Invalid pricing plan')) {
                    toast.error(
                        'Invalid pricing plan selected. Please refresh the page.'
                    )
                } else {
                    toast.error(
                        error.message ||
                            'Something went wrong. Please try again.'
                    )
                }
            } else {
                toast.error('Something went wrong. Please try again.')
            }
        } finally {
            setIsLoading(false)
        }
    }

    return (
        <Button
            onClick={handleCheckout}
            disabled={disabled || isLoading}
            className={className}
            variant={variant}
            size={size}
            type="button"
        >
            {isLoading ? (
                <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    Processing...
                </>
            ) : (
                children
            )}
        </Button>
    )
}

// Enhanced checkout button with retry capability
interface EnhancedCheckoutButtonProps extends CheckoutButtonProps {
    maxRetries?: number
    retryDelay?: number
    onError?: (error: Error) => void
    onSuccess?: (url: string) => void
}

export function EnhancedCheckoutButton({
    maxRetries = 3,
    retryDelay = 1000,
    onError,
    onSuccess,
    ...props
}: EnhancedCheckoutButtonProps) {
    const [retryCount, setRetryCount] = useState(0)
    const [isLoading, setIsLoading] = useState(false)
    const router = useRouter()

    const handleCheckoutWithRetry = async () => {
        if (props.disabled || isLoading) return

        setIsLoading(true)

        for (let attempt = 0; attempt <= maxRetries; attempt++) {
            try {
                const response = await fetch(
                    '/api/stripe/create-checkout-session',
                    {
                        method: 'POST',
                        headers: {
                            'Content-Type': 'application/json',
                        },
                        body: JSON.stringify({ priceId: props.priceId }),
                    }
                )

                const data: CheckoutResponse = await response.json()

                if (!response.ok) {
                    if (response.status === 401) {
                        toast.error('Please sign in to continue')
                        router.push('/login')
                        return
                    }

                    // Don't retry client errors (4xx)
                    if (response.status >= 400 && response.status < 500) {
                        throw new Error(data.error || 'Invalid request')
                    }

                    // Retry server errors (5xx)
                    if (attempt < maxRetries) {
                        toast.error(
                            `Request failed. Retrying... (${attempt + 1}/${maxRetries})`
                        )
                        await new Promise((resolve) =>
                            setTimeout(resolve, retryDelay * (attempt + 1))
                        )
                        continue
                    }

                    throw new Error(data.error || 'Server error')
                }

                if (data.url) {
                    onSuccess?.(data.url)
                    window.location.href = data.url
                    return
                } else {
                    throw new Error('No checkout URL received')
                }
            } catch (error) {
                if (attempt === maxRetries) {
                    console.error('Checkout failed after retries:', error)
                    const errorMessage =
                        error instanceof Error
                            ? error.message
                            : 'Something went wrong. Please try again.'

                    toast.error(errorMessage)
                    onError?.(
                        error instanceof Error
                            ? error
                            : new Error('Unknown error')
                    )
                }
            }
        }

        setIsLoading(false)
        setRetryCount(0)
    }

    return (
        <Button
            onClick={handleCheckoutWithRetry}
            disabled={props.disabled || isLoading}
            className={props.className}
            variant={props.variant}
            size={props.size}
            type="button"
        >
            {isLoading ? (
                <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    {retryCount > 0
                        ? `Retrying... (${retryCount}/${maxRetries})`
                        : 'Processing...'}
                </>
            ) : (
                props.children
            )}
        </Button>
    )
}
