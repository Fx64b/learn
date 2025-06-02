import { getDeckById } from '@/db/utils'
import { authOptions } from '@/lib/auth'

import { getServerSession } from 'next-auth'
import { getTranslations } from 'next-intl/server'
import Link from 'next/link'
import { notFound } from 'next/navigation'

import { getFlashcardsByDeckId } from '@/app/actions/flashcard'

import { CreateCardForm } from '@/components/create-card-form'
import { Button } from '@/components/ui/button'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'

import CardList from './card-list'
import DeckDetailsForm from './deck-details-form'

export default async function EditDeckPage({
    params,
}: {
    params: Promise<{ id: string }>
}) {
    const { id } = await params
    const session = await getServerSession(authOptions)
    const t = await getTranslations('deck')
    const common = await getTranslations('common')

    if (!session?.user?.id) {
        notFound()
    }

    const deck = await getDeckById(id, session.user.id)

    if (!deck) {
        notFound()
    }

    const flashcards = await getFlashcardsByDeckId(id)

    return (
        <div className="container mx-auto max-w-4xl px-4 py-8">
            <div className="mb-8 flex items-center justify-between">
                <h1 className="text-2xl font-bold">{deck.titel}</h1>
                <Button variant="outline" asChild>
                    <Link href="/">{common('back')}</Link>{' '}
                </Button>
            </div>

            <Tabs defaultValue="cards" className="mb-8">
                <TabsList className="mb-4">
                    <TabsTrigger value="details">
                        {t('tabs.details')}
                    </TabsTrigger>
                    <TabsTrigger value="cards">
                        {t('tabs.editCards')}
                    </TabsTrigger>
                </TabsList>

                <TabsContent value="details">
                    <DeckDetailsForm deck={deck} />
                </TabsContent>

                <TabsContent value="cards">
                    <div className="grid gap-8 md:grid-cols-2">
                        <div>
                            <h2 className="mb-4 text-lg font-semibold">
                                {t('cards.createCard')}
                            </h2>
                            <CreateCardForm deckId={deck.id} />
                        </div>

                        <div>
                            <h2 className="mb-4 text-lg font-semibold">
                                Alle Karten ({flashcards.length})
                            </h2>
                            <CardList flashcards={flashcards} />
                        </div>
                    </div>
                </TabsContent>
            </Tabs>
        </div>
    )
}
