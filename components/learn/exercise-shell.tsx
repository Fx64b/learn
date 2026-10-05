'use client'

import { cn } from '@/lib/utils'
import { CircleCheck, CircleX } from 'lucide-react'

import type * as React from 'react'

import { useTranslations } from 'next-intl'

import { Button } from '@/components/ui/button'

import type { ExerciseStatus } from './types'

interface ExerciseShellProps {
    title: string
    prompt?: React.ReactNode
    status: ExerciseStatus
    /** Shown under the "Incorrect" heading, e.g. the correct answer. */
    solution?: React.ReactNode
    /** Prefix for `solution`. */
    solutionLabel?: string
    /** Extra line under the feedback heading, shown for both outcomes. */
    note?: React.ReactNode
    canCheck?: boolean
    onCheck?: () => void
    onContinue?: () => void
    onRetry?: () => void
    /** Replaces the check button while idle (e.g. progress for auto-graded exercises). */
    idleFooter?: React.ReactNode
    /** Rendered next to the check button while idle, e.g. a "Give up" button. */
    extraActions?: React.ReactNode
    /** Rendered next to the continue button once feedback is visible. */
    feedbackActions?: React.ReactNode
    checkLabel?: string
    className?: string
    children: React.ReactNode
}

export function ExerciseShell({
    title,
    prompt,
    status,
    solution,
    solutionLabel,
    note,
    canCheck = false,
    onCheck,
    onContinue,
    onRetry,
    idleFooter,
    extraActions,
    feedbackActions,
    checkLabel,
    className,
    children,
}: ExerciseShellProps) {
    const t = useTranslations('exercise')
    return (
        <div
            data-status={status}
            className={cn(
                'bg-card text-card-foreground flex w-full flex-col overflow-hidden rounded-2xl border-2',
                className
            )}
        >
            <div className="flex flex-col gap-5 p-6">
                <div className="space-y-2">
                    <h2 className="text-xl font-bold tracking-tight">
                        {title}
                    </h2>
                    {prompt && (
                        <div className="text-muted-foreground text-lg">
                            {prompt}
                        </div>
                    )}
                </div>
                {children}
            </div>

            <footer
                className={cn(
                    'mt-auto flex flex-col gap-4 border-t-2 px-6 py-4 transition-colors sm:flex-row sm:items-center sm:justify-between',
                    status === 'correct' &&
                        'border-emerald-200 bg-emerald-50 dark:border-emerald-900 dark:bg-emerald-950/60',
                    status === 'incorrect' &&
                        'border-rose-200 bg-rose-50 dark:border-rose-900 dark:bg-rose-950/60'
                )}
            >
                {status === 'idle' ? (
                    (idleFooter ?? (
                        <>
                            {extraActions}
                            <ActionButton
                                tone="primary"
                                disabled={!canCheck}
                                onClick={onCheck}
                                className="sm:ml-auto"
                            >
                                {checkLabel ?? t('check')}
                            </ActionButton>
                        </>
                    ))
                ) : (
                    <>
                        <Feedback
                            status={status}
                            solution={solution}
                            solutionLabel={solutionLabel}
                            note={note}
                        />
                        <div className="flex flex-col-reverse gap-2 sm:flex-row sm:items-center">
                            {feedbackActions}
                            <ActionButton
                                tone={
                                    status === 'correct' ? 'primary' : 'danger'
                                }
                                onClick={onContinue ?? onRetry}
                                autoFocus
                            >
                                {onContinue ? t('continue') : t('tryAgain')}
                            </ActionButton>
                        </div>
                    </>
                )}
            </footer>
        </div>
    )
}

function Feedback({
    status,
    solution,
    solutionLabel,
    note,
}: {
    status: Exclude<ExerciseStatus, 'idle'>
    solution?: React.ReactNode
    solutionLabel?: string
    note?: React.ReactNode
}) {
    const t = useTranslations('exercise')
    const correct = status === 'correct'
    const Icon = correct ? CircleCheck : CircleX

    return (
        <div
            role="status"
            aria-live="polite"
            className={cn(
                'flex items-start gap-3',
                correct
                    ? 'text-emerald-700 dark:text-emerald-300'
                    : 'text-rose-700 dark:text-rose-300'
            )}
        >
            <Icon className="mt-0.5 size-7 shrink-0" />
            <div>
                <p className="text-lg font-bold">
                    {correct ? t('correctTitle') : t('incorrectTitle')}
                </p>
                {!correct && solution && (
                    <p className="text-sm">
                        <span className="font-semibold">
                            {solutionLabel ?? t('correctAnswer')}:{' '}
                        </span>
                        {solution}
                    </p>
                )}
                {note && <p className="text-sm">{note}</p>}
            </div>
        </div>
    )
}

const actionTones = {
    primary:
        'border-emerald-700 bg-emerald-500 text-white hover:bg-emerald-500/90',
    danger: 'border-rose-700 bg-rose-500 text-white hover:bg-rose-500/90',
    warning:
        'border-amber-600 bg-amber-400 text-amber-950 hover:bg-amber-400/90',
    info: 'border-sky-700 bg-sky-500 text-white hover:bg-sky-500/90',
    neutral: 'border-border bg-card text-foreground hover:bg-accent',
}

/** Chunky footer button. */
export function ActionButton({
    tone,
    className,
    ...props
}: React.ComponentProps<typeof Button> & { tone: keyof typeof actionTones }) {
    return (
        <Button
            size="lg"
            className={cn(
                'h-12 rounded-xl border-2 border-b-4 px-8 text-base font-bold tracking-wide uppercase active:translate-y-0.5 active:border-b-2 sm:min-w-40',
                actionTones[tone],
                'disabled:border-border disabled:bg-muted disabled:text-muted-foreground disabled:opacity-100',
                className
            )}
            {...props}
        />
    )
}
