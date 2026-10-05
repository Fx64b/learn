import { describe, expect, it } from 'vitest'

import {
    initialOf,
    isNearMiss,
    levenshtein,
    matchesAny,
    normalizeAnswer,
} from '@/components/learn/utils'

describe('learn utils', () => {
    it('normalizes answers', () => {
        expect(normalizeAnswer('  Hello   World! ')).toBe('hello world')
        expect(normalizeAnswer('Brasília', { ignoreAccents: true })).toBe(
            'brasilia'
        )
    })

    it('matches accepted variants', () => {
        expect(matchesAny('oceania', ['Australia', 'Oceania'])).toBe(true)
        expect(matchesAny('', [''])).toBe(false)
    })

    it('finds first letters', () => {
        expect(initialOf('“Four')).toBe('f')
        expect(initialOf('-')).toBeNull()
        expect(initialOf('Élan')).toBe('e')
    })

    it('computes edit distance', () => {
        expect(levenshtein('kitten', 'sitting')).toBe(3)
        expect(levenshtein('', 'abc')).toBe(3)
    })

    it('accepts typos only for longer answers', () => {
        expect(isNearMiss('Canbera', ['Canberra'])).toBe(true)
        expect(isNearMiss('Ag', ['Au'])).toBe(false)
        expect(isNearMiss('Photosinthesys', ['Photosynthesis'])).toBe(true)
        expect(isNearMiss('Photosinthasys', ['Photosynthesis'])).toBe(false)
    })
})
