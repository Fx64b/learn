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
                <h1 className="text-3xl font-bold mb-6">{t('title')}</h1>
                <p className="text-muted-foreground mb-8">{t('lastUpdated')}</p>

                <section className="mb-8">
                    <h2 className="text-2xl font-semibold mb-4">{t('responsible.title')}</h2>
                    <p className="mb-2">
                        <strong>{t('responsible.name')}</strong> {t('responsible.nameValue')}
                    </p>
                    <p className="mb-2">
                        <strong>{t('responsible.address')}</strong>
                    </p>
                    <p className="mb-2">{t('responsible.addressValue')}</p>
                    <p className="mb-2">
                        <strong>{t('responsible.email')}</strong> {t('responsible.emailValue')}
                    </p>
                    <p className="mb-2">
                        <strong>{t('responsible.website')}</strong> 
                        <a href="https://fx64b.dev" target="_blank" rel="noopener noreferrer" className="ml-2 text-blue-600 hover:underline">
                            https://fx64b.dev
                        </a>
                    </p>
                </section>

                <section className="mb-8">
                    <h2 className="text-2xl font-semibold mb-4">{t('purpose.title')}</h2>
                    <p className="mb-4">{t('purpose.description')}</p>
                    <ul className="list-disc list-inside mb-4 space-y-2">
                        <li>{t('purpose.services.flashcards')}</li>
                        <li>{t('purpose.services.learning')}</li>
                        <li>{t('purpose.services.ai')}</li>
                        <li>{t('purpose.services.analytics')}</li>
                    </ul>
                </section>

                <section className="mb-8">
                    <h2 className="text-2xl font-semibold mb-4">{t('hosting.title')}</h2>
                    <p className="mb-4">{t('hosting.description')}</p>
                    <p className="mb-2">
                        <strong>Vercel Inc.</strong>
                    </p>
                    <p className="mb-2">340 S Lemon Ave #4133</p>
                    <p className="mb-2">Walnut, CA 91789</p>
                    <p className="mb-2">United States</p>
                    <p className="mb-4">
                        <a href="https://vercel.com" target="_blank" rel="noopener noreferrer" className="text-blue-600 hover:underline">
                            https://vercel.com
                        </a>
                    </p>
                </section>

                <section className="mb-8">
                    <h2 className="text-2xl font-semibold mb-4">{t('thirdParty.title')}</h2>
                    
                    <h3 className="text-xl font-medium mb-3">{t('thirdParty.stripe.title')}</h3>
                    <p className="mb-2">Stripe, Inc.</p>
                    <p className="mb-2">510 Townsend Street</p>
                    <p className="mb-2">San Francisco, CA 94103</p>
                    <p className="mb-4">United States</p>
                    
                    <h3 className="text-xl font-medium mb-3">{t('thirdParty.google.title')}</h3>
                    <p className="mb-2">Google LLC</p>
                    <p className="mb-2">1600 Amphitheatre Parkway</p>
                    <p className="mb-2">Mountain View, CA 94043</p>
                    <p className="mb-4">United States</p>
                </section>

                <section className="mb-8">
                    <h2 className="text-2xl font-semibold mb-4">{t('jurisdiction.title')}</h2>
                    <p className="mb-4">{t('jurisdiction.description')}</p>
                </section>

                <section className="mb-8">
                    <h2 className="text-2xl font-semibold mb-4">{t('disclaimer.title')}</h2>
                    <p className="mb-4">{t('disclaimer.description')}</p>
                </section>

                <section className="mb-8">
                    <h2 className="text-2xl font-semibold mb-4">{t('copyright.title')}</h2>
                    <p className="mb-4">{t('copyright.description')}</p>
                </section>

                <section className="mb-8">
                    <h2 className="text-2xl font-semibold mb-4">{t('contact.title')}</h2>
                    <p className="mb-4">{t('contact.description')}</p>
                    <p className="mb-2">
                        <strong>{t('contact.email')}</strong> {t('contact.emailAddress')}
                    </p>
                </section>
            </div>
        </div>
    )
}