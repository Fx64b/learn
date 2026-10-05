'use client'

import { useEffect, useRef, useState } from 'react'

import { useTranslations } from 'next-intl'

import { Progress } from '@/components/ui/progress'

import { ExerciseShell } from './exercise-shell'
import { Tile, type TileState } from './tile'
import type { ExerciseBaseProps } from './types'
import { useExerciseStatus } from './use-exercise-status'
import { shuffle } from './utils'

export interface MatchPair {
    left: string
    right: string
}

export interface MatchPairsResponse {
    mistakes: number
    /** Every wrong pairing the user tried, in order. */
    wrongAttempts: MatchPair[]
}

export interface MatchPairsProps extends ExerciseBaseProps<MatchPairsResponse> {
    /** The correct pairs. The right column is shuffled for display. */
    answer: MatchPair[]
    question?: string
    /** Mistakes tolerated while still counting as correct. Defaults to unlimited, like Duolingo. */
    allowedMistakes?: number
}

type Side = 'left' | 'right'

export function MatchPairs({
    answer,
    question,
    allowedMistakes = Infinity,
    status: controlledStatus,
    onResult,
    onContinue,
    className,
}: MatchPairsProps) {
    const t = useTranslations('exercise')
    const [rightOrder, setRightOrder] = useState(() =>
        shuffle(answer.map((_, i) => i))
    )
    const [pick, setPick] = useState<{ left?: number; right?: number }>({})
    const [matched, setMatched] = useState<Set<number>>(new Set())
    const [wrong, setWrong] = useState<{ left: number; right: number } | null>(
        null
    )
    const [wrongAttempts, setWrongAttempts] = useState<MatchPair[]>([])
    const { status, locked, setEvaluated, reset } =
        useExerciseStatus(controlledStatus)
    const wrongTimer = useRef<ReturnType<typeof setTimeout>>(undefined)

    useEffect(() => () => clearTimeout(wrongTimer.current), [])

    function select(side: Side, index: number) {
        if (locked || matched.has(index)) return
        const next = {
            ...pick,
            [side]: pick[side] === index ? undefined : index,
        }
        if (next.left === undefined || next.right === undefined) {
            setPick(next)
            return
        }

        setPick({})
        if (next.left === next.right) {
            const nowMatched = new Set(matched).add(next.left)
            setMatched(nowMatched)
            if (nowMatched.size === answer.length) {
                const correct = wrongAttempts.length <= allowedMistakes
                setEvaluated(correct ? 'correct' : 'incorrect')
                onResult?.({
                    correct,
                    response: { mistakes: wrongAttempts.length, wrongAttempts },
                })
            }
        } else {
            setWrongAttempts((prev) => [
                ...prev,
                {
                    left: answer[next.left!].left,
                    right: answer[next.right!].right,
                },
            ])
            setWrong({ left: next.left, right: next.right })
            clearTimeout(wrongTimer.current)
            wrongTimer.current = setTimeout(() => setWrong(null), 600)
        }
    }

    function tileState(side: Side, index: number): TileState {
        if (status !== 'idle') return status
        if (wrong?.[side] === index) return 'incorrect'
        if (matched.has(index)) return 'muted'
        if (pick[side] === index) return 'selected'
        return 'default'
    }

    function renderColumn(side: Side, order: number[]) {
        return (
            <div className="flex flex-col gap-3">
                {order.map((index) => (
                    <Tile
                        key={index}
                        state={tileState(side, index)}
                        aria-pressed={pick[side] === index}
                        disabled={locked || matched.has(index)}
                        onClick={() => select(side, index)}
                    >
                        {answer[index][side]}
                    </Tile>
                ))}
            </div>
        )
    }

    return (
        <ExerciseShell
            title={question ?? t('titles.matchPairs')}
            status={status}
            solutionLabel={t('mistakes')}
            solution={t('mistakesOf', {
                count: wrongAttempts.length,
                max: Number.isFinite(allowedMistakes) ? allowedMistakes : '∞',
            })}
            onContinue={onContinue}
            onRetry={() => {
                setRightOrder(shuffle(answer.map((_, i) => i)))
                setPick({})
                setMatched(new Set())
                setWrong(null)
                setWrongAttempts([])
                reset()
            }}
            idleFooter={
                <div className="text-muted-foreground flex w-full items-center gap-4 text-sm">
                    <Progress
                        value={(matched.size / answer.length) * 100}
                        className="h-3"
                    />
                    <span className="shrink-0 tabular-nums">
                        {matched.size} / {answer.length}
                    </span>
                </div>
            }
            className={className}
        >
            <div className="grid grid-cols-2 gap-3">
                {renderColumn(
                    'left',
                    answer.map((_, i) => i)
                )}
                {renderColumn('right', rightOrder)}
            </div>
        </ExerciseShell>
    )
}
