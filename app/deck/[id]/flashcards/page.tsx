import { getStudyItems } from '@/db/learn'
import { getDeckById } from '@/db/utils'
import { authOptions } from '@/lib/auth'
import { Plus } from 'lucide-react'

import { getServerSession } from 'next-auth'
import { getTranslations } from 'next-intl/server'
import Link from 'next/link'
import { notFound, redirect } from 'next/navigation'

import { ClassicMode } from '@/components/flashcards/classic-mode'
import {
    EmptySession,
    SessionShell,
} from '@/components/learn/session/learn-page'
import { Button } from '@/components/ui/button'

export default async function FlashcardsPage({
    params,
}: {
    params: Promise<{ id: string }>
}) {
    const { id } = await params
    const session = await getServerSession(authOptions)
    if (!session?.user?.id) redirect('/login')
    const deck = await getDeckById(id, session.user.id)
    if (!deck) notFound()
    const t = await getTranslations('session')

    const items = await getStudyItems(session.user.id, {
        type: 'deck',
        deckId: deck.id,
    })
    const cards = items.map(({ item }) => ({
        id: item.id,
        front: item.front,
        back: item.back,
    }))

    return (
        <SessionShell title={deck.title}>
            {cards.length ? (
                <ClassicMode
                    deckId={deck.id}
                    cards={cards}
                    backHref={`/deck/${deck.id}`}
                />
            ) : (
                <EmptySession
                    icon={<Plus className="size-8" />}
                    title={t('empty.noItemsTitle')}
                    description={t('empty.noItems')}
                    actions={
                        <Button asChild>
                            <Link href={`/deck/${deck.id}/edit`}>
                                {t('empty.addItems')}
                            </Link>
                        </Button>
                    }
                />
            )}
        </SessionShell>
    )
}
