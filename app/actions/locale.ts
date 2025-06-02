'use server'

import { authOptions } from '@/lib/auth'

import { getServerSession } from 'next-auth'
import { revalidatePath } from 'next/cache'
import { cookies } from 'next/headers'

import { updateUserPreferences } from './preferences'


export async function updateLocale(locale: 'en' | 'de') {
    const session = await getServerSession(authOptions)

    const cookieStore = await cookies()
    cookieStore.set('preferred-locale', locale, {
        httpOnly: true,
        secure: process.env.NODE_ENV === 'production',
        sameSite: 'lax',
        path: '/',
        maxAge: 60 * 60 * 24 * 365, // 1 year
    })

    if (session?.user?.id) {
        await updateUserPreferences({ locale })
    }

    revalidatePath('/', 'layout')
}
