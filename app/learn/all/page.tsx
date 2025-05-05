import { getAllFlashcards } from '@/db/utils'
import { authOptions } from '@/lib/auth'
import { ArrowLeft } from 'lucide-react'

import { getServerSession } from 'next-auth'
import Link from 'next/link'

import LernModusClient from '@/app/learn/[kategorie]/lern-modus-client'

import { Button } from '@/components/ui/button'

export default async function AllCardsPage() {
    const session = await getServerSession(authOptions)

    if (!session?.user?.id) {
        return <div>Please login to view this page</div>
    }

    const allCards = await getAllFlashcards()

    return (
        <div className="container mx-auto flex min-h-screen max-w-4xl flex-col px-4 py-6 sm:py-8">
            <header className="mb-6">
                <div className="mb-4 flex items-center gap-4">
                    <Button variant="ghost" size="icon" asChild>
                        <Link href="/">
                            <ArrowLeft className="h-5 w-5" />
                        </Link>
                    </Button>
                    <h1 className="text-xl font-bold sm:text-2xl">
                        Alle Karten wiederholen
                    </h1>
                </div>
            </header>

            <main className="flex flex-1 flex-col">
                <LernModusClient
                    deckId="all"
                    deckTitel="Alle Karten"
                    flashcards={allCards}
                />
            </main>
        </div>
    )
}
