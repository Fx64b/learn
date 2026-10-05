import { addDays, daysBetween } from '@/lib/gamification'
import { cn } from '@/lib/utils'

interface ActivityHeatmapProps {
    today: string
    activity: { date: string; xp: number; exercises: number }[]
    weeks?: number
    /** Formats the tooltip of one day. */
    label: (date: string, xp: number) => string
    legend: { less: string; more: string }
}

const LEVELS = [
    'bg-muted',
    'bg-emerald-200 dark:bg-emerald-900',
    'bg-emerald-300 dark:bg-emerald-700',
    'bg-emerald-400 dark:bg-emerald-600',
    'bg-emerald-500 dark:bg-emerald-400',
]

function level(xp: number) {
    if (xp <= 0) return 0
    if (xp < 20) return 1
    if (xp < 50) return 2
    if (xp < 100) return 3
    return 4
}

/** GitHub-style grid of daily XP, one column per week (Monday first). */
export function ActivityHeatmap({
    today,
    activity,
    weeks = 26,
    label,
    legend,
}: ActivityHeatmapProps) {
    const byDate = new Map(activity.map((a) => [a.date, a.xp]))
    // getUTCDay on the date string: 0 = Sunday. Shift so Monday = 0.
    const weekday = (new Date(`${today}T00:00:00Z`).getUTCDay() + 6) % 7
    const start = addDays(today, -(weeks - 1) * 7 - weekday)
    const columns = Array.from({ length: weeks }, (_, w) =>
        Array.from({ length: 7 }, (_, d) => addDays(start, w * 7 + d))
    )

    return (
        <div className="space-y-2">
            <div className="overflow-x-auto pb-1">
                <div className="flex w-max gap-1">
                    {columns.map((days, i) => (
                        <div key={i} className="flex flex-col gap-1">
                            {days.map((day) => {
                                const future = daysBetween(today, day) > 0
                                const xp = byDate.get(day) ?? 0
                                return (
                                    <div
                                        key={day}
                                        title={
                                            future ? undefined : label(day, xp)
                                        }
                                        className={cn(
                                            'size-3 rounded-[3px]',
                                            future
                                                ? 'bg-transparent'
                                                : LEVELS[level(xp)],
                                            day === today &&
                                                'ring-foreground/40 ring-1'
                                        )}
                                    />
                                )
                            })}
                        </div>
                    ))}
                </div>
            </div>
            <div className="text-muted-foreground flex items-center justify-end gap-1 text-xs">
                {legend.less}
                {LEVELS.map((cls) => (
                    <span
                        key={cls}
                        className={cn('size-3 rounded-[3px]', cls)}
                    />
                ))}
                {legend.more}
            </div>
        </div>
    )
}
