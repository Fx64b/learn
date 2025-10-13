import { getLocale } from '@/lib/locale'

import { getTranslations } from 'next-intl/server'

export async function generateMetadata() {
    const locale = await getLocale()
    const t = await getTranslations({ locale, namespace: 'imprint' })

    return {
        title: t('title'),
        description: t('description'),
    }
}

export default async function ImprintPage() {
    const locale = await getLocale()
    const t = await getTranslations({ locale, namespace: 'imprint' })

    return (
        <div className="container mx-auto max-w-4xl px-4 py-8">
            <div className="prose prose-neutral dark:prose-invert max-w-none">
                <h1 className="mb-6 text-3xl font-bold">{t('title')}</h1>
                <p className="text-muted-foreground mb-8">{t('lastUpdated')}</p>

                <section className="mb-8">
                    <h2 className="mb-4 text-2xl font-semibold"></h2>
                    <p className="mb-2">
                        <strong>{t('responsible.name')}</strong>{' '}
                        {t('responsible.nameValue')}
                    </p>
                    <p className="mb-2">
                        <strong>{t('responsible.address')}</strong>{' '}
                        {t('responsible.addressValue')}
                    </p>
                    <p className="mb-2">
                        <strong>{t('responsible.email')}</strong>{' '}
                        {t('responsible.emailValue')}
                    </p>
                    <p className="mb-2">
                        <strong>{t('responsible.website')}</strong>{' '}
                        {t('responsible.websiteValue')}
                    </p>
                </section>

                <section className="mb-8">
                    <h2 className="mb-4 text-2xl font-semibold">
                        {t('purpose.title')}
                    </h2>
                    <p className="mb-4">{t('purpose.description')}</p>
                    <ul className="mb-4 list-inside list-disc space-y-2">
                        <li>{t('purpose.services.flashcards')}</li>
                        <li>{t('purpose.services.learning')}</li>
                        <li>{t('purpose.services.ai')}</li>
                        <li>{t('purpose.services.analytics')}</li>
                    </ul>
                </section>

                <section className="mb-8">
                    <h2 className="mb-4 text-2xl font-semibold">
                        {t('hosting.title')}
                    </h2>
                    <p className="mb-4">{t('hosting.description')}</p>
                    <p className="mb-2">
                        <strong>{t('hosting.vercel.name')}</strong>
                    </p>
                    <p className="mb-2">{t('hosting.vercel.website')}</p>
                </section>

                <section className="mb-8">
                    <h2 className="mb-4 text-2xl font-semibold">
                        {t('thirdParty.title')}
                    </h2>
                    <p className="mb-4">{t('thirdParty.description')}</p>

                    <h3 className="mb-3 text-xl font-medium">
                        {t('thirdParty.stripe.title')}
                    </h3>
                    <p className="mb-2">
                        <strong>{t('thirdParty.stripe.name')}</strong>
                    </p>
                    <p className="mb-4">{t('thirdParty.stripe.website')}</p>

                    <h3 className="mb-3 text-xl font-medium">
                        {t('thirdParty.google.title')}
                    </h3>
                    <p className="mb-2">
                        <strong>{t('thirdParty.google.name')}</strong>
                    </p>
                    <p className="mb-4">{t('thirdParty.google.website')}</p>
                </section>

                <section className="mb-8">
                    <h2 className="mb-4 text-2xl font-semibold">
                        {t('jurisdiction.title')}
                    </h2>
                    <p className="mb-4">{t('jurisdiction.description')}</p>
                </section>

                <section className="mb-8">
                    <h2 className="mb-4 text-2xl font-semibold">
                        {t('disclaimer.title')}
                    </h2>
                    <p className="mb-4">{t('disclaimer.description')}</p>
                </section>

                <section className="mb-8">
                    <h2 className="mb-4 text-2xl font-semibold">
                        {t('copyright.title')}
                    </h2>
                    <p className="mb-4">{t('copyright.description')}</p>
                </section>

                <section className="mb-8">
                    <h2 className="mb-4 text-2xl font-semibold">
                        {t('contact.title')}
                    </h2>
                    <p className="mb-4">{t('contact.description')}</p>
                    <p className="mb-2">
                        <strong>{t('contact.email')}</strong>{' '}
                        {t('contact.emailAddress')}
                    </p>
                </section>
            </div>
        </div>
    )
}
