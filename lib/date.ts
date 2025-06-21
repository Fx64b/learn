/**
 * Converts a date to UTC midnight of that date.
 * This ensures consistent date storage regardless of timezone.
 */
export function toUTCDateOnly(date: Date): Date {
    return new Date(
        Date.UTC(
            date.getFullYear(),
            date.getMonth(),
            date.getDate(),
            0,
            0,
            0,
            0
        )
    )
}

/**
 * Creates a date from a timestamp, treating it as a date-only value.
 * Returns a date object set to midnight in the local timezone.
 */
export function fromUTCDateOnly(
    timestamp: number | Date | null | undefined
): Date | null {
    if (!timestamp) return null

    const date = new Date(timestamp)
    return new Date(
        date.getUTCFullYear(),
        date.getUTCMonth(),
        date.getUTCDate(),
        0,
        0,
        0,
        0
    )
}

/**
 * Checks if a date-only timestamp is before today (in user's timezone).
 */
export function isDatePast(
    timestamp: number | Date | null | undefined
): boolean {
    if (!timestamp) return false

    const date = fromUTCDateOnly(timestamp)
    if (!date) return false

    const today = new Date()
    today.setHours(0, 0, 0, 0)

    return date < today
}

/**
 * Checks if a date-only timestamp is today or in the future (in user's timezone).
 */
export function isDateCurrent(
    timestamp: number | Date | null | undefined
): boolean {
    return !isDatePast(timestamp)
}
