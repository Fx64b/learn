import { authOptions } from '@/lib/auth'

import { getServerSession } from 'next-auth'

import { getUserPreferences } from '@/app/actions/preferences'

export async function getLocale(): Promise<'en' | 'de'> {
    const session = await getServerSession(authOptions)

    if (session?.user?.id) {
        const preferences = await getUserPreferences()
        if (preferences?.locale && ['en', 'de'].includes(preferences.locale)) {
            return preferences.locale as 'en' | 'de'
        }
    }

    return 'en'
}
