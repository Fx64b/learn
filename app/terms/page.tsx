import { getLocale } from '@/lib/locale'

import { getTranslations } from 'next-intl/server'

export async function generateMetadata() {
    const locale = await getLocale()
    const t = await getTranslations({ locale, namespace: 'terms' })

    return {
        title: t('title'),
        description: t('description'),
    }
}

export default async function TermsPage() {
    const locale = await getLocale()
    const t = await getTranslations({ locale, namespace: 'terms' })

    return (
        <div className="container mx-auto max-w-4xl px-4 py-8">
            <div className="prose prose-neutral dark:prose-invert max-w-none">
                <h1 className="mb-6 text-3xl font-bold">{t('title')}</h1>
                <p className="text-muted-foreground mb-8">{t('lastUpdated')}</p>

                <section className="mb-8">
                    <h2 className="mb-4 text-2xl font-semibold">
                        {t('acceptance.title')}
                    </h2>
                    <p className="mb-4">{t('acceptance.description')}</p>
                </section>

                <section className="mb-8">
                    <h2 className="mb-4 text-2xl font-semibold">
                        {t('serviceDescription.title')}
                    </h2>
                    <p className="mb-4">
                        {t('serviceDescription.description')}
                    </p>
                    <ul className="mb-4 list-inside list-disc space-y-2">
                        <li>{t('serviceDescription.features.flashcards')}</li>
                        <li>
                            {t('serviceDescription.features.spacedRepetition')}
                        </li>
                        <li>{t('serviceDescription.features.aiGeneration')}</li>
                        <li>{t('serviceDescription.features.analytics')}</li>
                    </ul>
                </section>

                <section className="mb-8">
                    <h2 className="mb-4 text-2xl font-semibold">
                        {t('userAccounts.title')}
                    </h2>
                    <p className="mb-4">{t('userAccounts.description')}</p>
                    <ul className="mb-4 list-inside list-disc space-y-2">
                        <li>{t('userAccounts.responsibilities.accurate')}</li>
                        <li>{t('userAccounts.responsibilities.security')}</li>
                        <li>{t('userAccounts.responsibilities.activities')}</li>
                    </ul>
                </section>

                <section className="mb-8">
                    <h2 className="mb-4 text-2xl font-semibold">
                        {t('payment.title')}
                    </h2>
                    <p className="mb-4">{t('payment.description')}</p>
                    <h3 className="mb-3 text-xl font-medium">
                        {t('payment.billing.title')}
                    </h3>
                    <p className="mb-4">{t('payment.billing.description')}</p>
                    <h3 className="mb-3 text-xl font-medium">
                        {t('payment.refunds.title')}
                    </h3>
                    <p className="mb-4">{t('payment.refunds.description')}</p>
                </section>

                <section className="mb-8">
                    <h2 className="mb-4 text-2xl font-semibold">
                        {t('aiServices.title')}
                    </h2>
                    <p className="mb-4">{t('aiServices.description')}</p>
                    <ul className="mb-4 list-inside list-disc space-y-2">
                        <li>{t('aiServices.limitations.accuracy')}</li>
                        <li>{t('aiServices.limitations.availability')}</li>
                        <li>{t('aiServices.limitations.content')}</li>
                    </ul>
                </section>

                <section className="mb-8">
                    <h2 className="mb-4 text-2xl font-semibold">
                        {t('userContent.title')}
                    </h2>
                    <p className="mb-4">{t('userContent.description')}</p>
                    <h3 className="mb-3 text-xl font-medium">
                        {t('userContent.ownership.title')}
                    </h3>
                    <p className="mb-4">
                        {t('userContent.ownership.description')}
                    </p>
                    <h3 className="mb-3 text-xl font-medium">
                        {t('userContent.prohibited.title')}
                    </h3>
                    <ul className="mb-4 list-inside list-disc space-y-2">
                        <li>{t('userContent.prohibited.illegal')}</li>
                        <li>{t('userContent.prohibited.harmful')}</li>
                        <li>{t('userContent.prohibited.infringement')}</li>
                        <li>{t('userContent.prohibited.spam')}</li>
                    </ul>
                </section>

                <section className="mb-8">
                    <h2 className="mb-4 text-2xl font-semibold">
                        {t('thirdPartyServices.title')}
                    </h2>
                    <p className="mb-4">
                        {t('thirdPartyServices.description')}
                    </p>
                    <h3 className="mb-3 text-xl font-medium">
                        {t('thirdPartyServices.stripe.title')}
                    </h3>
                    <p className="mb-4">
                        {t('thirdPartyServices.stripe.description')}
                    </p>
                    <h3 className="mb-3 text-xl font-medium">
                        {t('thirdPartyServices.vercel.title')}
                    </h3>
                    <p className="mb-4">
                        {t('thirdPartyServices.vercel.description')}
                    </p>
                </section>

                <section className="mb-8">
                    <h2 className="mb-4 text-2xl font-semibold">
                        {t('disclaimers.title')}
                    </h2>
                    <p className="mb-4">{t('disclaimers.description')}</p>
                </section>

                <section className="mb-8">
                    <h2 className="mb-4 text-2xl font-semibold">
                        {t('limitation.title')}
                    </h2>
                    <p className="mb-4">{t('limitation.description')}</p>
                </section>

                <section className="mb-8">
                    <h2 className="mb-4 text-2xl font-semibold">
                        {t('termination.title')}
                    </h2>
                    <p className="mb-4">{t('termination.description')}</p>
                </section>

                <section className="mb-8">
                    <h2 className="mb-4 text-2xl font-semibold">
                        {t('governing.title')}
                    </h2>
                    <p className="mb-4">{t('governing.description')}</p>
                </section>

                <section className="mb-8">
                    <h2 className="mb-4 text-2xl font-semibold">
                        {t('changes.title')}
                    </h2>
                    <p className="mb-4">{t('changes.description')}</p>
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
                    <p className="mb-2">
                        <strong>{t('contact.address')}</strong>
                    </p>
                    <p className="mb-2">{t('contact.developer')}</p>
                    <p className="mb-2">{t('contact.location')}</p>
                </section>
            </div>
        </div>
    )
}
