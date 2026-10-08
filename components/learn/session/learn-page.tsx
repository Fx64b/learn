import { getDeckById } from '@/db/utils'
import { authOptions } from '@/lib/auth'
import { BookOpen, PartyPopper, Plus } from 'lucide-react'

import { getServerSession } from 'next-auth'
import { getTranslations } from 'next-intl/server'
import Link from 'next/link'
import { notFound, redirect } from 'next/navigation'

import { loadLearnSession } from '@/app/actions/learn'

import { Button } from '@/components/ui/button'

import { LearnSession } from './learn-session'

export function SessionShell({
    title,
    children,
}: {
    title: string
    children: React.ReactNode
}) {
    return (
        <div className="container mx-auto flex max-w-2xl flex-col gap-4 px-4 py-6 sm:py-8">
            <p className="text-muted-foreground truncate text-center text-sm font-semibold">
                {title}
            </p>
            {children}
        </div>
    )
}

export function EmptySession({
    icon,
    title,
    description,
    actions,
}: {
    icon: React.ReactNode
    title: string
    description: string
    actions: React.ReactNode
}) {
    return (
        <div className="flex flex-col items-center gap-4 py-16 text-center">
            <span className="bg-muted text-muted-foreground flex size-16 items-center justify-center rounded-full">
                {icon}
            </span>
            <h1 className="text-2xl font-bold">{title}</h1>
            <p className="text-muted-foreground max-w-md">{description}</p>
            <div className="flex flex-wrap justify-center gap-2">{actions}</div>
        </div>
    )
}

/** Server page for a learn session (deck id or "due" / "all" / "difficult"). */
export async function LearnPage({ scope }: { scope: string }) {
    const session = await getServerSession(authOptions)
    if (!session?.user?.id) redirect('/login')
    const t = await getTranslations('session')

    const isScope = ['due', 'all', 'difficult'].includes(scope)
    const deck = isScope ? null : await getDeckById(scope, session.user.id)
    if (!isScope && !deck) notFound()

    const res = await loadLearnSession(scope)
    if (!res.success) notFound()

    const title = deck?.title ?? t(`scopes.${scope}`)
    const backHref = deck ? `/deck/${deck.id}` : '/'

    if (!res.exercises.length) {
        return (
            <SessionShell title={title}>
                {res.totalItems === 0 && deck ? (
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
                ) : (
                    <EmptySession
                        icon={
                            res.totalItems ? (
                                <PartyPopper className="size-8" />
                            ) : (
                                <BookOpen className="size-8" />
                            )
                        }
                        title={t('empty.doneTitle')}
                        description={t('empty.done')}
                        actions={
                            <Button asChild variant="outline">
                                <Link href={backHref}>{t('summary.done')}</Link>
                            </Button>
                        }
                    />
                )}
            </SessionShell>
        )
    }

    return (
        <SessionShell title={title}>
            <LearnSession
                mode="learn"
                scope={scope}
                initialExercises={res.exercises}
                backHref={backHref}
            />
        </SessionShell>
    )
}
