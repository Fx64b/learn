import { CONTACT_EMAIL } from '@/lib/contact'
import { Check, MailCheck } from 'lucide-react'

import { getTranslations } from 'next-intl/server'
import Link from 'next/link'

import { AuthShell } from '@/components/site/auth-shell'
import { secondaryButton } from '@/components/site/styles'

export default async function VerifyRequestPage() {
    const t = await getTranslations('auth.verifyRequest')

    return (
        <AuthShell>
            <div className="space-y-6 text-center">
                <span className="animate-pop mx-auto flex size-16 items-center justify-center rounded-full bg-emerald-100 text-emerald-600 dark:bg-emerald-950 dark:text-emerald-400">
                    <MailCheck className="size-8" aria-hidden />
                </span>
                <div className="space-y-2">
                    <h1 className="text-2xl font-extrabold tracking-tight">
                        {t('title')}
                    </h1>
                    <p className="font-semibold">{t('subtitle')}</p>
                    <p className="text-muted-foreground">{t('description')}</p>
                </div>
                <ul className="bg-muted/50 space-y-2 rounded-xl p-4 text-left text-sm">
                    {(t.raw('tips') as string[]).map((tip) => (
                        <li
                            key={tip}
                            className="text-muted-foreground flex gap-2"
                        >
                            <Check
                                className="mt-0.5 size-4 shrink-0 text-emerald-500"
                                aria-hidden
                            />
                            {tip}
                        </li>
                    ))}
                </ul>
                <Link href="/login" className={`${secondaryButton} w-full`}>
                    {t('backToLogin')}
                </Link>
                <p className="text-muted-foreground text-sm">
                    {t('trouble')}{' '}
                    <Link
                        href="/contact"
                        className="font-semibold text-emerald-600 hover:underline dark:text-emerald-400"
                    >
                        {t('contactSupport')}
                    </Link>{' '}
                    {t('orWriteAnEmail')}{' '}
                    <a
                        href={`mailto:${CONTACT_EMAIL}`}
                        className="font-semibold text-emerald-600 hover:underline dark:text-emerald-400"
                    >
                        {CONTACT_EMAIL}
                    </a>
                </p>
            </div>
        </AuthShell>
    )
}
