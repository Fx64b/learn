/** Calendar date helpers working on YYYY-MM-DD strings in a user's timezone. */

export function isValidTimeZone(timeZone: unknown): timeZone is string {
    if (typeof timeZone !== 'string' || timeZone.length > 64) return false
    try {
        new Intl.DateTimeFormat('en-US', { timeZone })
        return true
    } catch {
        return false
    }
}

/** Local calendar date of `date` in `timeZone`, e.g. "2026-10-05". */
export function localDate(date: Date, timeZone = 'UTC'): string {
    const zone = isValidTimeZone(timeZone) ? timeZone : 'UTC'
    // en-CA formats as YYYY-MM-DD
    return new Intl.DateTimeFormat('en-CA', {
        timeZone: zone,
        year: 'numeric',
        month: '2-digit',
        day: '2-digit',
    }).format(date)
}

const toUtcMs = (day: string) => Date.parse(`${day}T00:00:00Z`)

/** Whole days from `from` to `to` (positive when `to` is later). */
export function daysBetween(from: string, to: string): number {
    return Math.round((toUtcMs(to) - toUtcMs(from)) / 86_400_000)
}

export function addDays(day: string, days: number): string {
    return new Date(toUtcMs(day) + days * 86_400_000).toISOString().slice(0, 10)
}
