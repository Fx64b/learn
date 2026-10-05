import { Compass } from 'lucide-react'

import { getTranslations } from 'next-intl/server'
import Link from 'next/link'

import { PageHero } from '@/components/site/page-hero'
import { primaryButton, secondaryButton } from '@/components/site/styles'

export default async function NotFound() {
    const t = await getTranslations('notFound')
    return (
        <div className="pb-20">
            <PageHero
                eyebrow="404"
                title={t('title')}
                description={t('description')}
            >
                <Compass
                    className="mx-auto size-12 text-emerald-500"
                    aria-hidden
                />
                <div className="flex flex-col justify-center gap-3 pt-2 sm:flex-row">
                    <Link href="/" className={primaryButton}>
                        {t('home')}
                    </Link>
                    <Link href="/help" className={secondaryButton}>
                        {t('help')}
                    </Link>
                </div>
            </PageHero>
        </div>
    )
}
