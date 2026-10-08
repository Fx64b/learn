import { detectImageType } from '@/lib/image-type'
import { parseImport, parseItemRow, toExportItem } from '@/lib/items'
import { describe, expect, it } from 'vitest'

describe('parseImport', () => {
    it('accepts classic front/back cards', () => {
        const res = parseImport(JSON.stringify([{ front: 'Q', back: 'A' }]))
        expect(res).toEqual({
            rows: [{ type: 'basic', front: 'Q', back: 'A', content: null }],
            errors: [],
        })
    })

    it('accepts typed items and { items } wrappers', () => {
        const res = parseImport(
            JSON.stringify({
                items: [
                    {
                        type: 'list',
                        front: 'Continents',
                        content: { items: ['Asia', 'Europe'] },
                    },
                ],
            })
        )
        expect('rows' in res && res.rows[0].type).toBe('list')
    })

    it('reports invalid entries and keeps valid ones', () => {
        const res = parseImport(
            JSON.stringify([
                { front: 'Q', back: 'A' },
                { front: 'only front' },
                { type: 'number', front: 'n', content: { value: 'x' } },
            ])
        )
        expect('rows' in res && res.rows).toHaveLength(1)
        expect('errors' in res && res.errors.map((e) => e.index)).toEqual([
            1, 2,
        ])
    })

    it('rejects broken JSON, non-arrays and huge imports', () => {
        expect(parseImport('{nope')).toEqual({ error: 'invalidJson' })
        expect(parseImport('{"a":1}')).toEqual({ error: 'invalidJsonArray' })
        expect(
            parseImport(
                JSON.stringify(Array(201).fill({ front: 'q', back: 'a' }))
            )
        ).toEqual({ error: 'tooManyItems' })
    })
})

describe('toExportItem', () => {
    it('keeps basic cards in the classic format', () => {
        const item = parseItemRow({
            id: '1',
            deckId: 'd',
            front: 'Q',
            back: 'A',
        })
        expect(toExportItem(item)).toEqual({ front: 'Q', back: 'A' })
    })

    it('round-trips typed items through import', () => {
        const item = parseItemRow({
            id: '1',
            deckId: 'd',
            type: 'number',
            front: 'Everest',
            back: '',
            content: JSON.stringify({ value: 8849, unit: 'm' }),
        })
        const res = parseImport(JSON.stringify([toExportItem(item)]))
        expect('rows' in res && res.rows[0]).toMatchObject({
            type: 'number',
            front: 'Everest',
            back: '8849 m',
        })
    })
})

describe('detectImageType', () => {
    it('detects formats from magic bytes', () => {
        const png = new Uint8Array([
            0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a,
        ])
        const jpg = new Uint8Array([0xff, 0xd8, 0xff, 0xe0])
        const webp = new Uint8Array([
            0x52, 0x49, 0x46, 0x46, 0, 0, 0, 0, 0x57, 0x45, 0x42, 0x50,
        ])
        const svg = new TextEncoder().encode('<svg onload="alert(1)">')
        expect(detectImageType(png)).toBe('image/png')
        expect(detectImageType(jpg)).toBe('image/jpeg')
        expect(detectImageType(webp)).toBe('image/webp')
        expect(detectImageType(svg)).toBeNull()
    })
})

describe('documentation examples', () => {
    it('are all valid imports', async () => {
        const { DOCS_EXAMPLES } = await import(
            '@/components/site/docs-examples'
        )
        const res = parseImport(JSON.stringify(Object.values(DOCS_EXAMPLES)))
        expect('errors' in res && res.errors).toEqual([])
        expect('rows' in res && res.rows).toHaveLength(9)
    })
})
