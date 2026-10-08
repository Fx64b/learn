import type { Rng } from './types'

/** Small seeded PRNG (mulberry32) for reproducible plans in tests. */
export function seededRng(seed: number): Rng {
    let a = seed >>> 0
    return () => {
        a = (a + 0x6d2b79f5) >>> 0
        let t = a
        t = Math.imul(t ^ (t >>> 15), t | 1)
        t ^= t + Math.imul(t ^ (t >>> 7), t | 61)
        return ((t ^ (t >>> 14)) >>> 0) / 4294967296
    }
}

export function shuffleWith<T>(items: readonly T[], rng: Rng): T[] {
    const out = [...items]
    for (let i = out.length - 1; i > 0; i--) {
        const j = Math.floor(rng() * (i + 1))
        ;[out[i], out[j]] = [out[j], out[i]]
    }
    return out
}

export function pick<T>(items: readonly T[], rng: Rng): T {
    return items[Math.floor(rng() * items.length)]
}

let counter = 0
/** Short unique id for exercises within a session. */
export function exerciseId(rng: Rng) {
    counter = (counter + 1) % 1_000_000
    return `${counter.toString(36)}${Math.floor(rng() * 1e9).toString(36)}`
}
