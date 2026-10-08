import { type Item, parseItemRow } from '@/lib/items'
import type { ReviewState, StudyItem } from '@/lib/learn'

let n = 0
export function basic(front: string, back: string): Item {
    return parseItemRow({ id: `b${++n}`, deckId: 'd', front, back })
}

export function typed(type: string, front: string, content: unknown): Item {
    const item = parseItemRow({
        id: `${type}${++n}`,
        deckId: 'd',
        type,
        front,
        back: '',
        content: JSON.stringify(content),
    })
    if (item.type !== type) throw new Error(`invalid ${type} fixture`)
    return item
}

export const NOW = new Date('2026-10-05T12:00:00Z')
const DAY = 24 * 60 * 60 * 1000

export function review(
    interval: number,
    dueInDays: number,
    rating = 3
): ReviewState {
    return {
        rating,
        interval,
        easeFactor: 2.5,
        nextReview: new Date(NOW.getTime() + dueInDays * DAY),
    }
}

export function study(item: Item, r: ReviewState | null = null): StudyItem {
    return { item, review: r }
}

export const CAPITALS = [
    ['Canada', 'Ottawa'],
    ['Japan', 'Tokyo'],
    ['Kenya', 'Nairobi'],
    ['Brazil', 'Brasília'],
    ['Turkey', 'Ankara'],
    ['Peru', 'Lima'],
].map(([f, b]) => basic(f, b))
