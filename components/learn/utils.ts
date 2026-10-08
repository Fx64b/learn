export function shuffle<T>(items: readonly T[]): T[] {
    const out = [...items]
    for (let i = out.length - 1; i > 0; i--) {
        const j = Math.floor(Math.random() * (i + 1))
        ;[out[i], out[j]] = [out[j], out[i]]
    }
    return out
}

/** Case-, whitespace- and trailing-punctuation-insensitive form used for grading typed text. */
export function normalizeAnswer(value: string, { ignoreAccents = false } = {}) {
    let out = value
        .trim()
        .toLowerCase()
        .replace(/\s+/g, ' ')
        .replace(/[.!?,;:]+$/, '')
    if (ignoreAccents) out = out.normalize('NFD').replace(/\p{Diacritic}/gu, '')
    return out
}

/** True when `value` matches any of the accepted variants after normalization. */
export function matchesAny(
    value: string,
    accepted: readonly string[],
    opts?: { ignoreAccents?: boolean }
) {
    const typed = normalizeAnswer(value, opts)
    return (
        typed.length > 0 &&
        accepted.some((a) => normalizeAnswer(a, opts) === typed)
    )
}

/** Lowercased, accent-free first letter or digit of a word, or null for pure punctuation. */
export function initialOf(word: string) {
    const match = word.normalize('NFD').match(/[\p{L}\p{N}]/u)
    return match ? match[0].toLowerCase() : null
}

/** Edit distance between two strings (insert, delete, substitute). */
export function levenshtein(a: string, b: string) {
    if (a === b) return 0
    let prev = Array.from({ length: b.length + 1 }, (_, i) => i)
    for (let i = 1; i <= a.length; i++) {
        const curr = [i]
        for (let j = 1; j <= b.length; j++) {
            curr[j] = Math.min(
                prev[j] + 1,
                curr[j - 1] + 1,
                prev[j - 1] + (a[i - 1] === b[j - 1] ? 0 : 1)
            )
        }
        prev = curr
    }
    return prev[b.length]
}

/**
 * True when `value` is a small typo of one accepted answer: one edit for
 * answers of 4+ characters, two edits for 8+. Short answers must be exact.
 */
export function isNearMiss(
    value: string,
    accepted: readonly string[],
    opts?: { ignoreAccents?: boolean }
) {
    const typed = normalizeAnswer(value, opts)
    if (!typed) return false
    return accepted.some((a) => {
        const target = normalizeAnswer(a, opts)
        const allowed = target.length >= 8 ? 2 : target.length >= 4 ? 1 : 0
        return allowed > 0 && levenshtein(typed, target) <= allowed
    })
}
