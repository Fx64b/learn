'use client'

import { useMounted } from '@/lib/hooks/use-mounted'
import { cn } from '@/lib/utils'
import {
    ArrowDownUp,
    Hash,
    Image,
    Layers,
    Link2,
    List,
    ListChecks,
    type LucideIcon,
    MapPin,
    Puzzle,
    Quote,
    SquareDashed,
    Type,
} from 'lucide-react'

import { useState } from 'react'

import { useLocale, useTranslations } from 'next-intl'

import { ExerciseRenderer } from '@/components/learn/session/exercise-renderer'
import { SessionSkeleton } from '@/components/learn/session/session-skeleton'

import { showcaseExercises } from './demo-content'

const ICONS: Record<string, LucideIcon> = {
    multipleChoice: ListChecks,
    typeAnswer: Type,
    matchPairs: Link2,
    fillBlank: SquareDashed,
    orderSequence: ArrowDownUp,
    listRecall: List,
    numberAnswer: Hash,
    labelDiagram: Image,
    locateOnImage: MapPin,
    firstLetter: Quote,
    buildSentence: Puzzle,
    flashcard: Layers,
}

/** Lets visitors play every exercise kind. Nothing is saved. */
export function ExerciseShowcase() {
    const t = useTranslations('landing.showcase')
    const locale = useLocale() === 'de' ? 'de' : 'en'
    const mounted = useMounted()
    const [entries] = useState(() => showcaseExercises(locale))
    const [active, setActive] = useState(0)
    const [run, setRun] = useState(0)
    const entry = entries[active]

    return (
        <div className="grid gap-6 lg:grid-cols-[17rem_1fr]">
            <div
                role="tablist"
                aria-label={t('tabsLabel')}
                className="-mx-4 flex gap-2 overflow-x-auto px-4 pb-2 lg:mx-0 lg:flex-col lg:overflow-visible lg:px-0 lg:pb-0"
            >
                {entries.map((e, i) => {
                    const Icon = ICONS[e.key]
                    const selected = i === active
                    return (
                        <button
                            key={e.key}
                            role="tab"
                            aria-selected={selected}
                            onClick={() => {
                                setActive(i)
                                setRun((r) => r + 1)
                            }}
                            className={cn(
                                'focus-visible:ring-ring/50 flex shrink-0 items-center gap-3 rounded-xl border-2 px-3 py-2 text-left text-sm font-semibold transition-colors outline-none focus-visible:ring-[3px]',
                                selected
                                    ? 'border-sky-500 bg-sky-50 text-sky-700 dark:bg-sky-950 dark:text-sky-300'
                                    : 'hover:bg-accent border-transparent'
                            )}
                        >
                            <Icon className="size-4 shrink-0" aria-hidden />
                            <span className="whitespace-nowrap">
                                {t(`kinds.${e.key}.name`)}
                            </span>
                        </button>
                    )
                })}
            </div>
            <div className="min-w-0 space-y-3" role="tabpanel">
                <p className="text-muted-foreground text-sm">
                    {t(`kinds.${entry.key}.description`)}
                </p>
                {mounted ? (
                    <ExerciseRenderer
                        key={`${run}-${entry.exercise.id}`}
                        exercise={entry.exercise}
                        onResult={() => {}}
                        onContinue={() => {
                            setActive((a) => (a + 1) % entries.length)
                            setRun((r) => r + 1)
                        }}
                    />
                ) : (
                    <SessionSkeleton />
                )}
            </div>
        </div>
    )
}
