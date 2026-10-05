import { cn } from '@/lib/utils'
import { Flame } from 'lucide-react'

interface StreakBadgeProps {
    streak: number
    /** Not active today yet: the flame is shown grey. */
    atRisk?: boolean
    className?: string
    label?: string
}

export function StreakBadge({
    streak,
    atRisk = false,
    className,
    label,
}: StreakBadgeProps) {
    const lit = streak > 0 && !atRisk
    return (
        <span
            className={cn(
                'inline-flex items-center gap-1 font-bold tabular-nums',
                lit ? 'text-orange-500' : 'text-muted-foreground',
                className
            )}
            title={label}
            aria-label={label}
        >
            <Flame
                className={cn('size-5', lit && 'fill-orange-400')}
                aria-hidden
            />
            {streak}
        </span>
    )
}
