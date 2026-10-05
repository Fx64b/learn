import de from '@/messages/de.json'
import en from '@/messages/en.json'
import { describe, expect, it } from 'vitest'

/** Em dash, en dash, minus sign and non-standard spaces. */
const FORBIDDEN = new RegExp(
    '[\\u2014\\u2013\\u2212\\u00a0\\u202f\\u2009\\u200a\\u2002-\\u2008\\u200b\\ufeff]'
)

function strings(value: unknown, path = ''): [string, string][] {
    if (typeof value === 'string') return [[path, value]]
    if (Array.isArray(value))
        return value.flatMap((v, i) => strings(v, `${path}[${i}]`))
    if (value && typeof value === 'object')
        return Object.entries(value).flatMap(([k, v]) =>
            strings(v, path ? `${path}.${k}` : k)
        )
    return []
}

describe.each([
    ['en', en],
    ['de', de],
])('%s messages', (_, messages) => {
    const all = strings(messages)

    it('use plain hyphens and normal spaces only', () => {
        expect(all.filter(([, s]) => FORBIDDEN.test(s))).toEqual([])
    })

    it('contain no semicolons', () => {
        expect(all.filter(([, s]) => s.includes(';'))).toEqual([])
    })
})
