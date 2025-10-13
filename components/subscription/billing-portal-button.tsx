'use client'

import { Loader2 } from 'lucide-react'
import { toast } from 'sonner'

import React, { useState } from 'react'

import { createBillingPortalSession } from '@/app/actions/stripe'

import { Button } from '@/components/ui/button'

interface BillingPortalButtonProps {
    children: React.ReactNode
}

export function BillingPortalButton({ children }: BillingPortalButtonProps) {
    const [isLoading, setIsLoading] = useState(false)

    const handleBillingPortal = async () => {
        setIsLoading(true)

        try {
            const { url } = await createBillingPortalSession()

            if (url) {
                window.location.href = url
            } else {
                toast.error('Failed to create billing portal session')
            }
        } catch (error) {
            console.error('Billing portal error:', error)
            toast.error('Something went wrong. Please try again.')
        } finally {
            setIsLoading(false)
        }
    }

    return (
        <Button
            onClick={handleBillingPortal}
            disabled={isLoading}
            variant="outline"
        >
            {isLoading ? (
                <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    Loading...
                </>
            ) : (
                children
            )}
        </Button>
    )
}
