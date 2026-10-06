import { getTranslations } from 'next-intl/server'

// Served by middleware for every page while maintenance mode is on.
export default async function MaintenancePage() {
    const t = await getTranslations('maintenance')

    return (
        <div className="mx-auto flex min-h-[60vh] max-w-xl flex-col items-center justify-center gap-4 px-4 text-center">
            <h1 className="text-3xl font-bold">{t('title')}</h1>
            <p className="text-muted-foreground">{t('description')}</p>
        </div>
    )
}
