'use client'

import { useSession } from 'next-auth/react'
import { useTranslations } from 'next-intl'
import Link from 'next/link'
import { usePathname } from 'next/navigation'

import { LanguageSelector } from '@/components/misc/language-selector'
import { Logo } from '@/components/misc/logo'

import { UserNav } from './user-nav'

export function Header() {
    const t = useTranslations('navigation')
    const pathname = usePathname()
    const isUrlRoot = pathname === '/'
    const { data: session } = useSession()

    return (
        <header>
            <div className="border-border container mx-auto flex max-w-5xl items-center justify-between border-b px-4 py-3">
                <Logo />

                {isUrlRoot && !session && (
                    <nav className="hidden items-center space-x-6 md:flex">
                        <Link
                            href="#features"
                            className="text-muted-foreground hover:text-foreground transition-colors"
                        >
                            {t('features')}
                        </Link>
                        <Link
                            href="#how-it-works"
                            className="text-muted-foreground hover:text-foreground transition-colors"
                        >
                            {t('howItWorks')}
                        </Link>
                        <Link
                            href="/pricing"
                            className="text-muted-foreground hover:text-foreground transition-colors"
                        >
                            {t('pricing')}
                        </Link>
                    </nav>
                )}

                <div className="flex items-center gap-2">
                    {!session && <LanguageSelector />}
                    <UserNav />
                </div>
            </div>
        </header>
    )
}
