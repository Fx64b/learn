'use client'

import { cn } from '@/lib/utils'

import { useState } from 'react'

import { useTranslations } from 'next-intl'

import { ExerciseShell } from './exercise-shell'
import { Tile } from './tile'
import type { ExerciseBaseProps } from './types'
import { useExerciseStatus } from './use-exercise-status'
import { shuffle } from './utils'

export interface DiagramLabel {
    label: string
    /** Marker position in percent of the image (0-100). */
    x: number
    y: number
    /** Which side of the marker its label tag appears on. Alternate for crowded markers. */
    tag?: 'above' | 'below'
}

export interface LabelDiagramProps extends ExerciseBaseProps<string[]> {
    image: string
    alt: string
    /** Markers and their correct labels. */
    answer: DiagramLabel[]
    question?: string
    /** Extra labels that belong to no marker. */
    distractors?: string[]
    title?: string
}

/** Label numbered markers on a map or diagram from a bank of names. */
export function LabelDiagram({
    image,
    alt,
    answer,
    question,
    distractors = [],
    title,
    status: controlledStatus,
    onResult,
    onContinue,
    className,
}: LabelDiagramProps) {
    const t = useTranslations('exercise')
    const [bank, setBank] = useState(() =>
        shuffle([...answer.map((a) => a.label), ...distractors])
    )
    // Bank index assigned to each marker.
    const [assigned, setAssigned] = useState<(number | null)[]>(() =>
        answer.map(() => null)
    )
    const [active, setActive] = useState<number | null>(0)
    const { status, locked, setEvaluated, reset } =
        useExerciseStatus(controlledStatus)

    function selectMarker(i: number) {
        if (locked) return
        if (assigned[i] !== null)
            setAssigned((prev) => prev.map((v, j) => (j === i ? null : v)))
        setActive(i)
    }

    function assign(bankIndex: number) {
        if (locked) return
        const target = active ?? assigned.indexOf(null)
        if (target === -1) return
        const next = assigned.map((v, j) => (j === target ? bankIndex : v))
        setAssigned(next)
        // Move on to the next empty marker, wrapping around.
        const order = [...next.keys()].map(
            (k) => (target + 1 + k) % next.length
        )
        setActive(order.find((k) => next[k] === null) ?? null)
    }

    function check() {
        const response = assigned.map((b) => (b === null ? '' : bank[b]))
        const correct = response.every((label, i) => label === answer[i].label)
        setEvaluated(correct ? 'correct' : 'incorrect')
        onResult?.({ correct, response })
    }

    function markerTone(i: number) {
        if (status !== 'idle') {
            const right =
                controlledStatus && controlledStatus !== 'idle'
                    ? controlledStatus === 'correct'
                    : assigned[i] !== null &&
                      bank[assigned[i]] === answer[i].label
            return right
                ? 'border-emerald-600 bg-emerald-500 text-white'
                : 'border-rose-700 bg-rose-500 text-white'
        }
        if (active === i)
            return 'border-sky-700 bg-sky-500 text-white ring-4 ring-sky-400/40 animate-pulse'
        if (assigned[i] !== null)
            return 'border-foreground/40 bg-card text-foreground'
        return 'border-white bg-foreground/80 text-background'
    }

    return (
        <ExerciseShell
            title={title ?? t('titles.labelDiagram')}
            prompt={question}
            status={status}
            solutionLabel={t('corrections')}
            solution={t('correctionsShown')}
            canCheck={assigned.every((a) => a !== null)}
            onCheck={check}
            onContinue={onContinue}
            onRetry={() => {
                setBank(
                    shuffle([...answer.map((a) => a.label), ...distractors])
                )
                setAssigned(answer.map(() => null))
                setActive(0)
                reset()
            }}
            className={className}
        >
            <div className="relative rounded-xl border-2 select-none">
                {/* eslint-disable-next-line @next/next/no-img-element -- user images of unknown size; markers are positioned in % of the rendered image */}
                <img
                    src={image}
                    alt={alt}
                    draggable={false}
                    className="block w-full rounded-[10px]"
                />
                {answer.map((spot, i) => {
                    const label =
                        assigned[i] === null ? null : bank[assigned[i]]
                    const wrong =
                        locked &&
                        label !== spot.label &&
                        !(controlledStatus === 'correct')
                    return (
                        <div
                            key={i}
                            className="absolute flex -translate-x-1/2 -translate-y-1/2 flex-col items-center"
                            style={{ left: `${spot.x}%`, top: `${spot.y}%` }}
                        >
                            <button
                                type="button"
                                disabled={locked}
                                onClick={() => selectMarker(i)}
                                aria-label={
                                    t('marker', { n: i + 1 }) +
                                    (label ? `: ${label}` : '')
                                }
                                className={cn(
                                    'focus-visible:ring-ring/50 flex size-7 items-center justify-center rounded-full border-2 text-xs font-bold shadow-md outline-none focus-visible:ring-[3px] enabled:cursor-pointer',
                                    markerTone(i)
                                )}
                            >
                                {i + 1}
                            </button>
                            {(label || locked) && (
                                <span
                                    className={cn(
                                        'bg-card/95 absolute rounded-md px-1.5 py-0.5 text-center text-xs font-semibold whitespace-nowrap shadow-sm',
                                        spot.tag === 'above'
                                            ? 'bottom-full mb-1'
                                            : 'top-full mt-1'
                                    )}
                                >
                                    {wrong && label && (
                                        <span className="text-rose-600 line-through dark:text-rose-400">
                                            {label}
                                        </span>
                                    )}
                                    {wrong ? (
                                        <span className="block text-emerald-700 dark:text-emerald-300">
                                            {spot.label}
                                        </span>
                                    ) : (
                                        (label ?? spot.label)
                                    )}
                                </span>
                            )}
                        </div>
                    )
                })}
            </div>

            <div className="flex flex-wrap justify-center gap-2 pt-4">
                {bank.map((word, i) => {
                    const used = assigned.includes(i)
                    return (
                        <Tile
                            key={i}
                            state={used ? 'muted' : 'default'}
                            disabled={locked || used}
                            onClick={() => assign(i)}
                            className={cn(
                                'px-3 py-1.5',
                                used && 'text-transparent'
                            )}
                        >
                            {word}
                        </Tile>
                    )
                })}
            </div>
            {!locked && (
                <p className="text-muted-foreground text-center text-sm">
                    {active !== null
                        ? t('pickLabel', { n: active + 1 })
                        : t('tapMarker')}
                </p>
            )}
        </ExerciseShell>
    )
}
