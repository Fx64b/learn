'use client'

import { cn } from '@/lib/utils'

import type * as React from 'react'
import { useState } from 'react'

import { useTranslations } from 'next-intl'

import { ActionButton, ExerciseShell } from './exercise-shell'
import type { ExerciseBaseProps } from './types'
import { useExerciseStatus } from './use-exercise-status'

export type FlashcardGrade = 'again' | 'hard' | 'good' | 'easy'

const GRADES: {
    grade: FlashcardGrade
    label: string
    tone: 'danger' | 'warning' | 'primary' | 'info'
}[] = [
    { grade: 'again', label: 'grades.again', tone: 'danger' },
    { grade: 'hard', label: 'grades.hard', tone: 'warning' },
    { grade: 'good', label: 'grades.good', tone: 'primary' },
    { grade: 'easy', label: 'grades.easy', tone: 'info' },
]

export interface FlashcardProps extends ExerciseBaseProps<FlashcardGrade> {
    /** Front of the card. */
    question: React.ReactNode
    /** Back of the card. */
    answer: React.ReactNode
    title?: string
    /** Only offer "Forgot" / "Knew it" instead of the four spaced-repetition grades. */
    simple?: boolean
}

/** Self-graded flip card. Every grade except "again" counts as correct. */
export function Flashcard({
    question,
    answer,
    title,
    simple = false,
    status: controlledStatus,
    onResult,
    onContinue,
    className,
}: FlashcardProps) {
    const t = useTranslations('exercise')
    const [flipped, setFlipped] = useState(false)
    const { status, locked, setEvaluated, reset } =
        useExerciseStatus(controlledStatus)
    const revealed = flipped || locked

    function grade(g: FlashcardGrade) {
        const correct = g !== 'again'
        setEvaluated(correct ? 'correct' : 'incorrect')
        onResult?.({ correct, response: g })
    }

    const grades = simple
        ? [
              {
                  grade: 'again' as const,
                  label: 'grades.forgot',
                  tone: 'danger' as const,
              },
              {
                  grade: 'good' as const,
                  label: 'grades.knewIt',
                  tone: 'primary' as const,
              },
          ]
        : GRADES

    return (
        <ExerciseShell
            title={title ?? t('titles.flashcard')}
            status={status}
            onContinue={onContinue}
            onRetry={() => {
                setFlipped(false)
                reset()
            }}
            idleFooter={
                flipped ? (
                    <div
                        className={cn(
                            'grid w-full gap-2',
                            simple
                                ? 'grid-cols-2'
                                : 'grid-cols-2 sm:grid-cols-4'
                        )}
                    >
                        {grades.map((g) => (
                            <ActionButton
                                key={g.grade}
                                tone={g.tone}
                                onClick={() => grade(g.grade)}
                                className="px-2 sm:min-w-0"
                            >
                                {t(g.label)}
                            </ActionButton>
                        ))}
                    </div>
                ) : (
                    <ActionButton
                        tone="neutral"
                        onClick={() => setFlipped(true)}
                        className="w-full"
                    >
                        {t('showAnswer')}
                    </ActionButton>
                )
            }
            className={className}
        >
            <button
                type="button"
                disabled={locked}
                onClick={() => setFlipped((f) => !f)}
                aria-label={revealed ? t('showQuestion') : t('showAnswer')}
                className="focus-visible:ring-ring/50 h-56 w-full rounded-2xl outline-none perspective-[1200px] focus-visible:ring-[3px] enabled:cursor-pointer"
            >
                <div
                    className={cn(
                        'relative size-full transition-transform duration-500 transform-3d',
                        revealed && 'rotate-y-180'
                    )}
                >
                    <CardFace>
                        <span className="text-muted-foreground text-xs font-bold tracking-widest uppercase">
                            {t('question')}
                        </span>
                        <div className="text-2xl font-semibold">{question}</div>
                    </CardFace>
                    <CardFace
                        className={cn(
                            'rotate-y-180',
                            status === 'correct' &&
                                'border-emerald-500 bg-emerald-50 dark:bg-emerald-950',
                            status === 'incorrect' &&
                                'border-rose-500 bg-rose-50 dark:bg-rose-950'
                        )}
                    >
                        <span className="text-muted-foreground text-xs font-bold tracking-widest uppercase">
                            {t('answer')}
                        </span>
                        <div className="text-2xl font-semibold">{answer}</div>
                    </CardFace>
                </div>
            </button>
        </ExerciseShell>
    )
}

function CardFace({
    className,
    children,
}: {
    className?: string
    children: React.ReactNode
}) {
    return (
        <div
            className={cn(
                'bg-card absolute inset-0 flex flex-col items-center justify-center gap-3 rounded-2xl border-2 border-b-4 p-6 text-center backface-hidden',
                className
            )}
        >
            {children}
        </div>
    )
}
