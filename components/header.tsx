import Link from 'next/link'

import { UserNav } from './user-nav'

export function Header() {
    return (
        <header className="border-border border-b">
            <div className="container mx-auto flex max-w-5xl items-center justify-between px-4 py-3">
                <Link href="/" className="text-xl font-bold">
                    Flashcards
                </Link>
                <UserNav />
            </div>
        </header>
    )
}
