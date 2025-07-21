import { fromUTCDateOnly } from '@/lib/date'
import { DeckType } from '@/types'
import { format } from 'date-fns'
import { AlertTriangle, PencilIcon } from 'lucide-react'

import { getTranslations } from 'next-intl/server'
import Link from 'next/link'

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
    isPastDue?: boolean
}

export async function DeckCard({
    deck,
    totalCards,
    dueCards,
    isPastDue = false,
}: DeckCardProps) {
    const t = await getTranslations()

    return (
        <Card
            className={`transition-shadow hover:shadow-md ${isPastDue ? 'border-dashed' : ''}`}
        >
            <CardHeader className="pb-2">
                <div className="flex items-center justify-between gap-2">
                    <CardTitle>{deck.title}</CardTitle>

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
            </CardHeader>
            <CardContent className="mt-auto pb-2">
                <div className="space-y-1">
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
            <CardFooter className="mt-auto flex gap-8 md:gap-2">
                <Link href={`/learn/${deck.id}`} className="flex-1">
                    <Button className="w-full" size="sm">
                        {t('common.learn')}
                    </Button>
                </Link>
                <Button variant="outline" size="sm" asChild>
                    <Link href={`/deck/${deck.id}/edit`}>
                        <PencilIcon />
                    </Link>
                </Button>
            </CardFooter>
        </Card>
    )
}
