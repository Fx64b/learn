'use client'

import { AlertTriangle, X } from 'lucide-react'

import { useEffect, useState } from 'react'

import { Alert, AlertDescription } from '@/components/ui/alert'
import { Button } from '@/components/ui/button'

interface DismissibleWarningProps {
    id: string
    message: string
    dismissText: string
    variant?: 'default' | 'destructive'
    className?: string
}

export function DismissibleWarning({
    id,
    message,
    dismissText,
    variant = 'default',
    className = '',
}: DismissibleWarningProps) {
    const [isVisible, setIsVisible] = useState(true)
    const [isClient, setIsClient] = useState(false)

    useEffect(() => {
        setIsClient(true)
    }, [id])

    const handleDismiss = () => {
        setIsVisible(false)
    }

    // Don't render anything on server to avoid hydration issues
    if (!isClient || !isVisible) {
        return null
    }

    return (
        <Alert className={`relative ${className}`} variant={variant}>
            <AlertTriangle className="h-4 w-4" />
            <AlertDescription className="pr-8">{message}</AlertDescription>
            <Button
                variant="ghost"
                size="sm"
                className="absolute top-2 right-2 h-6 w-6 p-0"
                onClick={handleDismiss}
                aria-label={dismissText}
            >
                <X className="h-3 w-3" />
            </Button>
        </Alert>
    )
}
