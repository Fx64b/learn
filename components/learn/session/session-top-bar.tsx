'use client'

import { cn } from '@/lib/utils'
import { Flame, X, Zap } from 'lucide-react'

import { useTranslations } from 'next-intl'

import { Button } from '@/components/ui/button'

interface SessionTopBarProps {
    progress: number
    combo: number
    xp: number
    onClose: () => void
}

export function SessionTopBar({
    progress,
    combo,
    xp,
    onClose,
}: SessionTopBarProps) {
    const t = useTranslations('session')
    return (
        <div className="flex items-center gap-3">
            <Button
                variant="ghost"
                size="icon"
                onClick={onClose}
                aria-label={t('close')}
            >
                <X className="size-5" />
            </Button>
            <div
                className="bg-muted h-4 flex-1 overflow-hidden rounded-full"
                role="progressbar"
                aria-valuemin={0}
                aria-valuemax={100}
                aria-valuenow={Math.round(progress * 100)}
            >
                <div
                    className="h-full rounded-full bg-emerald-500 pt-1 transition-[width] duration-500 ease-out"
                    style={{ width: `${Math.max(2, progress * 100)}%` }}
                >
                    {/* Padding on the parent, not a margin here: a child's top
                        margin collapses through the fill and pushes it down. */}
                    <div className="mx-2 h-1 rounded-full bg-white/30" />
                </div>
            </div>
            <span
                key={combo}
                className={cn(
                    'flex w-12 items-center gap-0.5 text-sm font-bold text-orange-500 tabular-nums',
                    combo >= 3 ? 'animate-pop' : 'invisible'
                )}
                aria-label={t('combo', { count: combo })}
            >
                <Flame className="size-4 fill-orange-400" aria-hidden />
                {combo}
            </span>
            <span
                className="flex items-center gap-0.5 text-sm font-bold text-amber-500 tabular-nums"
                aria-label={t('xpEarned', { xp })}
            >
                <Zap className="size-4 fill-amber-400" aria-hidden />
                {xp}
            </span>
        </div>
    )
}
