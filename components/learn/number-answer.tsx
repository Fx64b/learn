'use client'

import { cn } from '@/lib/utils'
import { ArrowDown, ArrowUp } from 'lucide-react'

import { useState } from 'react'

import { useTranslations } from 'next-intl'

import { Input } from '@/components/ui/input'

import { ExerciseShell } from './exercise-shell'
import type { ExerciseBaseProps } from './types'
import { useExerciseStatus } from './use-exercise-status'

export interface NumberAnswerResponse {
    value: number
    /** Every submitted guess, in order. */
    guesses: number[]
}

export interface NumberAnswerProps
    extends ExerciseBaseProps<NumberAnswerResponse> {
    question: string
    answer: number
    /** Accepted distance from the answer, e.g. 5 for "within 5 years". */
    tolerance?: number
    /** Guesses allowed. Wrong guesses before the last get a higher/lower hint. */
    attempts?: number
    /** Shown after the input, e.g. "m" or "km²". */
    unit?: string
    title?: string
}

/** Numeric recall for dates, figures and statistics, with optional tolerance and higher/lower hints. */
export function NumberAnswer({
    question,
    answer,
    tolerance = 0,
    attempts = 1,
    unit,
    title,
    status: controlledStatus,
    onResult,
    onContinue,
    className,
}: NumberAnswerProps) {
    const t = useTranslations('exercise')
    const [value, setValue] = useState('')
    const [guesses, setGuesses] = useState<number[]>([])
    const { status, locked, setEvaluated, reset } =
        useExerciseStatus(controlledStatus)

    const parsed = Number(value.replace(/[\s,_']/g, ''))
    const valid = value.trim() !== '' && Number.isFinite(parsed)
    const last = guesses.at(-1)
    const direction =
        last === undefined || Math.abs(last - answer) <= tolerance
            ? null
            : last < answer
              ? 'higher'
              : 'lower'

    function check() {
        if (!valid || locked) return
        const next = [...guesses, parsed]
        setGuesses(next)
        setValue('')
        const correct = Math.abs(parsed - answer) <= tolerance
        if (correct || next.length >= attempts) {
            setEvaluated(correct ? 'correct' : 'incorrect')
            onResult?.({ correct, response: { value: parsed, guesses: next } })
        }
    }

    const format = (n: number) => `${n}${unit ? ` ${unit}` : ''}`
    const shown = locked ? (last !== undefined ? String(last) : value) : value

    return (
        <ExerciseShell
            title={title ?? t('titles.number')}
            prompt={
                <span className="text-foreground text-2xl font-semibold">
                    {question}
                </span>
            }
            status={status}
            solution={
                <>
                    {format(answer)}
                    {tolerance > 0 && ` (±${tolerance})`}
                    {last !== undefined &&
                        ` - ${t('offBy', { diff: round(Math.abs(last - answer)) })}`}
                </>
            }
            canCheck={valid}
            onCheck={check}
            onContinue={onContinue}
            onRetry={() => {
                setValue('')
                setGuesses([])
                reset()
            }}
            className={className}
        >
            <form
                onSubmit={(e) => {
                    e.preventDefault()
                    check()
                }}
                className="space-y-3"
            >
                <div className="relative">
                    <Input
                        value={shown}
                        onChange={(e) => setValue(e.target.value)}
                        inputMode="decimal"
                        placeholder="0"
                        readOnly={locked}
                        aria-invalid={status === 'incorrect'}
                        autoComplete="off"
                        className={cn(
                            'bg-muted/40 h-16 rounded-xl border-2 px-4 text-center text-3xl font-bold tabular-nums md:text-3xl',
                            unit && 'pr-16',
                            status === 'correct' &&
                                'border-emerald-500 bg-emerald-50 text-emerald-700 focus-visible:border-emerald-500 focus-visible:ring-emerald-500/30 dark:bg-emerald-950 dark:text-emerald-300',
                            status === 'incorrect' &&
                                'animate-shake border-rose-500 bg-rose-50 text-rose-700 focus-visible:border-rose-500 focus-visible:ring-rose-500/30 dark:bg-rose-950 dark:text-rose-300'
                        )}
                    />
                    {unit && (
                        <span className="text-muted-foreground pointer-events-none absolute inset-y-0 right-4 flex items-center text-lg font-semibold">
                            {unit}
                        </span>
                    )}
                </div>

                {attempts > 1 && (
                    <div className="flex items-center justify-between gap-4 text-sm">
                        <div
                            className="flex gap-1.5"
                            aria-label={t('attemptsLeft', {
                                count: attempts - guesses.length,
                            })}
                        >
                            {Array.from({ length: attempts }, (_, i) => (
                                <span
                                    key={i}
                                    className={cn(
                                        'size-2.5 rounded-full',
                                        i < guesses.length
                                            ? 'bg-muted-foreground/25'
                                            : 'bg-sky-500'
                                    )}
                                />
                            ))}
                        </div>
                        {direction && !locked && (
                            <span
                                key={guesses.length}
                                role="status"
                                className="animate-shake flex items-center gap-1 font-semibold text-amber-600 dark:text-amber-400"
                            >
                                {direction === 'higher'
                                    ? t('tooLow', { value: last ?? 0 })
                                    : t('tooHigh', { value: last ?? 0 })}
                                {direction === 'higher' ? (
                                    <ArrowUp className="size-4" />
                                ) : (
                                    <ArrowDown className="size-4" />
                                )}
                            </span>
                        )}
                    </div>
                )}
            </form>
        </ExerciseShell>
    )
}

const round = (n: number) => Math.round(n * 1000) / 1000
