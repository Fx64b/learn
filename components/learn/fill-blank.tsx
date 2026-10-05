'use client'

import { cn } from '@/lib/utils'

import { Fragment, useState } from 'react'

import { useTranslations } from 'next-intl'

import { ExerciseShell } from './exercise-shell'
import { Tile } from './tile'
import type { ExerciseBaseProps } from './types'
import { useExerciseStatus } from './use-exercise-status'
import { normalizeAnswer, shuffle } from './utils'

const BLANK = /_{3,}/

export interface FillBlankProps extends ExerciseBaseProps<string[]> {
    /** Sentence with `___` marking each blank, e.g. "I ___ a cup of ___". */
    question: string
    /** The word for each blank, in order. */
    answer: string[]
    /** Extra wrong words mixed into the word bank. */
    distractors?: string[]
    title?: string
    /** Optional line above the sentence, e.g. a translation. */
    hint?: string
}

export function FillBlank({
    question,
    answer,
    distractors = [],
    title,
    hint,
    status: controlledStatus,
    onResult,
    onContinue,
    className,
}: FillBlankProps) {
    const t = useTranslations('exercise')
    const parts = question.split(BLANK)
    const blankCount = parts.length - 1
    // Bank words are tracked by index so duplicate words stay independent.
    const [bank] = useState(() => shuffle([...answer, ...distractors]))
    const [filled, setFilled] = useState<(number | null)[]>(() =>
        Array(blankCount).fill(null)
    )
    const { status, locked, setEvaluated, reset } =
        useExerciseStatus(controlledStatus)

    const words = filled.map((i) => (i === null ? '' : bank[i]))

    function place(bankIndex: number) {
        const slot = filled.indexOf(null)
        if (locked || slot === -1) return
        setFilled((prev) => prev.map((v, i) => (i === slot ? bankIndex : v)))
    }

    function remove(slot: number) {
        if (locked) return
        setFilled((prev) => prev.map((v, i) => (i === slot ? null : v)))
    }

    function check() {
        const correct = words.every(
            (w, i) => normalizeAnswer(w) === normalizeAnswer(answer[i] ?? '')
        )
        setEvaluated(correct ? 'correct' : 'incorrect')
        onResult?.({ correct, response: words })
    }

    return (
        <ExerciseShell
            title={title ?? t('titles.fillBlank')}
            prompt={hint}
            status={status}
            solution={parts.map((p, i) => p + (answer[i] ?? '')).join('')}
            canCheck={filled.every((v) => v !== null)}
            onCheck={check}
            onContinue={onContinue}
            onRetry={() => {
                setFilled(Array(blankCount).fill(null))
                reset()
            }}
            className={className}
        >
            <p className="text-2xl leading-[3.25rem] font-semibold">
                {parts.map((part, i) => (
                    <Fragment key={i}>
                        {part}
                        {i < blankCount && (
                            <button
                                type="button"
                                aria-label={
                                    words[i]
                                        ? t('removeWord', { word: words[i] })
                                        : t('blank', { n: i + 1 })
                                }
                                disabled={locked || filled[i] === null}
                                onClick={() => remove(i)}
                                className={cn(
                                    'mx-1 inline-flex h-11 min-w-20 items-center justify-center rounded-xl border-2 px-3 align-middle text-xl transition-colors',
                                    filled[i] === null
                                        ? 'border-muted-foreground/40 bg-muted/40 border-dashed'
                                        : 'bg-card enabled:hover:bg-accent border-b-4 enabled:cursor-pointer',
                                    status === 'correct' &&
                                        'border-emerald-500 bg-emerald-50 text-emerald-700 dark:bg-emerald-950 dark:text-emerald-300',
                                    status === 'incorrect' &&
                                        'animate-shake border-rose-500 bg-rose-50 text-rose-700 dark:bg-rose-950 dark:text-rose-300'
                                )}
                            >
                                {words[i]}
                            </button>
                        )}
                    </Fragment>
                ))}
            </p>

            <div className="flex flex-wrap justify-center gap-2 border-t-2 border-dashed pt-5">
                {bank.map((word, i) => {
                    const used = filled.includes(i)
                    return (
                        <Tile
                            key={i}
                            state={used ? 'muted' : 'default'}
                            disabled={locked || used}
                            onClick={() => place(i)}
                            className={cn(
                                'px-4 py-2',
                                used && 'text-transparent'
                            )}
                        >
                            {word}
                        </Tile>
                    )
                })}
            </div>
        </ExerciseShell>
    )
}
