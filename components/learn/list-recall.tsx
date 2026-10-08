'use client'

import { cn } from '@/lib/utils'

import type * as React from 'react'
import { useState } from 'react'

import { useTranslations } from 'next-intl'

import { Input } from '@/components/ui/input'
import { Progress } from '@/components/ui/progress'

import { ActionButton, ExerciseShell } from './exercise-shell'
import { type TileState, tileClassName } from './tile'
import type { ExerciseBaseProps } from './types'
import { useExerciseStatus } from './use-exercise-status'
import { matchesAny } from './utils'

export interface ListRecallResponse {
    recalled: string[]
    missed: string[]
    wrongGuesses: string[]
}

export interface ListRecallProps extends ExerciseBaseProps<ListRecallResponse> {
    /** e.g. "Name the seven continents". */
    question: string
    /** Every item to recall. Use an array to accept aliases. The first entry is displayed. */
    answer: (string | string[])[]
    title?: string
    placeholder?: string
}

/** Name every item of a set in any order (Sporcle style). Items are accepted as soon as they are typed. */
export function ListRecall({
    question,
    answer,
    title,
    placeholder,
    status: controlledStatus,
    onResult,
    onContinue,
    className,
}: ListRecallProps) {
    const t = useTranslations('exercise')
    const items = answer.map((a) => (Array.isArray(a) ? a : [a]))
    // Indices of recalled items, in the order they were named. Slots fill in this
    // order so their position doesn't hint at what is still missing.
    const [found, setFound] = useState<number[]>([])
    const [value, setValue] = useState('')
    const [wrongGuesses, setWrongGuesses] = useState<string[]>([])
    const [message, setMessage] = useState<{
        text: string
        key: number
    } | null>(null)
    const { status, locked, setEvaluated, reset } =
        useExerciseStatus(controlledStatus)

    const missing = items.map((_, i) => i).filter((i) => !found.includes(i))

    function finish(nextFound: number[], guesses: string[]) {
        const recalled = nextFound.map((i) => items[i][0])
        const missed = items
            .filter((_, i) => !nextFound.includes(i))
            .map((a) => a[0])
        const correct = missed.length === 0
        setEvaluated(correct ? 'correct' : 'incorrect')
        onResult?.({
            correct,
            response: { recalled, missed, wrongGuesses: guesses },
        })
    }

    function handleChange(next: string) {
        setValue(next)
        const index = items.findIndex(
            (aliases, i) =>
                !found.includes(i) &&
                matchesAny(next, aliases, { ignoreAccents: true })
        )
        if (index === -1) return
        const nextFound = [...found, index]
        setFound(nextFound)
        setValue('')
        setMessage(null)
        if (nextFound.length === items.length) finish(nextFound, wrongGuesses)
    }

    function handleEnter() {
        if (!value.trim()) return
        const already = found.some((i) =>
            matchesAny(value, items[i], { ignoreAccents: true })
        )
        if (already) {
            setMessage((prev) => ({
                text: t('alreadyNamed'),
                key: (prev?.key ?? 0) + 1,
            }))
        } else {
            setWrongGuesses((prev) => [...prev, value.trim()])
            const text = t('notOnList', { value: value.trim() })
            setMessage((prev) => ({ text, key: (prev?.key ?? 0) + 1 }))
        }
        setValue('')
    }

    const foundCount = found.length

    return (
        <ExerciseShell
            title={title ?? t('titles.listRecall')}
            prompt={
                <span className="text-foreground text-2xl font-semibold">
                    {question}
                </span>
            }
            status={status}
            solutionLabel={t('missing')}
            solution={missing.map((i) => items[i][0]).join(', ')}
            onContinue={onContinue}
            onRetry={() => {
                setFound([])
                setValue('')
                setWrongGuesses([])
                setMessage(null)
                reset()
            }}
            idleFooter={
                <div className="flex w-full items-center gap-4">
                    <Progress
                        value={(foundCount / items.length) * 100}
                        className="h-3"
                    />
                    <span className="text-muted-foreground shrink-0 text-sm tabular-nums">
                        {foundCount} / {items.length}
                    </span>
                    <ActionButton
                        tone="neutral"
                        onClick={() => finish(found, wrongGuesses)}
                        className="px-4 sm:min-w-0"
                    >
                        {t('giveUp')}
                    </ActionButton>
                </div>
            }
            className={className}
        >
            <form
                onSubmit={(e) => {
                    e.preventDefault()
                    handleEnter()
                }}
                className="space-y-2"
            >
                <Input
                    value={value}
                    onChange={(e) => handleChange(e.target.value)}
                    placeholder={placeholder ?? t('startTyping')}
                    readOnly={locked}
                    autoComplete="off"
                    autoCapitalize="off"
                    spellCheck={false}
                    className="bg-muted/40 h-14 rounded-xl border-2 px-4 text-lg md:text-lg"
                />
                <p
                    key={message?.key}
                    className={cn(
                        'h-5 text-sm text-rose-600 dark:text-rose-400',
                        message && 'animate-shake'
                    )}
                >
                    {!locked && message?.text}
                </p>
            </form>

            <ol className="grid grid-cols-2 gap-2 sm:grid-cols-3">
                {found.map((itemIndex, slot) => (
                    <Slot key={itemIndex} number={slot + 1} state="correct">
                        {items[itemIndex][0]}
                    </Slot>
                ))}
                {missing.map((itemIndex, i) => (
                    <Slot
                        key={itemIndex}
                        number={found.length + i + 1}
                        state={
                            locked
                                ? status === 'correct'
                                    ? 'correct'
                                    : 'hint'
                                : 'muted'
                        }
                    >
                        {locked ? items[itemIndex][0] : ''}
                    </Slot>
                ))}
            </ol>
        </ExerciseShell>
    )
}

function Slot({
    number,
    state,
    children,
}: {
    number: number
    state: TileState
    children: React.ReactNode
}) {
    return (
        <li
            className={tileClassName(
                state,
                cn(
                    'flex min-h-10 items-center gap-2 px-3 py-2 text-sm',
                    state === 'muted' && 'opacity-100'
                )
            )}
        >
            <span className="w-5 shrink-0 text-xs tabular-nums opacity-60">
                {number}
            </span>
            <span className="truncate">{children}</span>
        </li>
    )
}
