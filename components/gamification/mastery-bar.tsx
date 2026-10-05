import type { MasteryCounts } from '@/lib/learn'
import { cn } from '@/lib/utils'

export const MASTERY_COLORS = {
    new: 'bg-muted-foreground/25',
    learning: 'bg-amber-400',
    familiar: 'bg-sky-500',
    mastered: 'bg-emerald-500',
} as const

/** Stacked bar of items per mastery stage. */
export function MasteryBar({
    counts,
    className,
    labels,
}: {
    counts: MasteryCounts
    className?: string
    /** Translated stage names; when given, a legend is shown. */
    labels?: Record<keyof MasteryCounts, string>
}) {
    const total = Object.values(counts).reduce((a, b) => a + b, 0)
    const stages = ['mastered', 'familiar', 'learning', 'new'] as const
    return (
        <div className={cn('space-y-2', className)}>
            <div className="bg-muted flex h-3 w-full overflow-hidden rounded-full">
                {total > 0 &&
                    stages.map((stage) =>
                        counts[stage] ? (
                            <div
                                key={stage}
                                className={cn('h-full', MASTERY_COLORS[stage])}
                                style={{
                                    width: `${(counts[stage] / total) * 100}%`,
                                }}
                            />
                        ) : null
                    )}
            </div>
            {labels && (
                <div className="text-muted-foreground flex flex-wrap gap-x-4 gap-y-1 text-xs">
                    {stages.map((stage) => (
                        <span key={stage} className="flex items-center gap-1.5">
                            <span
                                className={cn(
                                    'size-2.5 rounded-full',
                                    MASTERY_COLORS[stage]
                                )}
                            />
                            {labels[stage]}
                            <span className="text-foreground font-semibold tabular-nums">
                                {counts[stage]}
                            </span>
                        </span>
                    ))}
                </div>
            )}
        </div>
    )
}
