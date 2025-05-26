'use client'

import { useSession } from 'next-auth/react'
import Link from 'next/link'
import { usePathname } from 'next/navigation'

import { Logo } from '@/components/misc/logo'

import { UserNav } from './user-nav'

export function Header() {
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
                            Features
                        </Link>
                        <Link
                            href="#how-it-works"
                            className="text-muted-foreground hover:text-foreground transition-colors"
                        >
                            How it Works
                        </Link>
                        <Link
                            href="/todo"
                            className="text-muted-foreground hover:text-foreground transition-colors"
                        >
                            Pricing
                        </Link>
                    </nav>
                )}

                <UserNav />
            </div>
        </header>
    )
}
