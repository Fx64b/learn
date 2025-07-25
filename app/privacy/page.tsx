import { getLocale } from '@/lib/locale'

import { getTranslations } from 'next-intl/server'

export async function generateMetadata() {
    const locale = await getLocale()
    const t = await getTranslations({ locale, namespace: 'privacy' })

    return {
        title: t('title'),
        description: t('description'),
    }
}

export default async function PrivacyPage() {
    const locale = await getLocale()
    const t = await getTranslations({ locale, namespace: 'privacy' })

    return (
        <div className="container mx-auto max-w-4xl px-4 py-8">
            <div className="prose prose-neutral dark:prose-invert max-w-none">
                <h1 className="mb-6 text-3xl font-bold">{t('title')}</h1>
                <p className="text-muted-foreground mb-8">{t('lastUpdated')}</p>

                <section className="mb-8">
                    <h2 className="mb-4 text-2xl font-semibold">
                        {t('introduction.title')}
                    </h2>
                    <p className="mb-4">{t('introduction.description')}</p>
                    <p className="mb-4">{t('introduction.contact')}</p>
                </section>

                <section className="mb-8">
                    <h2 className="mb-4 text-2xl font-semibold">
                        {t('dataCollection.title')}
                    </h2>
                    <h3 className="mb-3 text-xl font-medium">
                        {t('dataCollection.personalInfo.title')}
                    </h3>
                    <ul className="mb-4 list-inside list-disc space-y-2">
                        <li>{t('dataCollection.personalInfo.email')}</li>
                        <li>{t('dataCollection.personalInfo.name')}</li>
                        <li>{t('dataCollection.personalInfo.preferences')}</li>
                    </ul>

                    <h3 className="mb-3 text-xl font-medium">
                        {t('dataCollection.usageData.title')}
                    </h3>
                    <ul className="mb-4 list-inside list-disc space-y-2">
                        <li>{t('dataCollection.usageData.studyStats')}</li>
                        <li>{t('dataCollection.usageData.deckData')}</li>
                        <li>{t('dataCollection.usageData.analytics')}</li>
                    </ul>
                </section>

                <section className="mb-8">
                    <h2 className="mb-4 text-2xl font-semibold">
                        {t('thirdParty.title')}
                    </h2>

                    <h3 className="mb-3 text-xl font-medium">
                        {t('thirdParty.vercel.title')}
                    </h3>
                    <p className="mb-4">{t('thirdParty.vercel.description')}</p>

                    <h3 className="mb-3 text-xl font-medium">
                        {t('thirdParty.stripe.title')}
                    </h3>
                    <p className="mb-4">{t('thirdParty.stripe.description')}</p>

                    <h3 className="mb-3 text-xl font-medium">
                        {t('thirdParty.ai.title')}
                    </h3>
                    <p className="mb-4">{t('thirdParty.ai.description')}</p>
                </section>

                <section className="mb-8">
                    <h2 className="mb-4 text-2xl font-semibold">
                        {t('dataUse.title')}
                    </h2>
                    <ul className="mb-4 list-inside list-disc space-y-2">
                        <li>{t('dataUse.serviceProvision')}</li>
                        <li>{t('dataUse.improvement')}</li>
                        <li>{t('dataUse.communication')}</li>
                        <li>{t('dataUse.legal')}</li>
                    </ul>
                </section>

                <section className="mb-8">
                    <h2 className="mb-4 text-2xl font-semibold">
                        {t('userRights.title')}
                    </h2>
                    <ul className="mb-4 list-inside list-disc space-y-2">
                        <li>{t('userRights.access')}</li>
                        <li>{t('userRights.rectification')}</li>
                        <li>{t('userRights.erasure')}</li>
                        <li>{t('userRights.portability')}</li>
                        <li>{t('userRights.objection')}</li>
                    </ul>
                </section>

                <section className="mb-8">
                    <h2 className="mb-4 text-2xl font-semibold">
                        {t('dataSecurity.title')}
                    </h2>
                    <p className="mb-4">{t('dataSecurity.description')}</p>
                </section>

                <section className="mb-8">
                    <h2 className="mb-4 text-2xl font-semibold">
                        {t('dataRetention.title')}
                    </h2>
                    <p className="mb-4">{t('dataRetention.description')}</p>
                </section>

                <section className="mb-8">
                    <h2 className="mb-4 text-2xl font-semibold">
                        {t('cookies.title')}
                    </h2>
                    <p className="mb-4">{t('cookies.description')}</p>
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
