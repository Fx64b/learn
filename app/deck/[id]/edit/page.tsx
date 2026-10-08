import { getDeckById } from '@/db/utils'
import { authOptions } from '@/lib/auth'
import { ArrowLeft, ListPlus, Play, Settings2 } from 'lucide-react'

import { getServerSession } from 'next-auth'
import { getTranslations } from 'next-intl/server'
import Link from 'next/link'
import { notFound, redirect } from 'next/navigation'

import { getFlashcardsByDeckId } from '@/app/actions/flashcard'

import { CreateCardForm } from '@/components/flashcards/create-card-form'
import { Button } from '@/components/ui/button'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'

import CardList from './card-list'
import DeckDetailsForm from './deck-details-form'

export default async function EditDeckPage({
    params,
    searchParams,
}: {
    params: Promise<{ id: string }>
    searchParams: Promise<{ tab?: string; new?: string }>
}) {
    const { id } = await params
    const { tab, new: isNew } = await searchParams
    const session = await getServerSession(authOptions)
    if (!session?.user?.id) redirect('/login')

    const deck = await getDeckById(id, session.user.id)
    if (!deck) notFound()

    const [t, flashcards] = await Promise.all([
        getTranslations('decks.edit'),
        getFlashcardsByDeckId(id),
    ])
    const count = flashcards.length

    return (
        <div className="container mx-auto max-w-5xl space-y-6 px-4 py-6 sm:py-8">
            <header className="flex flex-wrap items-start gap-3">
                <Button
                    variant="ghost"
                    size="icon"
                    asChild
                    aria-label={t('back')}
                >
                    <Link href={`/deck/${deck.id}`}>
                        <ArrowLeft className="size-5" />
                    </Link>
                </Button>
                {/* The minimum width moves the buttons to their own row on phones */}
                <div className="min-w-48 flex-1">
                    <p className="text-muted-foreground text-sm font-semibold">
                        {t('eyebrow')}
                    </p>
                    <h1 className="text-2xl font-extrabold tracking-tight break-words sm:text-3xl">
                        {deck.title}
                    </h1>
                </div>
                <div className="flex w-full gap-2 sm:w-auto [&>*]:flex-1 sm:[&>*]:flex-none">
                    <Button variant="outline" asChild>
                        <Link href={`/deck/${deck.id}`}>{t('openDeck')}</Link>
                    </Button>
                    {count > 0 && (
                        <Button
                            asChild
                            className="bg-emerald-500 font-bold text-white hover:bg-emerald-500/90"
                        >
                            <Link href={`/learn/${deck.id}`}>
                                <Play className="fill-current" />
                                {t('learn')}
                            </Link>
                        </Button>
                    )}
                </div>
            </header>

            <Tabs
                defaultValue={tab === 'settings' ? 'settings' : 'items'}
                className="space-y-6"
            >
                <TabsList className="h-auto w-full rounded-xl p-1 sm:w-auto">
                    <TabsTrigger
                        value="items"
                        className="gap-2 rounded-lg px-4 py-2"
                    >
                        <ListPlus className="size-4" />
                        {t('tabs.items')}
                        <span className="bg-muted rounded-full px-2 text-xs tabular-nums">
                            {count}
                        </span>
                    </TabsTrigger>
                    <TabsTrigger
                        value="settings"
                        className="gap-2 rounded-lg px-4 py-2"
                    >
                        <Settings2 className="size-4" />
                        {t('tabs.settings')}
                    </TabsTrigger>
                </TabsList>

                <TabsContent value="items" className="space-y-8">
                    {isNew && count === 0 && (
                        <div className="rounded-2xl border-2 border-b-4 border-emerald-500 bg-emerald-50 p-5 dark:bg-emerald-950/40">
                            <h2 className="text-lg font-bold text-emerald-700 dark:text-emerald-300">
                                {t('welcomeTitle')}
                            </h2>
                            <p className="text-muted-foreground text-sm">
                                {t('welcomeText')}
                            </p>
                        </div>
                    )}
                    <section className="space-y-3">
                        <h2 className="text-lg font-bold">{t('addItems')}</h2>
                        <CreateCardForm deckId={deck.id} />
                    </section>
                    <section className="space-y-3">
                        <h2 className="text-lg font-bold">
                            {t('allItems', { count })}
                        </h2>
                        <CardList flashcards={flashcards} />
                    </section>
                </TabsContent>

                <TabsContent value="settings">
                    <DeckDetailsForm deck={deck} itemCount={count} />
                </TabsContent>
            </Tabs>
        </div>
    )
}
