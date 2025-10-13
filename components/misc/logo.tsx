'use client'

import { useUserPreferences } from '@/store/userPreferences'

import Image from 'next/image'
import Link from 'next/link'

export function Logo() {
    const userPreferences = useUserPreferences()
    let theme = userPreferences.theme

    if (theme === 'system') {
        theme = window.matchMedia('(prefers-color-scheme: dark)').matches
            ? 'dark'
            : 'light'
    }

    return (
        <Link href="/" className="flex items-center gap-2 text-2xl font-bold">
            <Image
                alt={'logo'}
                src={theme === 'dark' ? '/logo-dark.png' : '/logo-light.png'}
                width={40}
                height={40}
            />
            Learn
        </Link>
    )
}
