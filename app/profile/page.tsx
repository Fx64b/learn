import { authOptions } from '@/lib/auth'
import { getLocale } from '@/lib/locale'
import { BarChart2, UserCircle } from 'lucide-react'

import { getServerSession } from 'next-auth'
import { getTranslations } from 'next-intl/server'
import { redirect } from 'next/navigation'

import { getUserPreferences } from '@/app/actions/preferences'
import { getLearningProgress } from '@/app/actions/progress'

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

export default async function ProfilePage() {
    const session = await getServerSession(authOptions)
    const locale = await getLocale()
    const t = await getTranslations({ locale, namespace: 'profile' })

    if (!session?.user?.id) {
        redirect('/login')
    }

    const progressData = await getLearningProgress()
    const preferencesData = await getUserPreferences()

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

            <Tabs defaultValue="settings" className="space-y-6">
                <TabsList className="grid h-fit w-full max-w-md grid-cols-2">
                    <TabsTrigger
                        value="settings"
                        className="flex items-center gap-2"
                    >
                        <UserCircle className="h-4 w-4" />
                        <span>Einstellungen</span>
                    </TabsTrigger>
                    <TabsTrigger
                        value="progress"
                        className="flex items-center gap-2"
                    >
                        <BarChart2 className="h-4 w-4" />
                        <span>Lernstatistik</span>
                    </TabsTrigger>
                </TabsList>

                <TabsContent value="settings" className="space-y-4">
                    <ProfileSettings initialPreferences={preferences} />
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
                                    Noch keine Lerndaten verfügbar.
                                </p>
                                <p className="text-muted-foreground mt-2 text-sm">
                                    Beginne mit dem Lernen, um hier deinen
                                    Fortschritt zu sehen.
                                </p>
                            </div>
                        )}
                    </div>
                </TabsContent>
            </Tabs>
        </div>
    )
}
