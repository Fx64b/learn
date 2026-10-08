import { getDeckById } from '@/db/utils'
import { authOptions } from '@/lib/auth'
import { Plus } from 'lucide-react'

import { getServerSession } from 'next-auth'
import { getTranslations } from 'next-intl/server'
import Link from 'next/link'
import { notFound, redirect } from 'next/navigation'

import { loadTest } from '@/app/actions/learn'

import {
    EmptySession,
    SessionShell,
} from '@/components/learn/session/learn-page'
import { LearnSession } from '@/components/learn/session/learn-session'
import { Button } from '@/components/ui/button'

export default async function TestPage({
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

    const res = await loadTest(deck.id)
    if (!res.success) notFound()

    return (
        <SessionShell title={`${deck.title} · ${t('testTitle')}`}>
            {res.exercises.length ? (
                <LearnSession
                    mode="test"
                    scope={deck.id}
                    initialExercises={res.exercises}
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
