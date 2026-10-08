import { CONTACT_EMAIL } from '@/lib/contact'
import { cn } from '@/lib/utils'
import {
    BookOpen,
    Bug,
    CreditCard,
    LifeBuoy,
    Lightbulb,
    Mail,
    ShieldCheck,
    Wrench,
} from 'lucide-react'

import { getTranslations } from 'next-intl/server'
import Link from 'next/link'

import { CopyButton } from '@/components/site/copy-button'
import { PageHero } from '@/components/site/page-hero'
import { chunkyCard, primaryButton } from '@/components/site/styles'

export async function generateMetadata() {
    const t = await getTranslations('contact')
    return { title: t('metaTitle'), description: t('description') }
}

const TOPICS = [
    { key: 'support', icon: Wrench, tone: 'text-sky-500' },
    { key: 'billing', icon: CreditCard, tone: 'text-emerald-500' },
    { key: 'feedback', icon: Lightbulb, tone: 'text-amber-500' },
    { key: 'privacy', icon: ShieldCheck, tone: 'text-violet-500' },
] as const

const mailto = (subject?: string) =>
    `mailto:${CONTACT_EMAIL}${subject ? `?subject=${encodeURIComponent(subject)}` : ''}`

export default async function ContactPage() {
    const t = await getTranslations('contact')

    return (
        <div className="pb-20">
            <PageHero
                eyebrow={t('eyebrow')}
                title={t('title')}
                description={t('description')}
                tone="text-sky-600 dark:text-sky-400"
            />
            <div className="mx-auto max-w-3xl space-y-12 px-4">
                <div
                    className={cn(
                        chunkyCard,
                        'flex flex-col items-center gap-5 p-8 text-center'
                    )}
                >
                    <span className="flex size-14 items-center justify-center rounded-2xl bg-emerald-100 text-emerald-600 dark:bg-emerald-950 dark:text-emerald-400">
                        <Mail className="size-7" aria-hidden />
                    </span>
                    <div>
                        <p className="text-muted-foreground text-sm font-semibold">
                            {t('emailLabel')}
                        </p>
                        <a
                            href={mailto()}
                            className="text-2xl font-extrabold tracking-tight break-all hover:underline sm:text-3xl"
                        >
                            {CONTACT_EMAIL}
                        </a>
                    </div>
                    <div className="flex flex-col gap-3 sm:flex-row">
                        <a href={mailto()} className={primaryButton}>
                            <Mail className="size-4" aria-hidden />
                            {t('write')}
                        </a>
                        <CopyButton
                            value={CONTACT_EMAIL}
                            label={t('copy')}
                            copiedLabel={t('copied')}
                        />
                    </div>
                </div>

                <section className="space-y-4">
                    <h2 className="text-center text-2xl font-extrabold tracking-tight">
                        {t('topicsTitle')}
                    </h2>
                    <div className="grid gap-3 sm:grid-cols-2">
                        {TOPICS.map(({ key, icon: Icon, tone }) => (
                            <a
                                key={key}
                                href={mailto(t(`topics.${key}.subject`))}
                                className={cn(
                                    chunkyCard,
                                    'hover:bg-accent flex items-start gap-3 p-4 transition-colors'
                                )}
                            >
                                <Icon
                                    className={cn(
                                        'mt-0.5 size-5 shrink-0',
                                        tone
                                    )}
                                    aria-hidden
                                />
                                <span>
                                    <span className="block font-bold">
                                        {t(`topics.${key}.title`)}
                                    </span>
                                    <span className="text-muted-foreground block text-sm">
                                        {t(`topics.${key}.text`)}
                                    </span>
                                </span>
                            </a>
                        ))}
                    </div>
                </section>

                <section className="space-y-4">
                    <h2 className="text-center text-2xl font-extrabold tracking-tight">
                        {t('selfHelpTitle')}
                    </h2>
                    <div className="grid gap-3 sm:grid-cols-3">
                        {(
                            [
                                ['/help', LifeBuoy, 'helpLink', 'helpText'],
                                ['/docs', BookOpen, 'docsLink', 'docsText'],
                                [
                                    'https://github.com/Fx64b/learn/issues',
                                    Bug,
                                    'githubLink',
                                    'githubText',
                                ],
                            ] as const
                        ).map(([href, Icon, title, text]) => (
                            <Link
                                key={href}
                                href={href}
                                className={cn(
                                    chunkyCard,
                                    'hover:bg-accent space-y-1 p-4 transition-colors'
                                )}
                            >
                                <Icon
                                    className="text-muted-foreground size-5"
                                    aria-hidden
                                />
                                <span className="block font-bold">
                                    {t(title)}
                                </span>
                                <span className="text-muted-foreground block text-sm">
                                    {t(text)}
                                </span>
                            </Link>
                        ))}
                    </div>
                </section>
            </div>
        </div>
    )
}
