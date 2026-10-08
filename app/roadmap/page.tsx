import { cn } from '@/lib/utils'
import { Gamepad2, LayoutDashboard, Lightbulb, Sparkles } from 'lucide-react'

import { getTranslations } from 'next-intl/server'
import Link from 'next/link'

import { PageHero } from '@/components/site/page-hero'
import { chunkyCard, primaryButton } from '@/components/site/styles'

export async function generateMetadata() {
    const t = await getTranslations('roadmap')
    return { title: t('metaTitle'), description: t('description') }
}

const ITEMS = [
    {
        key: 'ai',
        icon: Sparkles,
        tone: 'bg-violet-100 text-violet-700 dark:bg-violet-950 dark:text-violet-300',
    },
    {
        key: 'uiux',
        icon: LayoutDashboard,
        tone: 'bg-sky-100 text-sky-700 dark:bg-sky-950 dark:text-sky-300',
    },
    {
        key: 'gamification',
        icon: Gamepad2,
        tone: 'bg-orange-100 text-orange-700 dark:bg-orange-950 dark:text-orange-300',
    },
] as const

export default async function RoadmapPage() {
    const t = await getTranslations('roadmap')

    return (
        <div className="pb-20">
            <PageHero
                eyebrow={t('eyebrow')}
                title={t('title')}
                description={t('description')}
                tone="text-violet-600 dark:text-violet-400"
            />
            <div className="mx-auto max-w-3xl space-y-12 px-4">
                <ol className="before:bg-muted relative space-y-4 before:absolute before:top-8 before:bottom-8 before:left-[2.1rem] before:w-1 before:rounded-full">
                    {ITEMS.map(({ key, icon: Icon, tone }) => (
                        <li
                            key={key}
                            className={cn(
                                chunkyCard,
                                'relative flex items-start gap-4 p-5'
                            )}
                        >
                            <span
                                className={cn(
                                    'flex size-11 shrink-0 items-center justify-center rounded-xl',
                                    tone
                                )}
                            >
                                <Icon className="size-6" aria-hidden />
                            </span>
                            <div className="min-w-0 flex-1 space-y-1">
                                <div className="flex flex-wrap items-center gap-2">
                                    <h2 className="text-lg font-bold">
                                        {t(`items.${key}.title`)}
                                    </h2>
                                    <span className="bg-muted text-muted-foreground rounded-full px-2 py-0.5 text-xs font-semibold">
                                        {t('planned')}
                                    </span>
                                </div>
                                <p className="text-muted-foreground">
                                    {t(`items.${key}.text`)}
                                </p>
                            </div>
                        </li>
                    ))}
                </ol>

                <div
                    className={cn(
                        chunkyCard,
                        'flex flex-col items-center gap-4 p-8 text-center'
                    )}
                >
                    <Lightbulb className="size-8 text-amber-500" aria-hidden />
                    <h2 className="text-2xl font-extrabold tracking-tight">
                        {t('ideaTitle')}
                    </h2>
                    <p className="text-muted-foreground">{t('ideaText')}</p>
                    <Link href="/contact" className={primaryButton}>
                        {t('ideaButton')}
                    </Link>
                </div>
            </div>
        </div>
    )
}
