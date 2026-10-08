'use client'

import { useMounted } from '@/lib/hooks/use-mounted'
import { type ExerciseOutcome, exerciseXp } from '@/lib/learn'
import { cn } from '@/lib/utils'
import { Flame, PartyPopper, RotateCcw, X, Zap } from 'lucide-react'

import { useRef, useState } from 'react'

import { useLocale, useTranslations } from 'next-intl'

import { ActionButton } from '@/components/learn'
import { ExerciseRenderer } from '@/components/learn/session/exercise-renderer'
import { SessionSkeleton } from '@/components/learn/session/session-skeleton'

import { heroExercises } from './demo-content'

/** A tiny, fully playable lesson shown in the hero. Nothing is saved. */
export function HeroDemo() {
    const t = useTranslations('landing.hero.demo')
    const locale = useLocale() === 'de' ? 'de' : 'en'
    const mounted = useMounted()
    const [exercises] = useState(() => heroExercises(locale))
    const [index, setIndex] = useState(0)
    const [run, setRun] = useState(0)
    const [xp, setXp] = useState(0)
    const [combo, setCombo] = useState(0)
    const [gain, setGain] = useState<{ xp: number; key: number } | null>(null)
    const outcome = useRef<ExerciseOutcome | null>(null)
    const done = index >= exercises.length

    function next() {
        const exercise = exercises[index]
        const result = outcome.current
        outcome.current = null
        const nextCombo = result?.correct ? combo + 1 : 0
        const earned = exerciseXp({
            kind: exercise.kind,
            correct: Boolean(result?.correct),
            combo: nextCombo,
            items: exercise.itemIds.length,
        })
        setCombo(nextCombo)
        setXp((v) => v + earned)
        if (earned) setGain({ xp: earned, key: Date.now() })
        setIndex((i) => i + 1)
    }

    function restart() {
        setIndex(0)
        setXp(0)
        setCombo(0)
        setGain(null)
        setRun((r) => r + 1)
    }

    return (
        <div className="relative">
            <div className="bg-background relative rounded-[2rem] border-2 border-b-[6px] p-4 shadow-2xl shadow-emerald-500/10 sm:p-5">
                <div className="mb-4 flex items-center gap-3">
                    <X className="text-muted-foreground size-5" aria-hidden />
                    <div className="bg-muted h-3.5 flex-1 overflow-hidden rounded-full">
                        <div
                            className="h-full rounded-full bg-emerald-500 transition-[width] duration-500"
                            style={{
                                width: `${Math.max(4, (index / exercises.length) * 100)}%`,
                            }}
                        />
                    </div>
                    <span
                        className={cn(
                            'flex items-center gap-0.5 text-sm font-bold text-orange-500 tabular-nums',
                            combo < 2 && 'invisible'
                        )}
                    >
                        <Flame className="size-4 fill-orange-400" aria-hidden />
                        {combo}
                    </span>
                    <span className="relative flex items-center gap-0.5 text-sm font-bold text-amber-500 tabular-nums">
                        <Zap className="size-4 fill-amber-400" aria-hidden />
                        {xp}
                        {gain && (
                            <span
                                key={gain.key}
                                className="animate-float-up absolute -top-4 right-0 text-xs"
                            >
                                +{gain.xp}
                            </span>
                        )}
                    </span>
                </div>

                {!mounted ? (
                    <SessionSkeleton />
                ) : done ? (
                    <div className="animate-pop flex min-h-72 flex-col items-center justify-center gap-3 text-center">
                        <span className="flex size-16 items-center justify-center rounded-full bg-amber-100 text-amber-500 dark:bg-amber-950">
                            <PartyPopper className="size-8" />
                        </span>
                        <p className="text-2xl font-extrabold">
                            {t('doneTitle')}
                        </p>
                        <p className="text-muted-foreground">
                            {t('doneText', { xp })}
                        </p>
                        <ActionButton tone="neutral" onClick={restart}>
                            <RotateCcw />
                            {t('again')}
                        </ActionButton>
                    </div>
                ) : (
                    <ExerciseRenderer
                        key={`${run}-${exercises[index].id}`}
                        exercise={exercises[index]}
                        onResult={(r) => {
                            outcome.current = r
                        }}
                        onContinue={next}
                    />
                )}
            </div>
        </div>
    )
}
