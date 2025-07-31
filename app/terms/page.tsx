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
                        <li>{t('serviceDescription.features.learning')}</li>
                        <li>{t('serviceDescription.features.ai')}</li>
                        <li>{t('serviceDescription.features.analytics')}</li>
                        <li>{t('serviceDescription.features.sync')}</li>
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
                        <li>{t('userAccounts.responsibilities.compliance')}</li>
                        <li>
                            {t('userAccounts.responsibilities.notification')}
                        </li>
                    </ul>
                    <p className="mb-4">{t('userAccounts.age')}</p>
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

                    <h3 className="mb-3 text-xl font-medium">
                        {t('payment.disputes.title')}
                    </h3>
                    <p className="mb-4">{t('payment.disputes.description')}</p>
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
                        <li>{t('aiServices.limitations.liability')}</li>
                        <li>{t('aiServices.limitations.data')}</li>
                    </ul>
                    <p className="mb-4">{t('aiServices.usage')}</p>
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
                        {t('userContent.license.title')}
                    </h3>
                    <p className="mb-4">
                        {t('userContent.license.description')}
                    </p>

                    <h3 className="mb-3 text-xl font-medium">
                        {t('userContent.prohibited.title')}
                    </h3>
                    <p className="mb-4">
                        {t('userContent.prohibited.description')}
                    </p>
                    <ul className="mb-4 list-inside list-disc space-y-2">
                        <li>{t('userContent.prohibited.illegal')}</li>
                        <li>{t('userContent.prohibited.infringement')}</li>
                        <li>{t('userContent.prohibited.privacy')}</li>
                        <li>{t('userContent.prohibited.spam')}</li>
                        <li>{t('userContent.prohibited.malicious')}</li>
                    </ul>
                </section>

                <section className="mb-8">
                    <h2 className="mb-4 text-2xl font-semibold">
                        {t('dmca.title')}
                    </h2>
                    <p className="mb-4">{t('dmca.description')}</p>
                    <ul className="mb-4 list-inside list-disc space-y-2">
                        <li>{t('dmca.requirements.0')}</li>
                        <li>{t('dmca.requirements.1')}</li>
                        <li>{t('dmca.requirements.2')}</li>
                        <li>{t('dmca.requirements.3')}</li>
                        <li>{t('dmca.requirements.4')}</li>
                        <li>{t('dmca.requirements.5')}</li>
                    </ul>
                    <p className="mb-4">{t('dmca.counter')}</p>
                </section>

                <section className="mb-8">
                    <h2 className="mb-4 text-2xl font-semibold">
                        {t('thirdPartyServices.title')}
                    </h2>
                    <p className="mb-4">
                        {t('thirdPartyServices.description')}
                    </p>
                    <ul className="mb-4 list-inside list-disc space-y-2">
                        <li>{t('thirdPartyServices.services.vercel')}</li>
                        <li>{t('thirdPartyServices.services.stripe')}</li>
                        <li>{t('thirdPartyServices.services.google')}</li>
                    </ul>
                    <p className="mb-4">{t('thirdPartyServices.disclaimer')}</p>
                </section>

                <section className="mb-8">
                    <h2 className="mb-4 text-2xl font-semibold">
                        {t('serviceAvailability.title')}
                    </h2>
                    <p className="mb-4">
                        {t('serviceAvailability.description')}
                    </p>
                    <ul className="mb-4 list-inside list-disc space-y-2">
                        <li>{t('serviceAvailability.rights.0')}</li>
                        <li>{t('serviceAvailability.rights.1')}</li>
                        <li>{t('serviceAvailability.rights.2')}</li>
                        <li>{t('serviceAvailability.rights.3')}</li>
                    </ul>
                    <p className="mb-4">
                        {t('serviceAvailability.maintenance')}
                    </p>
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
