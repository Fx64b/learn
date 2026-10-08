'use client'

import { useState } from 'react'

import { useTranslations } from 'next-intl'

import { ExerciseShell } from './exercise-shell'
import { Tile, type TileState } from './tile'
import type { ExerciseBaseProps } from './types'
import { useExerciseStatus } from './use-exercise-status'

export interface MultipleChoiceProps extends ExerciseBaseProps<string[]> {
    question: string
    options: string[]
    /** One correct option, or several for "select all that apply". */
    answer: string | string[]
    title?: string
}

export function MultipleChoice({
    question,
    options,
    answer,
    title,
    status: controlledStatus,
    onResult,
    onContinue,
    className,
}: MultipleChoiceProps) {
    const t = useTranslations('exercise')
    const correctSet = new Set(Array.isArray(answer) ? answer : [answer])
    const multi = correctSet.size > 1
    const [selected, setSelected] = useState<string[]>([])
    const { status, locked, setEvaluated, reset } =
        useExerciseStatus(controlledStatus)

    function toggle(option: string) {
        if (locked) return
        setSelected((prev) =>
            multi
                ? prev.includes(option)
                    ? prev.filter((o) => o !== option)
                    : [...prev, option]
                : [option]
        )
    }

    function check() {
        const correct =
            selected.length === correctSet.size &&
            selected.every((o) => correctSet.has(o))
        setEvaluated(correct ? 'correct' : 'incorrect')
        onResult?.({ correct, response: selected })
    }

    function tileState(option: string): TileState {
        const isSelected = selected.includes(option)
        if (status === 'idle') return isSelected ? 'selected' : 'default'
        if (isSelected) return status
        if (status === 'incorrect' && correctSet.has(option)) return 'hint'
        return 'muted'
    }

    return (
        <ExerciseShell
            title={
                title ??
                (multi
                    ? t('titles.multipleChoiceMulti')
                    : t('titles.multipleChoice'))
            }
            prompt={
                <span className="text-foreground text-2xl font-semibold">
                    {question}
                </span>
            }
            status={status}
            solution={[...correctSet].join(', ')}
            canCheck={selected.length > 0}
            onCheck={check}
            onContinue={onContinue}
            onRetry={() => {
                setSelected([])
                reset()
            }}
            className={className}
        >
            <div
                role={multi ? 'group' : 'radiogroup'}
                className="grid gap-3 sm:grid-cols-2"
            >
                {options.map((option, i) => (
                    <Tile
                        key={option}
                        role={multi ? 'checkbox' : 'radio'}
                        aria-checked={selected.includes(option)}
                        state={tileState(option)}
                        disabled={locked}
                        onClick={() => toggle(option)}
                        className="flex items-center gap-3 text-left"
                    >
                        <span className="flex size-7 shrink-0 items-center justify-center rounded-md border-2 border-current/30 text-xs font-bold opacity-70">
                            {i + 1}
                        </span>
                        {option}
                    </Tile>
                ))}
            </div>
        </ExerciseShell>
    )
}
