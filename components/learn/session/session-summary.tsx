'use client'

import { ACHIEVEMENTS } from '@/lib/gamification'
import { cn } from '@/lib/utils'
import {
    CheckCircle2,
    Clock,
    Flame,
    Loader2,
    PartyPopper,
    Target,
    Trophy,
    Zap,
} from 'lucide-react'

import { useEffect, useState } from 'react'
import type * as React from 'react'

import { useTranslations } from 'next-intl'
import Link from 'next/link'

import type { RewardData } from '@/app/actions/learn'

import { AchievementBadge } from '@/components/gamification/achievement-badge'
import { GoalRing } from '@/components/gamification/goal-ring'
import { ActionButton } from '@/components/learn'

import type { SessionMode } from './learn-session'

export interface SummaryData {
    mode: SessionMode
    xp: number
    /** First attempts (retries excluded). */
    exercises: number
    correct: number
    durationMs: number
    bestCombo: number
    /** Labels of exercises answered wrong at least once. */
    missed: string[]
    streakExtended: boolean
    streak?: number
    reward: (RewardData & { newBest?: boolean; score?: number }) | null
    loading: boolean
    /** Nothing left to learn right now. */
    allDone?: boolean
}

function useCountUp(target: number, ms = 800) {
    const [value, setValue] = useState(0)
    useEffect(() => {
        const start = performance.now()
        let frame = 0
        const tick = (now: number) => {
            const p = Math.min(1, (now - start) / ms)
            setValue(Math.round(target * (1 - (1 - p) ** 3)))
            if (p < 1) frame = requestAnimationFrame(tick)
        }
        frame = requestAnimationFrame(tick)
        return () => cancelAnimationFrame(frame)
    }, [target, ms])
    return value
}

function formatDuration(ms: number) {
    const total = Math.round(ms / 1000)
    const m = Math.floor(total / 60)
    const s = total % 60
    return `${m}:${String(s).padStart(2, '0')}`
}

function Stat({
    icon,
    label,
    value,
    tone,
}: {
    icon: React.ReactNode
    label: string
    value: React.ReactNode
    tone: string
}) {
    return (
        <div
            className={cn(
                'flex flex-col items-center gap-1 rounded-2xl border-2 border-b-4 p-3 text-center',
                tone
            )}
        >
            <span className="text-xs font-bold tracking-wide uppercase">
                {label}
            </span>
            <span className="flex items-center gap-1.5 text-2xl font-extrabold tabular-nums">
                {icon}
                {value}
            </span>
        </div>
    )
}

export function SessionSummary({
    data,
    backHref,
    onRestart,
}: {
    data: SummaryData
    backHref: string
    onRestart: () => Promise<void>
}) {
    const t = useTranslations('session')
    const xp = useCountUp(data.xp)
    const [restarting, setRestarting] = useState(false)
    const accuracy = data.exercises
        ? Math.round((data.correct / data.exercises) * 100)
        : 0
    const perfect = data.exercises > 0 && data.correct === data.exercises
    const reward = data.reward
    const isTest = data.mode === 'test'
    const achievements = (reward?.newAchievements ?? [])
        .map((id) => ACHIEVEMENTS.find((a) => a.id === id))
        .filter((a) => a !== undefined)

    const title = isTest
        ? t('summary.testTitle', { score: reward?.score ?? accuracy })
        : perfect
          ? t('summary.perfectTitle')
          : t('summary.title')

    return (
        <div className="flex flex-col items-center gap-8 py-4 text-center">
            <div className="animate-pop flex flex-col items-center gap-3">
                <span className="flex size-20 items-center justify-center rounded-full bg-amber-100 text-amber-500 dark:bg-amber-950">
                    {perfect ? (
                        <Trophy className="size-10" />
                    ) : (
                        <PartyPopper className="size-10" />
                    )}
                </span>
                <h1 className="text-3xl font-extrabold tracking-tight">
                    {title}
                </h1>
                {isTest && reward?.newBest && (
                    <p className="font-semibold text-emerald-600 dark:text-emerald-400">
                        {t('summary.newBest')}
                    </p>
                )}
            </div>

            <div className="grid w-full grid-cols-2 gap-3 sm:grid-cols-4">
                <Stat
                    icon={<Zap className="size-5 fill-amber-400" />}
                    label={t('summary.xp')}
                    value={xp}
                    tone="border-amber-400 text-amber-600 dark:text-amber-400"
                />
                <Stat
                    icon={<Target className="size-5" />}
                    label={t('summary.accuracy')}
                    value={`${accuracy}%`}
                    tone="border-emerald-500 text-emerald-600 dark:text-emerald-400"
                />
                <Stat
                    icon={<Clock className="size-5" />}
                    label={t('summary.time')}
                    value={formatDuration(data.durationMs)}
                    tone="border-sky-500 text-sky-600 dark:text-sky-400"
                />
                <Stat
                    icon={<Flame className="size-5 fill-orange-400" />}
                    label={t('summary.bestCombo')}
                    value={data.bestCombo}
                    tone="border-orange-400 text-orange-600 dark:text-orange-400"
                />
            </div>

            {data.loading ? (
                <Loader2 className="text-muted-foreground size-6 animate-spin" />
            ) : (
                reward && (
                    <div className="flex w-full flex-col items-center gap-4 rounded-2xl border-2 p-4 sm:flex-row sm:justify-around">
                        <div className="flex items-center gap-3">
                            <GoalRing
                                value={reward.todayXp}
                                goal={reward.dailyGoalXp}
                                size={56}
                            >
                                {reward.todayXp >= reward.dailyGoalXp ? (
                                    <CheckCircle2 className="size-6 text-emerald-500" />
                                ) : (
                                    <Target className="text-muted-foreground size-5" />
                                )}
                            </GoalRing>
                            <div className="text-left">
                                <p className="font-bold">
                                    {t('summary.dailyGoal')}
                                </p>
                                <p className="text-muted-foreground text-sm tabular-nums">
                                    {t('summary.goalProgress', {
                                        xp: reward.todayXp,
                                        goal: reward.dailyGoalXp,
                                    })}
                                </p>
                            </div>
                        </div>
                        <div className="flex items-center gap-3">
                            <span
                                className={cn(
                                    'flex size-14 items-center justify-center rounded-full bg-orange-100 dark:bg-orange-950',
                                    data.streakExtended && 'animate-pop'
                                )}
                            >
                                <Flame className="size-7 fill-orange-400 text-orange-500" />
                            </span>
                            <div className="text-left">
                                <p className="font-bold">
                                    {t('summary.streak', {
                                        count: data.streak ?? reward.streak,
                                    })}
                                </p>
                                <p className="text-muted-foreground text-sm">
                                    {data.streakExtended
                                        ? t('summary.streakExtended')
                                        : t('summary.streakKept')}
                                </p>
                            </div>
                        </div>
                    </div>
                )
            )}

            {achievements.length > 0 && (
                <div className="w-full space-y-2 text-left">
                    <h2 className="font-bold">{t('summary.achievements')}</h2>
                    <div className="grid gap-2 sm:grid-cols-2">
                        {achievements.map((a) => (
                            <div key={a.id} className="animate-pop">
                                <AchievementBadge achievement={a} unlocked />
                            </div>
                        ))}
                    </div>
                </div>
            )}

            {data.missed.length > 0 && (
                <div className="w-full space-y-2 text-left">
                    <h2 className="font-bold">{t('summary.reviewThese')}</h2>
                    <ul className="divide-y rounded-2xl border-2">
                        {data.missed.slice(0, 8).map((label, i) => (
                            <li key={i} className="truncate px-4 py-2 text-sm">
                                {label}
                            </li>
                        ))}
                    </ul>
                </div>
            )}

            {data.allDone && (
                <p className="text-muted-foreground font-semibold">
                    {t('summary.allDone')}
                </p>
            )}

            <div className="flex w-full flex-col-reverse gap-3 sm:flex-row sm:justify-center">
                <ActionButton tone="neutral" asChild>
                    <Link href={backHref}>{t('summary.done')}</Link>
                </ActionButton>
                {!data.allDone && (
                    <ActionButton
                        tone="primary"
                        disabled={restarting}
                        autoFocus
                        onClick={async () => {
                            setRestarting(true)
                            try {
                                await onRestart()
                            } finally {
                                setRestarting(false)
                            }
                        }}
                    >
                        {isTest ? t('summary.newTest') : t('summary.keepGoing')}
                    </ActionButton>
                )}
            </div>
        </div>
    )
}
