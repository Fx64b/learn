'use client'

import { cn } from '@/lib/utils'

import type * as React from 'react'

export type TileState =
    | 'default'
    | 'selected'
    | 'correct'
    | 'incorrect'
    | 'hint'
    | 'muted'

const tileStates: Record<TileState, string> = {
    default: 'border-border bg-card enabled:hover:bg-accent',
    selected:
        'border-sky-400 bg-sky-50 text-sky-700 dark:border-sky-500 dark:bg-sky-950 dark:text-sky-300',
    correct:
        'border-emerald-500 bg-emerald-50 text-emerald-700 dark:bg-emerald-950 dark:text-emerald-300',
    incorrect:
        'animate-shake border-rose-500 bg-rose-50 text-rose-700 dark:bg-rose-950 dark:text-rose-300',
    hint: 'border-emerald-500 bg-card text-emerald-700 border-dashed dark:text-emerald-300',
    muted: 'border-border bg-muted text-muted-foreground opacity-40',
}

export const tileBase =
    'rounded-xl border-2 border-b-4 px-4 py-3 text-base font-medium transition-[background-color,border-color,color,opacity,transform] outline-none select-none'

/** Tile look for non-button elements (e.g. rows that contain their own controls). */
export function tileClassName(
    state: TileState = 'default',
    className?: string
) {
    return cn(tileBase, tileStates[state], className)
}

/** Chunky, pressable answer tile in the Duolingo style. */
export function Tile({
    state = 'default',
    className,
    ...props
}: React.ComponentProps<'button'> & { state?: TileState }) {
    return (
        <button
            type="button"
            data-state={state}
            className={cn(
                tileBase,
                'focus-visible:ring-ring/50 focus-visible:ring-[3px]',
                'enabled:cursor-pointer enabled:active:translate-y-0.5 enabled:active:border-b-2',
                tileStates[state],
                className
            )}
            {...props}
        />
    )
}
