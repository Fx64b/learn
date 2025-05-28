'use client'

import { Suspense, useEffect, useState } from 'react'

import Link from 'next/link'
import { useRouter, useSearchParams } from 'next/navigation'

import { Button } from '@/components/ui/button'
import {
    Card,
    CardContent,
    CardDescription,
    CardHeader,
    CardTitle,
} from '@/components/ui/card'
import {
    InputOTP,
    InputOTPGroup,
    InputOTPSeparator,
    InputOTPSlot,
} from '@/components/ui/input-otp'

// app/verify-code/page.tsx

function VerifyCodeContent() {
    const [code, setCode] = useState('')
    const [isLoading, setIsLoading] = useState(false)
    const [message, setMessage] = useState<{
        type: 'success' | 'error'
        text: string
    } | null>(null)

    const router = useRouter()
    const searchParams = useSearchParams()
    const email = searchParams.get('email')

    useEffect(() => {
        if (!email) {
            router.push('/login')
        }
    }, [email, router])

    // Validate input to ensure only digits
    const handleCodeChange = (value: string) => {
        // Only allow digits 0-9
        const sanitized = value.replace(/[^0-9]/g, '').slice(0, 6)
        setCode(sanitized)

        if (sanitized.length === 6) {
            handleComplete(sanitized)
        }
    }

    const handleComplete = async (value: string) => {
        if (value.length !== 6 || !/^\d{6}$/.test(value)) {
            setMessage({
                type: 'error',
                text: 'Code muss genau 6 Ziffern enthalten.',
            })
            return
        }

        setIsLoading(true)
        setMessage(null)

        try {
            // Use NextAuth's callback endpoint directly with the code as token
            const callbackUrl = `/api/auth/callback/email?email=${encodeURIComponent(
                email!
            )}&token=${value}`

            // Make a GET request to the callback URL
            const response = await fetch(callbackUrl, {
                method: 'GET',
                credentials: 'include',
            })

            if (response.ok) {
                setMessage({
                    type: 'success',
                    text: 'Code erfolgreich verifiziert! Weiterleitung...',
                })

                // Redirect to home page after successful verification
                setTimeout(() => {
                    router.push('/')
                }, 1000)
            } else {
                setMessage({
                    type: 'error',
                    text: 'Ungültiger oder abgelaufener Code. Bitte versuche es erneut.',
                })
                setCode('') // Reset the code input
            }
        } catch (error) {
            console.error('Verification error:', error)
            setMessage({
                type: 'error',
                text: 'Ein unerwarteter Fehler ist aufgetreten.',
            })
            setCode('') // Reset the code input
        } finally {
            setIsLoading(false)
        }
    }

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault()
        if (code.length === 6) {
            handleComplete(code)
        }
    }

    if (!email) {
        return null // Will redirect in useEffect
    }

    return (
        <div className="flex min-h-screen items-center justify-center px-4">
            <Card className="w-full max-w-md">
                <CardHeader>
                    <CardTitle className="text-2xl">Code eingeben</CardTitle>
                    <CardDescription>
                        Wir haben einen 6-stelligen Code an{' '}
                        <strong>{email}</strong> gesendet.
                    </CardDescription>
                </CardHeader>
                <CardContent>
                    <form onSubmit={handleSubmit}>
                        <div className="space-y-6">
                            <div className="flex justify-center">
                                <InputOTP
                                    maxLength={6}
                                    value={code}
                                    onChange={handleCodeChange}
                                    disabled={isLoading}
                                    pattern="[0-9]*"
                                    inputMode="numeric"
                                >
                                    <InputOTPGroup>
                                        <InputOTPSlot index={0} />
                                        <InputOTPSlot index={1} />
                                        <InputOTPSlot index={2} />
                                    </InputOTPGroup>
                                    <InputOTPSeparator />
                                    <InputOTPGroup>
                                        <InputOTPSlot index={3} />
                                        <InputOTPSlot index={4} />
                                        <InputOTPSlot index={5} />
                                    </InputOTPGroup>
                                </InputOTP>
                            </div>

                            {message && (
                                <div
                                    className={`rounded-md p-3 ${
                                        message.type === 'success'
                                            ? 'bg-green-100 text-green-800 dark:bg-green-800/20 dark:text-green-300'
                                            : 'bg-red-100 text-red-800 dark:bg-red-800/20 dark:text-red-300'
                                    }`}
                                >
                                    {message.text}
                                </div>
                            )}

                            <Button
                                type="submit"
                                className="w-full"
                                disabled={isLoading || code.length !== 6}
                            >
                                {isLoading
                                    ? 'Wird verifiziert...'
                                    : 'Code bestätigen'}
                            </Button>
                        </div>
                    </form>

                    <div className="mt-6 text-center">
                        <p className="text-muted-foreground text-sm">
                            Der Code läuft in 5 Minuten ab.
                        </p>
                        <p className="text-muted-foreground mt-2 text-xs">
                            Nur Ziffern 0-9 sind erlaubt.
                        </p>
                    </div>
                </CardContent>

                <div className="flex justify-center pb-6">
                    <Link href="/login" className="w-full px-6">
                        <Button variant="outline" className="w-full">
                            Zurück zur Anmeldung
                        </Button>
                    </Link>
                </div>
            </Card>
        </div>
    )
}

export default function VerifyCodePage() {
    return (
        <Suspense
            fallback={
                <div className="flex min-h-screen items-center justify-center px-4">
                    <Card className="w-full max-w-md">
                        <CardContent className="flex items-center justify-center p-6">
                            <div className="text-center">
                                <div className="mx-auto h-8 w-8 animate-spin rounded-full border-b-2 border-gray-900"></div>
                                <p className="text-muted-foreground mt-2 text-sm">
                                    Laden...
                                </p>
                            </div>
                        </CardContent>
                    </Card>
                </div>
            }
        >
            <VerifyCodeContent />
        </Suspense>
    )
}
