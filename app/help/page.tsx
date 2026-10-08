import { cn } from '@/lib/utils'
import { MessageCircleQuestion } from 'lucide-react'

import { getTranslations } from 'next-intl/server'
import Link from 'next/link'

import { type HelpCategory, HelpCenter } from '@/components/site/help-center'
import { PageHero } from '@/components/site/page-hero'
import {
    chunkyCard,
    primaryButton,
    secondaryButton,
} from '@/components/site/styles'

export async function generateMetadata() {
    const t = await getTranslations('help')
    return { title: t('metaTitle'), description: t('description') }
}

export default async function HelpPage() {
    const t = await getTranslations('help')
    const categories = t.raw('categories') as HelpCategory[]

    return (
        <div className="pb-20">
            <PageHero
                eyebrow={t('eyebrow')}
                title={t('title')}
                description={t('description')}
            />
            <div className="mx-auto max-w-3xl space-y-12 px-4">
                <HelpCenter
                    categories={categories}
                    searchLabel={t('search')}
                    noResults={t('noResults')}
                />
                <div
                    className={cn(
                        chunkyCard,
                        'flex flex-col items-center gap-4 p-8 text-center'
                    )}
                >
                    <MessageCircleQuestion
                        className="size-8 text-sky-500"
                        aria-hidden
                    />
                    <h2 className="text-2xl font-extrabold tracking-tight">
                        {t('stillStuck')}
                    </h2>
                    <p className="text-muted-foreground">
                        {t('stillStuckText')}
                    </p>
                    <div className="flex flex-col gap-3 sm:flex-row">
                        <Link href="/contact" className={primaryButton}>
                            {t('contactButton')}
                        </Link>
                        <Link href="/docs" className={secondaryButton}>
                            {t('docsButton')}
                        </Link>
                    </div>
                </div>
            </div>
        </div>
    )
}
