import { cn } from '@/lib/utils'

import type * as React from 'react'

interface PageHeroProps {
    eyebrow: string
    title: string
    description?: string
    /** Tailwind text color classes for the eyebrow. */
    tone?: string
    children?: React.ReactNode
    className?: string
}

/** Page header in the style of the landing page. */
export function PageHero({
    eyebrow,
    title,
    description,
    tone = 'text-emerald-600 dark:text-emerald-400',
    children,
    className,
}: PageHeroProps) {
    return (
        <header
            className={cn(
                'relative px-4 pt-14 pb-10 text-center md:pt-20',
                className
            )}
        >
            <div
                aria-hidden
                className="pointer-events-none absolute inset-x-0 -top-24 -z-10 h-[28rem] bg-[radial-gradient(ellipse_at_top,rgb(16_185_129/0.14),transparent_60%)]"
            />
            <div className="mx-auto max-w-2xl space-y-4">
                <p
                    className={cn(
                        'text-sm font-extrabold tracking-widest uppercase',
                        tone
                    )}
                >
                    {eyebrow}
                </p>
                <h1 className="text-4xl font-extrabold tracking-tight text-balance md:text-5xl">
                    {title}
                </h1>
                {description && (
                    <p className="text-muted-foreground text-lg text-pretty">
                        {description}
                    </p>
                )}
                {children}
            </div>
        </header>
    )
}
