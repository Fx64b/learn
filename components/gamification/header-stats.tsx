'use client'

import { CheckCircle2, Target } from 'lucide-react'

import { useEffect, useState } from 'react'

import { useTranslations } from 'next-intl'
import Link from 'next/link'
import { usePathname } from 'next/navigation'

import {
    type GamificationSummary,
    getGamificationSummary,
} from '@/app/actions/learn'

import { GoalRing } from './goal-ring'
import { StreakBadge } from './streak-badge'

/** Streak and daily goal in the header, refreshed on every navigation. */
export function HeaderStats() {
    const t = useTranslations('gamification')
    const pathname = usePathname()
    const [summary, setSummary] = useState<GamificationSummary | null>(null)

    useEffect(() => {
        let cancelled = false
        getGamificationSummary()
            .then((s) => {
                if (!cancelled) setSummary(s)
            })
            .catch(() => {})
        return () => {
            cancelled = true
        }
    }, [pathname])

    if (!summary) return null
    const reached = summary.todayXp >= summary.dailyGoalXp

    return (
        <Link
            href="/profile?tab=stats"
            className="hover:bg-accent flex items-center gap-3 rounded-full px-2 py-1 transition-colors"
            aria-label={t('headerLabel', {
                streak: summary.streak,
                xp: summary.todayXp,
                goal: summary.dailyGoalXp,
            })}
        >
            <StreakBadge
                streak={summary.streak}
                atRisk={summary.streakAtRisk}
            />
            <GoalRing
                value={summary.todayXp}
                goal={summary.dailyGoalXp}
                size={28}
                strokeWidth={3.5}
            >
                {reached ? (
                    <CheckCircle2 className="size-3.5 text-emerald-500" />
                ) : (
                    <Target className="text-muted-foreground size-3" />
                )}
            </GoalRing>
        </Link>
    )
}
