'use client'

import type { Achievement } from '@/lib/gamification'
import { cn } from '@/lib/utils'
import {
    Flame,
    Footprints,
    GraduationCap,
    Shapes,
    Sparkles,
    Target,
    Timer,
    Trophy,
    Zap,
} from 'lucide-react'

import { useTranslations } from 'next-intl'

const ICONS = {
    footprints: Footprints,
    flame: Flame,
    zap: Zap,
    trophy: Trophy,
    sparkles: Sparkles,
    timer: Timer,
    target: Target,
    shapes: Shapes,
    'graduation-cap': GraduationCap,
} satisfies Record<Achievement['icon'], unknown>

const TIERS = {
    bronze: 'border-amber-700/40 bg-amber-100 text-amber-800 dark:bg-amber-950 dark:text-amber-300',
    silver: 'border-slate-400/50 bg-slate-100 text-slate-700 dark:bg-slate-800 dark:text-slate-200',
    gold: 'border-yellow-500/60 bg-yellow-100 text-yellow-800 dark:bg-yellow-950 dark:text-yellow-300',
}

interface AchievementBadgeProps {
    achievement: Pick<Achievement, 'id' | 'icon' | 'tier'>
    unlocked: boolean
    unlockedAt?: Date
    compact?: boolean
}

export function AchievementBadge({
    achievement,
    unlocked,
    unlockedAt,
    compact = false,
}: AchievementBadgeProps) {
    const t = useTranslations('achievements')
    const Icon = ICONS[achievement.icon]
    return (
        <div
            className={cn(
                'flex items-center gap-3 rounded-xl border-2 p-3',
                !unlocked && 'opacity-50 grayscale'
            )}
        >
            <span
                className={cn(
                    'flex size-11 shrink-0 items-center justify-center rounded-full border-2',
                    unlocked
                        ? TIERS[achievement.tier]
                        : 'bg-muted text-muted-foreground'
                )}
            >
                <Icon className="size-5" aria-hidden />
            </span>
            <div className="min-w-0">
                <p className="leading-tight font-semibold">
                    {t(`${achievement.id}.title`)}
                </p>
                {!compact && (
                    <p className="text-muted-foreground text-sm">
                        {t(`${achievement.id}.description`)}
                    </p>
                )}
                {unlocked && unlockedAt && !compact && (
                    <p className="text-muted-foreground text-xs">
                        {unlockedAt.toLocaleDateString()}
                    </p>
                )}
            </div>
        </div>
    )
}
