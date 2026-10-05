import { ACHIEVEMENTS } from '@/lib/gamification'
import { Flame, Snowflake, Trophy, Zap } from 'lucide-react'

import { getFormatter, getTranslations } from 'next-intl/server'

import type { ProfileGamification } from '@/app/actions/learn'

import { AchievementBadge } from './achievement-badge'
import { ActivityHeatmap } from './activity-heatmap'

/** Streak, XP, activity heatmap and achievements for the stats tab. */
export async function GamificationOverview({
    data,
}: {
    data: ProfileGamification
}) {
    const t = await getTranslations('gamification')
    const format = await getFormatter()
    const unlocked = new Map(data.achievements.map((a) => [a.id, a.unlockedAt]))
    const { summary } = data

    const stats = [
        {
            icon: <Flame className="size-5 fill-orange-400 text-orange-500" />,
            value: summary.streak,
            label: t('currentStreak'),
        },
        {
            icon: <Trophy className="size-5 text-amber-500" />,
            value: summary.longestStreak,
            label: t('longestStreak'),
        },
        {
            icon: <Zap className="size-5 fill-amber-400 text-amber-500" />,
            value: summary.totalXp,
            label: t('totalXp'),
        },
        {
            icon: <Snowflake className="size-5 text-sky-500" />,
            value: summary.streakFreezes,
            label: t('freezes'),
        },
    ]

    return (
        <div className="space-y-8">
            <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
                {stats.map((s) => (
                    <div
                        key={s.label}
                        className="flex items-center gap-3 rounded-2xl border-2 p-3"
                    >
                        {s.icon}
                        <div>
                            <p className="text-xl font-bold tabular-nums">
                                {s.value}
                            </p>
                            <p className="text-muted-foreground text-xs">
                                {s.label}
                            </p>
                        </div>
                    </div>
                ))}
            </div>
            <p className="text-muted-foreground -mt-5 text-xs">
                {t('freezeHint')}
            </p>

            <section className="space-y-3">
                <h3 className="font-semibold">{t('activity')}</h3>
                <ActivityHeatmap
                    today={data.today}
                    activity={data.activity}
                    label={(date, xp) =>
                        t('dayLabel', {
                            date: format.dateTime(
                                new Date(`${date}T12:00:00Z`),
                                { dateStyle: 'medium' }
                            ),
                            xp,
                        })
                    }
                    legend={{ less: t('less'), more: t('more') }}
                />
            </section>

            <section className="space-y-3">
                <h3 className="font-semibold">
                    {t('achievements', {
                        unlocked: unlocked.size,
                        total: ACHIEVEMENTS.length,
                    })}
                </h3>
                <div className="grid gap-2 sm:grid-cols-2 lg:grid-cols-3">
                    {ACHIEVEMENTS.map((a) => (
                        <AchievementBadge
                            key={a.id}
                            achievement={{
                                id: a.id,
                                icon: a.icon,
                                tier: a.tier,
                            }}
                            unlocked={unlocked.has(a.id)}
                            unlockedAt={unlocked.get(a.id)}
                        />
                    ))}
                </div>
            </section>
        </div>
    )
}
