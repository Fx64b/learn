import { authOptions } from '@/lib/auth'

import { getServerSession } from 'next-auth'
import { cookies } from 'next/headers'

import { getUserPreferences } from '@/app/actions/preferences'

export async function getLocale(): Promise<'en' | 'de'> {
    const session = await getServerSession(authOptions)

    if (session?.user?.id) {
        const preferences = await getUserPreferences()
        if (preferences?.locale && ['en', 'de'].includes(preferences.locale)) {
            return preferences.locale as 'en' | 'de'
        }
    }

    // For non-authenticated users or as fallback, check cookies
    const cookieStore = await cookies()
    const localeCookie = cookieStore.get('preferred-locale')

    if (localeCookie?.value && ['en', 'de'].includes(localeCookie.value)) {
        return localeCookie.value as 'en' | 'de'
    }

    return 'en'
}
