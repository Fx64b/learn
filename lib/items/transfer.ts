import type { Item } from './schema'
import { type ItemRowValues, itemToInput, toItemRow } from './summary'

/** Most items one import may create. */
export const MAX_IMPORT_ITEMS = 200

export interface ImportResult {
    rows: ItemRowValues[]
    errors: { index: number; error: string }[]
}

/**
 * Parses an import: a JSON array of items, or `{ "items": [...] }`. Entries
 * without a `type` are classic `{ front, back }` cards.
 */
export function parseImport(json: string): ImportResult | { error: string } {
    let data: unknown
    try {
        data = JSON.parse(json)
    } catch {
        return { error: 'invalidJson' }
    }
    const list = Array.isArray(data)
        ? data
        : data &&
            typeof data === 'object' &&
            Array.isArray((data as { items?: unknown }).items)
          ? (data as { items: unknown[] }).items
          : null
    if (!list) return { error: 'invalidJsonArray' }
    if (list.length > MAX_IMPORT_ITEMS) return { error: 'tooManyItems' }

    const result: ImportResult = { rows: [], errors: [] }
    list.forEach((entry, index) => {
        const raw =
            entry && typeof entry === 'object' && !('type' in entry)
                ? { ...entry, type: 'basic' }
                : entry
        const row = toItemRow(raw)
        if (row.success) result.rows.push(row.data)
        else result.errors.push({ index, error: row.error })
    })
    return result
}

/** Export form of an item. Basic cards stay `{ front, back }` for compatibility. */
export function toExportItem(item: Item) {
    const input = itemToInput(item)
    if (input.type === 'basic') {
        return {
            front: input.front,
            back: input.back,
            ...(input.content ? { content: input.content } : {}),
        }
    }
    return input
}
