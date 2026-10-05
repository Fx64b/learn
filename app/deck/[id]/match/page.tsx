import { getDeckById } from '@/db/utils'
import { authOptions } from '@/lib/auth'
import { Shapes } from 'lucide-react'

import { getServerSession } from 'next-auth'
import { getTranslations } from 'next-intl/server'
import Link from 'next/link'
import { notFound, redirect } from 'next/navigation'

import { loadMatchGame } from '@/app/actions/learn'

import {
    EmptySession,
    SessionShell,
} from '@/components/learn/session/learn-page'
import { MatchGame } from '@/components/learn/session/match-game'
import { Button } from '@/components/ui/button'

/** Fewer pairs than this make the game too trivial. */
const MIN_PAIRS = 3

export default async function MatchPage({
    params,
}: {
    params: Promise<{ id: string }>
}) {
    const { id } = await params
    const session = await getServerSession(authOptions)
    if (!session?.user?.id) redirect('/login')
    const deck = await getDeckById(id, session.user.id)
    if (!deck) notFound()
    const t = await getTranslations('match')

    const res = await loadMatchGame(deck.id)
    if (!res.success) notFound()

    return (
        <SessionShell title={`${deck.title} · ${t('title')}`}>
            {res.pairs.length >= MIN_PAIRS ? (
                <MatchGame
                    deckId={deck.id}
                    initialPairs={res.pairs}
                    initialBestMs={res.bestMs}
                    backHref={`/deck/${deck.id}`}
                />
            ) : (
                <EmptySession
                    icon={<Shapes className="size-8" />}
                    title={t('notEnoughTitle')}
                    description={t('notEnough', { min: MIN_PAIRS })}
                    actions={
                        <Button asChild>
                            <Link href={`/deck/${deck.id}/edit`}>
                                {t('addItems')}
                            </Link>
                        </Button>
                    }
                />
            )}
        </SessionShell>
    )
}
