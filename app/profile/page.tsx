import { authOptions } from '@/lib/auth'

import { getServerSession } from 'next-auth'
import { redirect } from 'next/navigation'

import { getUserPreferences } from '@/app/actions/preferences'
import { getLearningProgress } from '@/app/actions/progress'

import { ProfileSettings } from '@/components/profile-settings'
import { ProgressDashboard } from '@/components/progress-dashboard'

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
    }

    return (
        <div className="container mx-auto max-w-5xl px-4 py-6 sm:py-10">
            <div className="mb-8">
                <h1 className="mb-2 text-3xl font-bold">Mein Profil</h1>
                <p className="text-muted-foreground">
                    Hier kannst du deine Einstellungen anpassen und deinen
                    Lernfortschritt einsehen.
                </p>
            </div>

            <div className="mb-8">
                <h2 className="mb-4 text-xl font-semibold">Einstellungen</h2>
                <ProfileSettings initialPreferences={preferences} />
            </div>

            <div className="mb-6">
                <h2 className="mb-4 text-xl font-semibold">Lernstatistik</h2>
                <div className="bg-card rounded-lg border p-4">
                    {progressData ? (
                        <ProgressDashboard data={progressData} />
                    ) : (
                        <div className="text-muted-foreground py-8 text-center">
                            <p>Noch keine Lerndaten verfügbar.</p>
                        </div>
                    )}
                </div>
            </div>
        </div>
    )
}
