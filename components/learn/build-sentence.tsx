'use client'

import { cn } from '@/lib/utils'

import { useState } from 'react'

import { useTranslations } from 'next-intl'

import { ExerciseShell } from './exercise-shell'
import { Tile } from './tile'
import type { ExerciseBaseProps } from './types'
import { useExerciseStatus } from './use-exercise-status'
import { normalizeAnswer, shuffle } from './utils'

export interface BuildSentenceProps extends ExerciseBaseProps<string[]> {
    /**
     * The sentence to rebuild. A string is split into words. Pass an array to
     * control the chunks (e.g. whole phrases).
     */
    answer: string | string[]
    /** Context shown above, e.g. "Newton's first law". */
    question?: string
    /** Extra chunks that do not belong in the sentence. */
    distractors?: string[]
    title?: string
}

/** Rebuild a sentence verbatim from shuffled chunks. */
export function BuildSentence({
    answer,
    question,
    distractors = [],
    title,
    status: controlledStatus,
    onResult,
    onContinue,
    className,
}: BuildSentenceProps) {
    const t = useTranslations('exercise')
    const chunks = Array.isArray(answer)
        ? answer
        : answer.split(/\s+/).filter(Boolean)
    // Bank chunks are tracked by index so repeated words stay independent.
    const [bank, setBank] = useState(() => shuffle([...chunks, ...distractors]))
    const [placed, setPlaced] = useState<number[]>([])
    const { status, locked, setEvaluated, reset } =
        useExerciseStatus(controlledStatus)

    function check() {
        const response = placed.map((i) => bank[i])
        // Compare text, so identical chunks are interchangeable.
        const correct =
            normalizeAnswer(response.join(' ')) ===
            normalizeAnswer(chunks.join(' '))
        setEvaluated(correct ? 'correct' : 'incorrect')
        onResult?.({ correct, response })
    }

    return (
        <ExerciseShell
            title={title ?? t('titles.buildSentence')}
            prompt={question}
            status={status}
            solution={chunks.join(' ')}
            canCheck={placed.length > 0}
            onCheck={check}
            onContinue={onContinue}
            onRetry={() => {
                setBank(shuffle([...chunks, ...distractors]))
                setPlaced([])
                reset()
            }}
            className={className}
        >
            <div
                className={cn(
                    'flex min-h-32 flex-wrap content-start gap-2 rounded-xl border-2 p-3 transition-colors',
                    // Ruled lines like Duolingo's answer area.
                    'bg-[repeating-linear-gradient(to_bottom,transparent,transparent_calc(3.25rem-2px),var(--border)_calc(3.25rem-2px),var(--border)_3.25rem)] bg-origin-content',
                    status === 'correct' && 'border-emerald-500',
                    status === 'incorrect' && 'animate-shake border-rose-500'
                )}
            >
                {placed.map((bankIndex, pos) => (
                    <Tile
                        key={bankIndex}
                        state={
                            status === 'idle'
                                ? 'default'
                                : status === 'correct'
                                  ? 'correct'
                                  : 'incorrect'
                        }
                        disabled={locked}
                        onClick={() =>
                            setPlaced((prev) =>
                                prev.filter((_, i) => i !== pos)
                            )
                        }
                        className="h-11 animate-none px-3 py-1.5"
                    >
                        {bank[bankIndex]}
                    </Tile>
                ))}
            </div>

            <div className="flex flex-wrap justify-center gap-2">
                {bank.map((chunk, i) => {
                    const used = placed.includes(i)
                    return (
                        <Tile
                            key={i}
                            state={used ? 'muted' : 'default'}
                            disabled={locked || used}
                            onClick={() => setPlaced((prev) => [...prev, i])}
                            className={cn(
                                'h-11 px-3 py-1.5',
                                used && 'text-transparent'
                            )}
                        >
                            {chunk}
                        </Tile>
                    )
                })}
            </div>
        </ExerciseShell>
    )
}
