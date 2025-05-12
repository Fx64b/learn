import { DeckType } from '@/types'
import { format } from 'date-fns'
import { AlertTriangle, PencilIcon } from 'lucide-react'

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

export function DeckCard({
    deck,
    totalCards,
    dueCards,
    isPastDue = false,
}: DeckCardProps) {
    return (
        <Card
            className={`transition-shadow hover:shadow-md ${isPastDue ? 'border-dashed' : ''}`}
        >
            <CardHeader className="pb-2">
                <div className="flex items-center gap-2">
                    <CardTitle>{deck.titel}</CardTitle>

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
                                        Lernziel abgelaufen am{' '}
                                        {format(
                                            new Date(deck.aktivBis!),
                                            'dd.MM.yyyy'
                                        )}
                                    </p>
                                </TooltipContent>
                            </Tooltip>
                        </TooltipProvider>
                    )}
                </div>
                <CardDescription>
                    {deck.beschreibung}
                    {deck.aktivBis && (
                        <div className="mt-1 text-xs">
                            <span className="text-muted-foreground">
                                {isPastDue ? 'War fällig bis:' : 'Fällig bis:'}{' '}
                                {format(new Date(deck.aktivBis), 'dd.MM.yyyy')}
                            </span>
                        </div>
                    )}
                </CardDescription>
            </CardHeader>
            <CardContent className="pb-2">
                <div className="space-y-1">
                    <p className="text-sm">
                        <b>{totalCards}</b> Karten insgesamt
                    </p>
                    {!isPastDue && (
                        <p className="text-sm">
                            <b>{dueCards}</b> Karten zu wiederholen
                        </p>
                    )}
                </div>
            </CardContent>
            <CardFooter className="flex gap-8 md:gap-2">
                <Link href={`/learn/${deck.id}`} className="flex-1">
                    <Button className="w-full" size="sm">
                        Lernen
                    </Button>
                </Link>
                <Button variant="outline" size="sm">
                    <Link href={`/deck/${deck.id}/edit`}>
                        <PencilIcon />
                    </Link>
                </Button>
            </CardFooter>
        </Card>
    )
}
