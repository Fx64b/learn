import { cn } from '@/lib/utils'

import type * as React from 'react'

interface GoalRingProps {
    value: number
    goal: number
    size?: number
    strokeWidth?: number
    className?: string
    children?: React.ReactNode
}

/** Circular progress towards the daily XP goal. */
export function GoalRing({
    value,
    goal,
    size = 48,
    strokeWidth = 5,
    className,
    children,
}: GoalRingProps) {
    const ratio = goal > 0 ? Math.min(1, value / goal) : 0
    const radius = (size - strokeWidth) / 2
    const circumference = 2 * Math.PI * radius
    const done = ratio >= 1

    return (
        <div
            className={cn('relative inline-flex shrink-0', className)}
            style={{ width: size, height: size }}
            role="progressbar"
            aria-valuemin={0}
            aria-valuemax={goal}
            aria-valuenow={Math.min(value, goal)}
        >
            <svg
                width={size}
                height={size}
                viewBox={`0 0 ${size} ${size}`}
                className="-rotate-90"
            >
                <circle
                    cx={size / 2}
                    cy={size / 2}
                    r={radius}
                    fill="none"
                    strokeWidth={strokeWidth}
                    className="stroke-muted"
                />
                <circle
                    cx={size / 2}
                    cy={size / 2}
                    r={radius}
                    fill="none"
                    strokeWidth={strokeWidth}
                    strokeLinecap="round"
                    strokeDasharray={circumference}
                    strokeDashoffset={circumference * (1 - ratio)}
                    className={cn(
                        'transition-[stroke-dashoffset] duration-700 ease-out',
                        done ? 'stroke-emerald-500' : 'stroke-sky-500'
                    )}
                />
            </svg>
            <div className="absolute inset-0 flex items-center justify-center">
                {children}
            </div>
        </div>
    )
}
