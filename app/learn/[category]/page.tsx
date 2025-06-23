import { getDeckById } from '@/db/utils'
import { ArrowLeft, Info } from 'lucide-react'

import { getTranslations } from 'next-intl/server'
import Link from 'next/link'
import { notFound } from 'next/navigation'

import { getFlashcardsByDeckId } from '@/app/actions/flashcard'

import { Button } from '@/components/ui/button'

import LearnModeClient from './learn-mode-client'

export default async function LernSeite({
    params,
}: {
    params: Promise<{ category: string }>
}) {
    const { category } = await params
    const t = await getTranslations('learn')

    const deck = await getDeckById(category)
    if (!deck) {
        notFound()
    }

    const flashcards = await getFlashcardsByDeckId(category)

    return (
        <div className="container mx-auto flex min-h-screen max-w-4xl flex-col px-4 py-6 sm:py-8">
            <header className="mb-6">
                <div className="mb-4 flex items-center justify-between">
                    <div className="flex items-center gap-2">
                        <Button
                            variant="ghost"
                            size="icon"
                            asChild
                            aria-label="Zurück zur Übersicht"
                        >
                            <Link href="/">
                                <ArrowLeft className="h-5 w-5" />
                            </Link>
                        </Button>
                        <h1 className="text-xl font-bold sm:text-2xl">
                            {deck.title}
                        </h1>
                    </div>

                    <div className="flex items-center gap-2">
                        <Button variant="ghost" size="sm">
                            <Info className="mr-1 h-4 w-4" />
                            {t('help')}
                        </Button>
                    </div>
                </div>
            </header>

            <main className="flex flex-1 flex-col">
                <LearnModeClient deckId={deck.id} flashcards={flashcards} />
            </main>
        </div>
    )
}
