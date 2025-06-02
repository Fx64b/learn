'use client'

import { useState } from 'react'

import { signIn } from 'next-auth/react'
import { useTranslations } from 'next-intl'
import { useRouter } from 'next/navigation'

import { Button } from '@/components/ui/button'
import {
    Card,
    CardContent,
    CardDescription,
    CardFooter,
    CardHeader,
    CardTitle,
} from '@/components/ui/card'
import { Input } from '@/components/ui/input'

export default function LoginPage() {
    const t = useTranslations()
    const router = useRouter()
    const [email, setEmail] = useState('')
    const [isLoading, setIsLoading] = useState(false)
    const [message, setMessage] = useState<{
        type: 'success' | 'error'
        text: string
    } | null>(null)

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault()
        setIsLoading(true)
        setMessage(null)

        try {
            const result = await signIn('email', {
                email,
                redirect: false,
                callbackUrl: '/',
            })

            if (result?.error) {
                console.error('Login error:', result.error)
                setMessage({
                    type: 'error',
                    text: t('auth.loginError'),
                })
            } else {
                setEmail('')
                setMessage({
                    type: 'success',
                    text: t('auth.checkEmail'),
                })
                router.push('/verify-request')
            }
        } catch (error) {
            console.error('Login error:', error)
            setMessage({
                type: 'error',
                text: t('auth.unexpectedError'),
            })
        } finally {
            setIsLoading(false)
        }
    }

    return (
        <div className="flex min-h-screen items-center justify-center px-4">
            <Card className="w-full max-w-md">
                <CardHeader>
                    <CardTitle className="text-2xl">
                        {t('auth.signInTitle')}
                    </CardTitle>
                    <CardDescription>
                        {t('auth.signInDescription')}
                    </CardDescription>
                </CardHeader>
                <CardContent>
                    <form onSubmit={handleSubmit}>
                        <div className="space-y-4">
                            <div>
                                <Input
                                    type="email"
                                    placeholder={t('auth.emailPlaceholder')}
                                    value={email}
                                    onChange={(e) => setEmail(e.target.value)}
                                    required
                                    autoComplete="email"
                                    className="w-full"
                                />
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
                                disabled={isLoading}
                            >
                                {isLoading
                                    ? t('auth.sendingLink')
                                    : t('auth.sendLoginLink')}
                            </Button>
                        </div>
                    </form>
                </CardContent>
                <CardFooter className="flex justify-center">
                    <p className="text-muted-foreground text-sm">
                        {t('auth.verifyDescription')}
                    </p>
                </CardFooter>
            </Card>
        </div>
    )
}
