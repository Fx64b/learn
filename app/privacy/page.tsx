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
                        {t('legalBasis.title')}
                    </h2>
                    <p className="mb-4">{t('legalBasis.description')}</p>
                    <ul className="mb-4 list-inside list-disc space-y-2">
                        <li>{t('legalBasis.purposes.serviceProvision')}</li>
                        <li>{t('legalBasis.purposes.legitimateInterests')}</li>
                        <li>{t('legalBasis.purposes.consent')}</li>
                        <li>{t('legalBasis.purposes.legal')}</li>
                    </ul>
                </section>

                <section className="mb-8">
                    <h2 className="mb-4 text-2xl font-semibold">
                        {t('dataCollection.title')}
                    </h2>
                    <p className="mb-4">{t('dataCollection.description')}</p>

                    <h3 className="mb-3 text-xl font-medium">
                        {t('dataCollection.personalInfo.title')}
                    </h3>
                    <ul className="mb-4 list-inside list-disc space-y-2">
                        <li>{t('dataCollection.personalInfo.email')}</li>
                        <li>{t('dataCollection.personalInfo.name')}</li>
                        <li>{t('dataCollection.personalInfo.preferences')}</li>
                        <li>{t('dataCollection.personalInfo.avatar')}</li>
                    </ul>

                    <h3 className="mb-3 text-xl font-medium">
                        {t('dataCollection.usageData.title')}
                    </h3>
                    <ul className="mb-4 list-inside list-disc space-y-2">
                        <li>{t('dataCollection.usageData.studyStats')}</li>
                        <li>{t('dataCollection.usageData.deckData')}</li>
                        <li>{t('dataCollection.usageData.analytics')}</li>
                        <li>{t('dataCollection.usageData.technical')}</li>
                        <li>{t('dataCollection.usageData.logs')}</li>
                    </ul>
                </section>

                <section className="mb-8">
                    <h2 className="mb-4 text-2xl font-semibold">
                        {t('thirdParty.title')}
                    </h2>
                    <p className="mb-4">{t('thirdParty.description')}</p>

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
                    <p className="mb-4">{t('dataUse.description')}</p>
                    <ul className="mb-4 list-inside list-disc space-y-2">
                        <li>{t('dataUse.serviceProvision')}</li>
                        <li>{t('dataUse.improvement')}</li>
                        <li>{t('dataUse.communication')}</li>
                        <li>{t('dataUse.legal')}</li>
                        <li>{t('dataUse.marketing')}</li>
                    </ul>
                </section>

                <section className="mb-8">
                    <h2 className="mb-4 text-2xl font-semibold">
                        {t('internationalTransfers.title')}
                    </h2>
                    <p className="mb-4">
                        {t('internationalTransfers.description')}
                    </p>
                    <p className="mb-4">
                        {t('internationalTransfers.safeguards')}
                    </p>
                </section>

                <section className="mb-8">
                    <h2 className="mb-4 text-2xl font-semibold">
                        {t('userRights.title')}
                    </h2>
                    <p className="mb-4">{t('userRights.description')}</p>
                    <ul className="mb-4 list-inside list-disc space-y-2">
                        <li>{t('userRights.access')}</li>
                        <li>{t('userRights.rectification')}</li>
                        <li>{t('userRights.erasure')}</li>
                        <li>{t('userRights.portability')}</li>
                        <li>{t('userRights.objection')}</li>
                        <li>{t('userRights.restriction')}</li>
                        <li>{t('userRights.withdraw')}</li>
                    </ul>
                </section>

                <section className="mb-8">
                    <h2 className="mb-4 text-2xl font-semibold">
                        {t('rightsImplementation.title')}
                    </h2>
                    <ul className="mb-4 list-inside list-disc space-y-2">
                        <li>
                            <strong>Process:</strong>{' '}
                            {t('rightsImplementation.process')}
                        </li>
                        <li>
                            <strong>Timeframe:</strong>{' '}
                            {t('rightsImplementation.timeframe')}
                        </li>
                        <li>
                            <strong>Verification:</strong>{' '}
                            {t('rightsImplementation.verification')}
                        </li>
                        <li>
                            <strong>Appeals:</strong>{' '}
                            {t('rightsImplementation.appeals')}
                        </li>
                        <li>
                            <strong>Authority:</strong>{' '}
                            {t('rightsImplementation.authority')}
                        </li>
                    </ul>
                </section>

                <section className="mb-8">
                    <h2 className="mb-4 text-2xl font-semibold">
                        {t('childrensPrivacy.title')}
                    </h2>
                    <p className="mb-4">{t('childrensPrivacy.description')}</p>
                    <p className="mb-4">{t('childrensPrivacy.parental')}</p>
                </section>

                <section className="mb-8">
                    <h2 className="mb-4 text-2xl font-semibold">
                        {t('dataSecurity.title')}
                    </h2>
                    <p className="mb-4">{t('dataSecurity.description')}</p>
                    <ul className="mb-4 list-inside list-disc space-y-2">
                        <li>{t('dataSecurity.measures.0')}</li>
                        <li>{t('dataSecurity.measures.1')}</li>
                        <li>{t('dataSecurity.measures.2')}</li>
                        <li>{t('dataSecurity.measures.3')}</li>
                        <li>{t('dataSecurity.measures.4')}</li>
                        <li>{t('dataSecurity.measures.5')}</li>
                    </ul>
                    <p className="mb-4">{t('dataSecurity.limitation')}</p>
                </section>

                <section className="mb-8">
                    <h2 className="mb-4 text-2xl font-semibold">
                        {t('dataRetention.title')}
                    </h2>
                    <p className="mb-4">{t('dataRetention.description')}</p>
                    <ul className="mb-4 list-inside list-disc space-y-2">
                        <li>{t('dataRetention.periods.accountData')}</li>
                        <li>{t('dataRetention.periods.studyData')}</li>
                        <li>{t('dataRetention.periods.paymentData')}</li>
                        <li>{t('dataRetention.periods.logs')}</li>
                        <li>{t('dataRetention.periods.marketing')}</li>
                    </ul>
                    <p className="mb-4">{t('dataRetention.deletion')}</p>
                </section>

                <section className="mb-8">
                    <h2 className="mb-4 text-2xl font-semibold">
                        {t('privacyByDesign.title')}
                    </h2>
                    <p className="mb-4">{t('privacyByDesign.description')}</p>
                    <ul className="mb-4 list-inside list-disc space-y-2">
                        <li>{t('privacyByDesign.measures.0')}</li>
                        <li>{t('privacyByDesign.measures.1')}</li>
                        <li>{t('privacyByDesign.measures.2')}</li>
                        <li>{t('privacyByDesign.measures.3')}</li>
                        <li>{t('privacyByDesign.measures.4')}</li>
                        <li>{t('privacyByDesign.measures.5')}</li>
                    </ul>
                </section>

                <section className="mb-8">
                    <h2 className="mb-4 text-2xl font-semibold">
                        {t('dataProtectionAssessment.title')}
                    </h2>
                    <p className="mb-4">
                        {t('dataProtectionAssessment.description')}
                    </p>
                </section>

                <section className="mb-8">
                    <h2 className="mb-4 text-2xl font-semibold">
                        {t('aiProcessing.title')}
                    </h2>
                    <p className="mb-4">{t('aiProcessing.description')}</p>
                    <ul className="mb-4 list-inside list-disc space-y-2">
                        <li>{t('aiProcessing.processing.0')}</li>
                        <li>{t('aiProcessing.processing.1')}</li>
                        <li>{t('aiProcessing.processing.2')}</li>
                        <li>{t('aiProcessing.processing.3')}</li>
                        <li>{t('aiProcessing.processing.4')}</li>
                    </ul>
                    <p className="mb-4">{t('aiProcessing.dataMinimization')}</p>
                    <p className="mb-4">{t('aiProcessing.transparency')}</p>
                </section>

                <section className="mb-8">
                    <h2 className="mb-4 text-2xl font-semibold">
                        {t('cookies.title')}
                    </h2>
                    <p className="mb-4">{t('cookies.description')}</p>

                    <h3 className="mb-3 text-xl font-medium">
                        {t('cookies.essential.title')}
                    </h3>
                    <p className="mb-4">{t('cookies.essential.description')}</p>
                    <p className="mb-4">
                        <strong>Types:</strong> {t('cookies.essential.types')}
                    </p>

                    <h3 className="mb-3 text-xl font-medium">
                        {t('cookies.analytics.title')}
                    </h3>
                    <p className="mb-4">{t('cookies.analytics.description')}</p>
                    <p className="mb-4">{t('cookies.analytics.control')}</p>

                    <p className="mb-4">{t('cookies.control')}</p>
                </section>

                <section className="mb-8">
                    <h2 className="mb-4 text-2xl font-semibold">
                        {t('changes.title')}
                    </h2>
                    <p className="mb-4">{t('changes.description')}</p>
                    <ul className="mb-4 list-inside list-disc space-y-2">
                        <li>{t('changes.notification.0')}</li>
                        <li>{t('changes.notification.1')}</li>
                        <li>{t('changes.notification.2')}</li>
                        <li>{t('changes.notification.3')}</li>
                    </ul>
                    <p className="mb-4">{t('changes.consent')}</p>
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
                    <p className="mb-4">{t('contact.response')}</p>
                </section>
            </div>
        </div>
    )
}
