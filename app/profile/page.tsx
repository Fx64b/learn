import { authOptions } from '@/lib/auth'
import { getLocale } from '@/lib/locale'
import { isUserPro } from '@/lib/subscription'
import { BarChart2, CreditCard, UserCircle } from 'lucide-react'

import { getServerSession } from 'next-auth'
import { getTranslations } from 'next-intl/server'
import { redirect } from 'next/navigation'

import { getUserPreferences } from '@/app/actions/preferences'
import { getLearningProgress } from '@/app/actions/progress'

import { PlanManagement } from '@/components/plan-management'
import { ProfileSettings } from '@/components/profile-settings'
import { ProgressDashboard } from '@/components/statistics/progress-dashboard'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'

function ensureValidDirection(direction: unknown): 'horizontal' | 'vertical' {
    if (direction === 'horizontal' || direction === 'vertical') {
        return direction
    }
    return 'horizontal'
}

function ensureValidTheme(theme: unknown): 'light' | 'dark' | 'system' {
    if (theme === 'light' || theme === 'dark' || theme === 'system') {
        return theme
    }
    return 'dark'
}

export default async function ProfilePage({
    searchParams,
}: {
    searchParams: Promise<{ tab?: string }>
}) {
    const session = await getServerSession(authOptions)
    const locale = await getLocale()
    const t = await getTranslations({ locale, namespace: 'profile' })
    const { tab } = await searchParams

    if (!session?.user?.id) {
        redirect('/login')
    }

    const progressData = await getLearningProgress()
    const preferencesData = await getUserPreferences()
    const isPro = await isUserPro(session.user.id)

    const preferences = {
        userId: session.user.id,
        animationsEnabled: preferencesData?.animationsEnabled ?? false,
        animationSpeed: preferencesData?.animationSpeed ?? 200,
        animationDirection: ensureValidDirection(
            preferencesData?.animationDirection
        ),
        theme: ensureValidTheme(preferencesData?.theme),
        locale: preferencesData?.locale ?? 'en',
    }

    const defaultTab = tab?.split('?')[0] || 'settings'

    return (
        <div className="container mx-auto max-w-5xl px-4 py-8 sm:py-12">
            <div className="mb-8 space-y-2">
                <h1 className="text-3xl font-bold tracking-tight">
                    {t('title')}
                </h1>
                <p className="text-muted-foreground">
                    <b>{t('email')}:</b> {session.user.email}
                </p>
            </div>

            <Tabs defaultValue={defaultTab} className="space-y-6">
                <TabsList className="grid h-fit w-full max-w-md grid-cols-3">
                    <TabsTrigger
                        value="settings"
                        className="flex items-center gap-2"
                    >
                        <UserCircle className="h-4 w-4" />
                        <span>{t('tabs.settings')}</span>
                    </TabsTrigger>
                    <TabsTrigger
                        value="billing"
                        className="flex items-center gap-2"
                    >
                        <CreditCard className="h-4 w-4" />
                        <span>{t('tabs.billing')}</span>
                    </TabsTrigger>
                    <TabsTrigger
                        value="progress"
                        className="flex items-center gap-2"
                    >
                        <BarChart2 className="h-4 w-4" />
                        <span>{t('tabs.statistics')}</span>
                    </TabsTrigger>
                </TabsList>

                <TabsContent value="settings" className="space-y-4">
                    <ProfileSettings initialPreferences={preferences} />
                </TabsContent>

                <TabsContent value="billing" className="space-y-4">
                    {isPro ? (
                        <PlanManagement />
                    ) : (
                        <div className="bg-card rounded-lg border p-6 shadow-sm">
                            <div className="flex flex-col items-center justify-center py-12 text-center">
                                <div className="bg-muted mb-4 rounded-full p-3">
                                    <CreditCard className="text-muted-foreground h-6 w-6" />
                                </div>
                                <p className="text-muted-foreground mb-4">
                                    {t('billing.noSubscription')}
                                </p>
                                <p className="text-muted-foreground mb-6 text-sm">
                                    {t('billing.upgradePrompt')}
                                </p>
                                <a
                                    href="/pricing"
                                    className="bg-primary text-primary-foreground hover:bg-primary/90 inline-flex items-center justify-center rounded-md px-4 py-2 text-sm font-medium"
                                >
                                    {t('billing.viewPlans')}
                                </a>
                            </div>
                        </div>
                    )}
                </TabsContent>

                <TabsContent value="progress" className="space-y-4">
                    <div className="bg-card rounded-lg border p-6 shadow-sm">
                        {progressData ? (
                            <ProgressDashboard data={progressData} />
                        ) : (
                            <div className="flex flex-col items-center justify-center py-12 text-center">
                                <div className="bg-muted mb-4 rounded-full p-3">
                                    <BarChart2 className="text-muted-foreground h-6 w-6" />
                                </div>
                                <p className="text-muted-foreground">
                                    {t('noData')}
                                </p>
                                <p className="text-muted-foreground mt-2 text-sm">
                                    {t('startLearning')}
                                </p>
                            </div>
                        )}
                    </div>
                </TabsContent>
            </Tabs>
        </div>
    )
}
