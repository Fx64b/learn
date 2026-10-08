import { parseCategoryToTags } from '@/lib/category-parser'
import { fromUTCDateOnly } from '@/lib/date'
import type { MasteryCounts } from '@/lib/learn'
import { DeckType } from '@/types'
import { format } from 'date-fns'
import { AlertTriangle, PencilIcon } from 'lucide-react'

import { getTranslations } from 'next-intl/server'
import Link from 'next/link'

import { MasteryBar } from '@/components/gamification/mastery-bar'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import {
    Card,
    CardContent,
    CardDescription,
    CardFooter,
    CardHeader,
    CardTitle,
} from '@/components/ui/card'
import {
    Tooltip,
    TooltipContent,
    TooltipProvider,
    TooltipTrigger,
} from '@/components/ui/tooltip'

interface DeckCardProps {
    deck: DeckType
    totalCards: number
    dueCards: number
    mastery?: MasteryCounts
    isPastDue?: boolean
}

export async function DeckCard({
    deck,
    totalCards,
    dueCards,
    mastery,
    isPastDue = false,
}: DeckCardProps) {
    const t = await getTranslations()

    const tags = parseCategoryToTags(deck.category)

    return (
        <Card
            className={`transition-shadow hover:shadow-md ${isPastDue ? 'border-dashed' : ''}`}
        >
            <CardHeader className="pb-2">
                <div className="flex items-center justify-between gap-2">
                    <CardTitle>
                        <Link
                            href={`/deck/${deck.id}`}
                            className="hover:underline"
                        >
                            {deck.title}
                        </Link>
                    </CardTitle>

                    {isPastDue && (
                        <TooltipProvider>
                            <Tooltip>
                                <TooltipTrigger asChild>
                                    <div className="text-yellow-500">
                                        <AlertTriangle className="h-5 w-5" />
                                    </div>
                                </TooltipTrigger>
                                <TooltipContent>
                                    <p>
                                        {t('deck.statistics.wasDueBy')}{' '}
                                        {fromUTCDateOnly(deck.activeUntil) &&
                                            format(
                                                fromUTCDateOnly(
                                                    deck.activeUntil
                                                )!,
                                                'dd.MM.yyyy'
                                            )}
                                    </p>
                                </TooltipContent>
                            </Tooltip>
                        </TooltipProvider>
                    )}
                </div>
                <CardDescription>
                    {deck.description}
                    {deck.activeUntil && (
                        <div className="mt-1 text-xs">
                            <span className="text-muted-foreground">
                                {isPastDue
                                    ? t('deck.statistics.wasDueBy')
                                    : t('deck.statistics.dueBy')}{' '}
                                {fromUTCDateOnly(deck.activeUntil) &&
                                    format(
                                        fromUTCDateOnly(deck.activeUntil)!,
                                        'dd.MM.yyyy'
                                    )}
                            </span>
                        </div>
                    )}
                </CardDescription>
                {tags.length > 0 && (
                    <div className="mt-2 flex flex-wrap gap-1">
                        {tags.map((tag) => (
                            <Badge key={tag} variant="secondary">
                                {tag}
                            </Badge>
                        ))}
                    </div>
                )}
            </CardHeader>
            <CardContent className="mt-auto pb-2">
                <div className="space-y-2">
                    {mastery && totalCards > 0 && (
                        <MasteryBar counts={mastery} />
                    )}
                    <p className="text-sm">
                        <b>{totalCards}</b> {t('deck.statistics.totalCards')}
                    </p>
                    {!isPastDue && (
                        <p className="text-sm">
                            <b>{dueCards}</b>{' '}
                            {t('deck.statistics.cardsToReview')}
                        </p>
                    )}
                </div>
            </CardContent>
            <CardFooter className="mt-auto flex gap-2">
                <Button className="flex-1" size="sm" asChild>
                    <Link href={`/learn/${deck.id}`}>{t('common.learn')}</Link>
                </Button>
                <Button variant="outline" size="sm" asChild>
                    <Link href={`/deck/${deck.id}`}>{t('deckPage.open')}</Link>
                </Button>
                <Button
                    variant="outline"
                    size="sm"
                    asChild
                    aria-label={t('deckPage.edit')}
                >
                    <Link href={`/deck/${deck.id}/edit`}>
                        <PencilIcon />
                    </Link>
                </Button>
            </CardFooter>
        </Card>
    )
}
