'use client'

import { cn } from '@/lib/utils'
import { ChevronDown, ChevronUp, GripVertical } from 'lucide-react'

import type * as React from 'react'
import { useState } from 'react'

import { useTranslations } from 'next-intl'

import { ExerciseShell } from './exercise-shell'
import { type TileState, tileClassName } from './tile'
import type { ExerciseBaseProps } from './types'
import { useExerciseStatus } from './use-exercise-status'
import { shuffle } from './utils'

export interface SequenceItem {
    label: string
    /** Revealed after checking, e.g. the year of an event. */
    detail?: string
}

export interface OrderSequenceProps extends ExerciseBaseProps<string[]> {
    /** e.g. "Order these events from earliest to latest". */
    question: string
    /** Items in the correct order. */
    answer: (string | SequenceItem)[]
    title?: string
    /** Labels for the two ends of the list. */
    ends?: [start: string, end: string]
}

/** Put items into the right order (timelines, process steps, rankings). Drag or use the arrows. */
export function OrderSequence({
    question,
    answer,
    title,
    ends,
    status: controlledStatus,
    onResult,
    onContinue,
    className,
}: OrderSequenceProps) {
    const t = useTranslations('exercise')
    const items = answer.map((a) => (typeof a === 'string' ? { label: a } : a))
    const [order, setOrder] = useState(() => scrambled(items.length))
    // The dragged item (not its position), so repeated dragover events are idempotent.
    const [dragging, setDragging] = useState<number | null>(null)
    const { status, locked, setEvaluated, reset } =
        useExerciseStatus(controlledStatus)

    function move(from: number, to: number) {
        if (locked || to < 0 || to >= order.length || from === to) return
        setOrder((prev) => {
            const next = [...prev]
            const [item] = next.splice(from, 1)
            next.splice(to, 0, item)
            return next
        })
    }

    function dragOver(pos: number) {
        if (locked || dragging === null) return
        setOrder((prev) => {
            const from = prev.indexOf(dragging)
            if (from === pos) return prev
            const next = [...prev]
            next.splice(from, 1)
            next.splice(pos, 0, dragging)
            return next
        })
    }

    function check() {
        const correct = order.every((itemIndex, pos) => itemIndex === pos)
        setEvaluated(correct ? 'correct' : 'incorrect')
        onResult?.({ correct, response: order.map((i) => items[i].label) })
    }

    function rowState(itemIndex: number, pos: number): TileState {
        if (status === 'idle')
            return dragging === itemIndex ? 'selected' : 'default'
        if (controlledStatus && controlledStatus !== 'idle')
            return controlledStatus
        return itemIndex === pos ? 'correct' : 'incorrect'
    }

    return (
        <ExerciseShell
            title={title ?? t('titles.orderSequence')}
            prompt={
                <span className="text-foreground text-xl font-semibold">
                    {question}
                </span>
            }
            status={status}
            solution={items.map((i) => i.label).join(' → ')}
            canCheck
            onCheck={check}
            onContinue={onContinue}
            onRetry={() => {
                setOrder(scrambled(items.length))
                reset()
            }}
            className={className}
        >
            <div className="space-y-2">
                {ends && <EndLabel>{ends[0]}</EndLabel>}
                <ol className="space-y-2">
                    {order.map((itemIndex, pos) => {
                        const item = items[itemIndex]
                        const misplaced = locked && itemIndex !== pos
                        return (
                            <li
                                key={itemIndex}
                                draggable={!locked}
                                onDragStart={(e) => {
                                    e.dataTransfer.effectAllowed = 'move'
                                    setDragging(itemIndex)
                                }}
                                onDragOver={(e) => {
                                    e.preventDefault()
                                    dragOver(pos)
                                }}
                                onDragEnd={() => setDragging(null)}
                                className={tileClassName(
                                    rowState(itemIndex, pos),
                                    cn(
                                        'flex items-center gap-3 py-2 pr-2 pl-3',
                                        !locked &&
                                            'cursor-grab active:cursor-grabbing'
                                    )
                                )}
                            >
                                <span className="flex size-7 shrink-0 items-center justify-center rounded-md border-2 border-current/30 text-xs font-bold opacity-70">
                                    {pos + 1}
                                </span>
                                <div className="min-w-0 flex-1">
                                    <div>{item.label}</div>
                                    {locked && (item.detail || misplaced) && (
                                        <div className="text-sm opacity-80">
                                            {item.detail}
                                            {misplaced && (
                                                <span className="font-semibold">
                                                    {item.detail ? ' · ' : ''}
                                                    belongs at #{itemIndex + 1}
                                                </span>
                                            )}
                                        </div>
                                    )}
                                </div>
                                {!locked && (
                                    <div className="flex shrink-0 items-center">
                                        <IconButton
                                            label={t('moveUp')}
                                            disabled={pos === 0}
                                            onClick={() => move(pos, pos - 1)}
                                        >
                                            <ChevronUp />
                                        </IconButton>
                                        <IconButton
                                            label={t('moveDown')}
                                            disabled={pos === order.length - 1}
                                            onClick={() => move(pos, pos + 1)}
                                        >
                                            <ChevronDown />
                                        </IconButton>
                                        <GripVertical className="text-muted-foreground ml-1 hidden size-4 sm:block" />
                                    </div>
                                )}
                            </li>
                        )
                    })}
                </ol>
                {ends && <EndLabel>{ends[1]}</EndLabel>}
            </div>
        </ExerciseShell>
    )
}

function IconButton({
    label,
    children,
    ...props
}: React.ComponentProps<'button'> & { label: string }) {
    return (
        <button
            type="button"
            aria-label={label}
            className="text-muted-foreground enabled:hover:bg-accent enabled:hover:text-foreground focus-visible:ring-ring/50 flex size-9 items-center justify-center rounded-lg outline-none focus-visible:ring-[3px] enabled:cursor-pointer disabled:opacity-30 [&_svg]:size-5"
            {...props}
        >
            {children}
        </button>
    )
}

function EndLabel({ children }: { children: React.ReactNode }) {
    return (
        <div className="text-muted-foreground text-center text-xs font-bold tracking-widest uppercase">
            {children}
        </div>
    )
}

/** A shuffled index list that is never already in order. */
function scrambled(length: number) {
    const identity = Array.from({ length }, (_, i) => i)
    if (length < 2) return identity
    let out = shuffle(identity)
    while (out.every((v, i) => v === i)) out = shuffle(identity)
    return out
}
