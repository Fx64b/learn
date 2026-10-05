import { getDeckRecord, getStudyItems } from '@/db/learn'
import { getDeckById } from '@/db/utils'
import { authOptions } from '@/lib/auth'
import { parseCategoryToTags } from '@/lib/category-parser'
import { countMastery, getMastery, isDue } from '@/lib/learn'
import { cn } from '@/lib/utils'
import {
    ArrowLeft,
    GraduationCap,
    Layers,
    Pencil,
    Play,
    Shapes,
    Timer,
    Trophy,
} from 'lucide-react'

import { getServerSession } from 'next-auth'
import { getTranslations } from 'next-intl/server'
import Link from 'next/link'
import { notFound, redirect } from 'next/navigation'

import {
    MASTERY_COLORS,
    MasteryBar,
} from '@/components/gamification/mastery-bar'
import { ItemTypeBadge } from '@/components/items/item-type-badge'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'

function ModeTile({
    href,
    icon,
    title,
    description,
    meta,
    className,
}: {
    href: string
    icon: React.ReactNode
    title: string
    description: string
    meta?: React.ReactNode
    className?: string
}) {
    return (
        <Link
            href={href}
            className={cn(
                'group bg-card hover:bg-accent focus-visible:ring-ring/50 flex items-start gap-4 rounded-2xl border-2 border-b-4 p-4 transition-[transform,background-color] outline-none focus-visible:ring-[3px] active:translate-y-0.5 active:border-b-2',
                className
            )}
        >
            <span className="flex size-11 shrink-0 items-center justify-center rounded-xl bg-current/10">
                {icon}
            </span>
            <span className="min-w-0 flex-1">
                <span className="block font-bold">{title}</span>
                <span className="text-muted-foreground block text-sm">
                    {description}
                </span>
                {meta && (
                    <span className="mt-1 block text-xs font-semibold">
                        {meta}
                    </span>
                )}
            </span>
        </Link>
    )
}

export default async function DeckPage({
    params,
}: {
    params: Promise<{ id: string }>
}) {
    const { id } = await params
    const session = await getServerSession(authOptions)
    if (!session?.user?.id) redirect('/login')
    const deck = await getDeckById(id, session.user.id)
    if (!deck) notFound()

    const [t, tm, ti, items, record] = await Promise.all([
        getTranslations('deckPage'),
        getTranslations('mastery'),
        getTranslations('items.types'),
        getStudyItems(session.user.id, { type: 'deck', deckId: deck.id }),
        getDeckRecord(session.user.id, deck.id),
    ])

    const now = new Date()
    const counts = countMastery(items.map((i) => i.review))
    const due = items.filter((i) => i.review && isDue(i.review, now)).length
    const tags = parseCategoryToTags(deck.category)
    const masteryLabels = {
        new: tm('new'),
        learning: tm('learning'),
        familiar: tm('familiar'),
        mastered: tm('mastered'),
    }

    return (
        <div className="container mx-auto max-w-3xl space-y-8 px-4 py-6 sm:py-8">
            <header className="space-y-3">
                <div className="flex items-start gap-2">
                    <Button
                        variant="ghost"
                        size="icon"
                        asChild
                        aria-label={t('back')}
                    >
                        <Link href="/">
                            <ArrowLeft className="size-5" />
                        </Link>
                    </Button>
                    <div className="min-w-0 flex-1">
                        <h1 className="text-2xl font-bold tracking-tight break-words">
                            {deck.title}
                        </h1>
                        {deck.description && (
                            <p className="text-muted-foreground">
                                {deck.description}
                            </p>
                        )}
                    </div>
                    <Button variant="outline" size="sm" asChild>
                        <Link href={`/deck/${deck.id}/edit`}>
                            <Pencil className="size-4" />
                            {t('edit')}
                        </Link>
                    </Button>
                </div>
                {tags.length > 0 && (
                    <div className="flex flex-wrap gap-1.5 pl-11">
                        {tags.map((tag) => (
                            <Badge key={tag} variant="secondary">
                                {tag}
                            </Badge>
                        ))}
                    </div>
                )}
            </header>

            <section className="space-y-3 rounded-2xl border-2 p-4">
                <div className="flex items-baseline justify-between">
                    <h2 className="font-bold">{t('progress')}</h2>
                    <span className="text-muted-foreground text-sm">
                        {t('itemCount', { count: items.length })}
                    </span>
                </div>
                <MasteryBar counts={counts} labels={masteryLabels} />
            </section>

            <section className="grid gap-3 sm:grid-cols-2">
                <ModeTile
                    href={`/learn/${deck.id}`}
                    icon={<Play className="size-6 fill-current" />}
                    title={t('modes.learn')}
                    description={t('modes.learnDescription')}
                    meta={
                        due > 0
                            ? t('dueCount', { count: due })
                            : counts.new > 0
                              ? t('newCount', { count: counts.new })
                              : undefined
                    }
                    className="border-emerald-500 text-emerald-700 sm:col-span-2 dark:text-emerald-300"
                />
                <ModeTile
                    href={`/deck/${deck.id}/flashcards`}
                    icon={<Layers className="size-6" />}
                    title={t('modes.flashcards')}
                    description={t('modes.flashcardsDescription')}
                    className="text-sky-700 dark:text-sky-300"
                />
                <ModeTile
                    href={`/deck/${deck.id}/match`}
                    icon={<Shapes className="size-6" />}
                    title={t('modes.match')}
                    description={t('modes.matchDescription')}
                    meta={
                        record?.bestMatchMs != null && (
                            <span className="flex items-center gap-1">
                                <Timer className="size-3.5" />
                                {t('bestTime', {
                                    time: (record.bestMatchMs / 1000).toFixed(
                                        1
                                    ),
                                })}
                            </span>
                        )
                    }
                    className="text-violet-700 dark:text-violet-300"
                />
                <ModeTile
                    href={`/deck/${deck.id}/test`}
                    icon={<GraduationCap className="size-6" />}
                    title={t('modes.test')}
                    description={t('modes.testDescription')}
                    meta={
                        record?.bestTestScore != null && (
                            <span className="flex items-center gap-1">
                                <Trophy className="size-3.5" />
                                {t('bestScore', {
                                    score: record.bestTestScore,
                                })}
                            </span>
                        )
                    }
                    className="text-amber-700 sm:col-span-2 dark:text-amber-300"
                />
            </section>

            <section className="space-y-3">
                <div className="flex items-center justify-between">
                    <h2 className="font-bold">{t('items')}</h2>
                    <Button variant="ghost" size="sm" asChild>
                        <Link href={`/deck/${deck.id}/edit`}>
                            {t('manageItems')}
                        </Link>
                    </Button>
                </div>
                {items.length === 0 ? (
                    <p className="text-muted-foreground rounded-2xl border-2 border-dashed p-6 text-center">
                        {t('noItems')}
                    </p>
                ) : (
                    <ul className="divide-y rounded-2xl border-2">
                        {items.map(({ item, review }) => {
                            const stage = getMastery(review)
                            return (
                                <li
                                    key={item.id}
                                    className="flex items-center gap-3 px-4 py-3"
                                >
                                    <span
                                        className={cn(
                                            'size-2.5 shrink-0 rounded-full',
                                            MASTERY_COLORS[stage]
                                        )}
                                        title={masteryLabels[stage]}
                                    />
                                    <div className="min-w-0 flex-1">
                                        <p className="truncate font-medium">
                                            {item.front || item.back}
                                        </p>
                                        <p className="text-muted-foreground truncate text-sm">
                                            {item.back}
                                        </p>
                                    </div>
                                    <ItemTypeBadge
                                        type={item.type}
                                        label={ti(item.type)}
                                    />
                                </li>
                            )
                        })}
                    </ul>
                )}
            </section>
        </div>
    )
}
