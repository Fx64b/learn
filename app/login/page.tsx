'use client'

import { cn } from '@/lib/utils'
import { Check, Loader2, Mail, Sparkles } from 'lucide-react'

import { useState } from 'react'

import { signIn } from 'next-auth/react'
import { useTranslations } from 'next-intl'
import Link from 'next/link'
import { useRouter } from 'next/navigation'

import { AuthShell } from '@/components/site/auth-shell'
import { primaryButton } from '@/components/site/styles'

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
        <AuthShell>
            <div className="space-y-6">
                <div className="space-y-2 text-center">
                    <span className="mx-auto flex size-14 items-center justify-center rounded-2xl bg-emerald-100 text-emerald-600 dark:bg-emerald-950 dark:text-emerald-400">
                        <Sparkles className="size-7" aria-hidden />
                    </span>
                    <h1 className="text-2xl font-extrabold tracking-tight">
                        {t('auth.signInTitle')}
                    </h1>
                    <p className="text-muted-foreground">
                        {t('auth.signInDescription')}
                    </p>
                </div>

                <form onSubmit={handleSubmit} className="space-y-3">
                    <label htmlFor="login-email" className="sr-only">
                        {t('auth.emailLabel')}
                    </label>
                    <div className="relative">
                        <Mail
                            className="text-muted-foreground pointer-events-none absolute top-1/2 left-4 size-5 -translate-y-1/2"
                            aria-hidden
                        />
                        <input
                            id="login-email"
                            type="email"
                            placeholder={t('auth.emailPlaceholder')}
                            value={email}
                            onChange={(e) => setEmail(e.target.value)}
                            required
                            autoComplete="email"
                            autoFocus
                            className="bg-background focus-visible:ring-ring/50 h-13 w-full rounded-2xl border-2 pr-4 pl-12 text-base outline-none focus-visible:ring-[3px]"
                        />
                    </div>
                    {message && (
                        <p
                            role={message.type === 'error' ? 'alert' : 'status'}
                            className={cn(
                                'rounded-xl px-4 py-3 text-sm font-medium',
                                message.type === 'success'
                                    ? 'bg-emerald-50 text-emerald-700 dark:bg-emerald-950 dark:text-emerald-300'
                                    : 'bg-rose-50 text-rose-700 dark:bg-rose-950 dark:text-rose-300'
                            )}
                        >
                            {message.text}
                        </p>
                    )}
                    <button
                        type="submit"
                        disabled={isLoading}
                        className={cn(
                            primaryButton,
                            'w-full disabled:opacity-60'
                        )}
                    >
                        {isLoading && (
                            <Loader2 className="size-5 animate-spin" />
                        )}
                        {isLoading
                            ? t('auth.sendingLink')
                            : t('auth.sendLoginLink')}
                    </button>
                </form>

                <ul className="text-muted-foreground space-y-1.5 text-sm">
                    {(t.raw('auth.points') as string[]).map((point) => (
                        <li key={point} className="flex items-center gap-2">
                            <Check
                                className="size-4 shrink-0 text-emerald-500"
                                aria-hidden
                            />
                            {point}
                        </li>
                    ))}
                </ul>

                <p className="text-muted-foreground border-t-2 pt-4 text-center text-xs">
                    {t.rich('auth.legal', {
                        terms: (chunks) => (
                            <Link
                                href="/terms"
                                className="underline underline-offset-2"
                            >
                                {chunks}
                            </Link>
                        ),
                        privacy: (chunks) => (
                            <Link
                                href="/privacy"
                                className="underline underline-offset-2"
                            >
                                {chunks}
                            </Link>
                        ),
                    })}
                </p>
            </div>
        </AuthShell>
    )
}
