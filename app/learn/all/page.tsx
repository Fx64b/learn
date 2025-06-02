import { getAllFlashcards } from '@/db/utils'
import { authOptions } from '@/lib/auth'
import { ArrowLeft } from 'lucide-react'

import { getServerSession } from 'next-auth'
import { getTranslations } from 'next-intl/server'
import Link from 'next/link'

import LernModusClient from '@/app/learn/[kategorie]/lern-modus-client'

import { Button } from '@/components/ui/button'

export default async function AllCardsPage() {
    const session = await getServerSession(authOptions)
    const t = await getTranslations('learn')

    if (!session?.user?.id) {
        return <div>{t('loginRequired')}</div>
    }

    const allCardsData = await getAllFlashcards(session.user.id)
    const allCards = allCardsData.map((item) => item.flashcards)

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
                        {t('allCards')}
                    </h1>
                </div>
            </header>

            <main className="flex flex-1 flex-col">
                <LernModusClient deckId="all" flashcards={allCards || []} />
            </main>
        </div>
    )
}
