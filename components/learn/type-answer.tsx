'use client'

import { cn } from '@/lib/utils'

import { useState } from 'react'

import { useTranslations } from 'next-intl'

import { Input } from '@/components/ui/input'

import { ExerciseShell } from './exercise-shell'
import { ActionButton } from './exercise-shell'
import type { ExerciseBaseProps } from './types'
import { useExerciseStatus } from './use-exercise-status'
import { isNearMiss, matchesAny } from './utils'

export interface TypeAnswerResponse {
    value: string
    /** Accepted with a small spelling mistake. */
    typo: boolean
    /** The user marked a wrong answer as correct ("I was right"). */
    overridden: boolean
}

export interface TypeAnswerProps extends ExerciseBaseProps<TypeAnswerResponse> {
    question: string
    /** Accepted answer, or several accepted variants. The first is shown as the solution. */
    answer: string | string[]
    title?: string
    placeholder?: string
    ignoreAccents?: boolean
    /** Accept small typos as correct (default true). */
    allowTypos?: boolean
    /** Offer an "I was right" button after a wrong answer, like Quizlet. */
    allowOverride?: boolean
}

export function TypeAnswer({
    question,
    answer,
    title,
    placeholder,
    ignoreAccents = false,
    allowTypos = true,
    allowOverride = false,
    status: controlledStatus,
    onResult,
    onContinue,
    className,
}: TypeAnswerProps) {
    const t = useTranslations('exercise')
    const accepted = Array.isArray(answer) ? answer : [answer]
    const [value, setValue] = useState('')
    const [typo, setTypo] = useState(false)
    const { status, locked, setEvaluated, reset } =
        useExerciseStatus(controlledStatus)

    function check() {
        const exact = matchesAny(value, accepted, { ignoreAccents })
        const nearMiss =
            !exact &&
            allowTypos &&
            isNearMiss(value, accepted, { ignoreAccents })
        const correct = exact || nearMiss
        setTypo(nearMiss)
        setEvaluated(correct ? 'correct' : 'incorrect')
        onResult?.({
            correct,
            response: { value, typo: nearMiss, overridden: false },
        })
    }

    return (
        <ExerciseShell
            title={title ?? t('titles.typeAnswer')}
            prompt={
                <span className="text-foreground text-2xl font-semibold">
                    {question}
                </span>
            }
            status={status}
            solution={accepted[0]}
            note={
                status === 'correct' && typo
                    ? t('typoNote', { answer: accepted[0] })
                    : undefined
            }
            feedbackActions={
                allowOverride && status === 'incorrect' && !controlledStatus ? (
                    <ActionButton
                        tone="neutral"
                        onClick={() => {
                            setEvaluated('correct')
                            onResult?.({
                                correct: true,
                                response: {
                                    value,
                                    typo: false,
                                    overridden: true,
                                },
                            })
                        }}
                    >
                        {t('iWasRight')}
                    </ActionButton>
                ) : undefined
            }
            canCheck={value.trim().length > 0}
            onCheck={check}
            onContinue={onContinue}
            onRetry={() => {
                setValue('')
                setTypo(false)
                reset()
            }}
            className={className}
        >
            <form
                onSubmit={(e) => {
                    e.preventDefault()
                    if (!locked && value.trim()) check()
                }}
            >
                <Input
                    value={value}
                    onChange={(e) => setValue(e.target.value)}
                    placeholder={placeholder ?? t('typeYourAnswer')}
                    readOnly={locked}
                    aria-invalid={status === 'incorrect'}
                    autoComplete="off"
                    autoCapitalize="off"
                    spellCheck={false}
                    className={cn(
                        'bg-muted/40 h-14 rounded-xl border-2 px-4 text-lg md:text-lg',
                        status === 'correct' &&
                            'border-emerald-500 bg-emerald-50 text-emerald-700 focus-visible:border-emerald-500 focus-visible:ring-emerald-500/30 dark:bg-emerald-950 dark:text-emerald-300',
                        status === 'incorrect' &&
                            'animate-shake border-rose-500 bg-rose-50 text-rose-700 focus-visible:border-rose-500 focus-visible:ring-rose-500/30 dark:bg-rose-950 dark:text-rose-300'
                    )}
                />
            </form>
        </ExerciseShell>
    )
}
