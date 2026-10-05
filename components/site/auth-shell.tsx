import { cn } from '@/lib/utils'

import type * as React from 'react'

import { chunkyCard } from './styles'

/** Centered card layout for sign-in and related pages. */
export function AuthShell({ children }: { children: React.ReactNode }) {
    return (
        <div className="relative flex min-h-[calc(100vh-10rem)] items-center justify-center px-4 py-12">
            <div
                aria-hidden
                className="pointer-events-none absolute inset-x-0 top-0 -z-10 h-[30rem] bg-[radial-gradient(ellipse_at_top,rgb(16_185_129/0.16),transparent_60%)]"
            />
            <div
                className={cn(
                    chunkyCard,
                    'w-full max-w-md p-6 shadow-xl shadow-emerald-500/5 sm:p-8'
                )}
            >
                {children}
            </div>
        </div>
    )
}
