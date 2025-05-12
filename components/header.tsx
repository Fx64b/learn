'use client'

import { useUserPreferences } from '@/store/userPreferences'

import Image from 'next/image'
import Link from 'next/link'

import { UserNav } from './user-nav'

export function Header() {
    const userPreferences = useUserPreferences()
    let theme = userPreferences.theme

    if (theme === 'system') {
        theme = window.matchMedia('(prefers-color-scheme: dark)').matches
            ? 'dark'
            : 'light'
    }

    return (
        <header className="border-border border-b">
            <div className="container mx-auto flex max-w-5xl items-center justify-between px-4 py-3">
                <Link
                    href="/"
                    className="flex items-center gap-2 text-2xl font-bold"
                >
                    <Image
                        alt={'logo'}
                        src={
                            theme === 'dark'
                                ? '/logo-dark.png'
                                : '/logo-light.png'
                        }
                        width={40}
                        height={40}
                    />
                    Flashcards
                </Link>
                <UserNav />
            </div>
        </header>
    )
}
