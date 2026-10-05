import {
    BLANK_PATTERN,
    type Item,
    type ItemContentMap,
    type ItemInput,
    type ItemType,
    contentSchemas,
    isItemType,
    itemInputSchema,
} from './schema'

/** Display form of a list entry (the first alias). */
export function listEntryLabel(entry: string | string[]) {
    return Array.isArray(entry) ? entry[0] : entry
}

export function fillCloze(text: string, answers: string[]) {
    let i = 0
    return text.replace(BLANK_PATTERN, () => answers[i++] ?? '___')
}

/** Plain-text answer summary stored in `flashcards.back`. */
export function summarizeContent<K extends ItemType>(
    type: K,
    content: ItemContentMap[K],
    back = ''
): string {
    const c = content as ItemContentMap[ItemType]
    switch (type) {
        case 'basic':
            return back
        case 'choice':
            return (c as ItemContentMap['choice']).answer.join(', ')
        case 'cloze': {
            const cloze = c as ItemContentMap['cloze']
            return fillCloze(cloze.text, cloze.answers)
        }
        case 'passage':
            return (c as ItemContentMap['passage']).text
        case 'list':
            return (c as ItemContentMap['list']).items
                .map(listEntryLabel)
                .join(', ')
        case 'sequence':
            return (c as ItemContentMap['sequence']).items
                .map((i) => i.label)
                .join(' → ')
        case 'number': {
            const n = c as ItemContentMap['number']
            const tolerance = n.tolerance ? ` (±${n.tolerance})` : ''
            return `${n.value}${n.unit ? ` ${n.unit}` : ''}${tolerance}`
        }
        case 'pairs':
            return (c as ItemContentMap['pairs']).pairs
                .map((p) => `${p.left} – ${p.right}`)
                .join('; ')
        case 'diagram':
            return (c as ItemContentMap['diagram']).labels
                .map((l) => l.label)
                .join(', ')
        default:
            return back
    }
}

function defaultFront(input: ItemInput): string {
    switch (input.type) {
        case 'cloze':
            return input.content.text
        case 'pairs':
            return input.content.pairs.map((p) => p.left).join(', ')
        default:
            return ''
    }
}

export interface ItemRowValues {
    type: ItemType
    front: string
    back: string
    content: string | null
}

/** Validates editor/import/AI input and returns the column values to store. */
export function toItemRow(
    raw: unknown
): { success: true; data: ItemRowValues } | { success: false; error: string } {
    const parsed = itemInputSchema.safeParse(raw)
    if (!parsed.success) {
        const issue = parsed.error.issues[0]
        return {
            success: false,
            error: `${issue.path.join('.') || 'item'}: ${issue.message}`,
        }
    }
    const input = parsed.data
    const front = input.front?.trim() || defaultFront(input)
    if (input.type === 'basic') {
        const accept = input.content?.accept?.filter(Boolean)
        return {
            success: true,
            data: {
                type: 'basic',
                front,
                back: input.back,
                content: accept?.length ? JSON.stringify({ accept }) : null,
            },
        }
    }
    return {
        success: true,
        data: {
            type: input.type,
            front,
            back: summarizeContent(input.type, input.content as never),
            content: JSON.stringify(input.content),
        },
    }
}

interface StoredRow {
    id: string
    deckId: string
    type?: string | null
    front: string
    back: string
    content?: string | null
}

/** Turns a stored row into an `Item`. Broken content falls back to a basic card. */
export function parseItemRow(row: StoredRow): Item {
    const base = {
        id: row.id,
        deckId: row.deckId,
        front: row.front,
        back: row.back,
    }
    const type = isItemType(row.type) ? row.type : 'basic'
    if (type !== 'basic' && row.content) {
        try {
            const parsed = contentSchemas[type].safeParse(
                JSON.parse(row.content)
            )
            if (parsed.success) {
                return { ...base, type, content: parsed.data } as Item
            }
        } catch {
            // fall through to basic
        }
    }
    let content: ItemContentMap['basic'] = {}
    if (type === 'basic' && row.content) {
        try {
            const parsed = contentSchemas.basic.safeParse(
                JSON.parse(row.content)
            )
            if (parsed.success) content = parsed.data
        } catch {
            // ignore broken accept list
        }
    }
    return { ...base, type: 'basic', content }
}

/** Converts an item back into editable input (used by the editor and export). */
export function itemToInput(item: Item): ItemInput {
    if (item.type === 'basic') {
        return {
            type: 'basic',
            front: item.front,
            back: item.back,
            ...(item.content.accept?.length ? { content: item.content } : {}),
        }
    }
    return {
        type: item.type,
        front: item.front,
        content: item.content,
    } as ItemInput
}
