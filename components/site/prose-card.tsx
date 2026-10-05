import { cn } from '@/lib/utils'

import type * as React from 'react'

import { chunkyCard } from './styles'

/**
 * Card for long text (legal pages, documentation). Styles plain h2, h3, p,
 * ul and a elements inside it so pages can stay simple markup.
 */
export function ProseCard({
    children,
    className,
}: {
    children: React.ReactNode
    className?: string
}) {
    return (
        <div
            className={cn(
                chunkyCard,
                'p-6 sm:p-10',
                '[&_h2]:mt-10 [&_h2]:mb-3 [&_h2]:text-2xl [&_h2]:font-extrabold [&_h2]:tracking-tight [&_h2:first-child]:mt-0',
                '[&_h3]:mt-6 [&_h3]:mb-2 [&_h3]:text-lg [&_h3]:font-bold',
                '[&_p]:text-muted-foreground [&_p]:mb-3 [&_p]:leading-relaxed',
                '[&_ul]:text-muted-foreground [&_li]:marker:text-emerald-500 [&_ul]:mb-4 [&_ul]:list-outside [&_ul]:list-disc [&_ul]:space-y-1.5 [&_ul]:pl-5',
                '[&_a]:font-semibold [&_a]:text-emerald-600 [&_a]:underline-offset-4 hover:[&_a]:underline dark:[&_a]:text-emerald-400',
                '[&_strong]:text-foreground',
                className
            )}
        >
            {children}
        </div>
    )
}
