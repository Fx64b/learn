import { countMastery, getMastery } from '@/lib/learn'
import { describe, expect, it } from 'vitest'

import { review } from './fixtures'

describe('getMastery', () => {
    it('maps SRS state to stages', () => {
        expect(getMastery(null)).toBe('new')
        expect(getMastery(review(1, 0))).toBe('learning')
        expect(getMastery(review(10, 0, 1))).toBe('learning')
        expect(getMastery(review(6, 0))).toBe('familiar')
        expect(getMastery(review(30, 0))).toBe('mastered')
    })

    it('counts stages', () => {
        expect(countMastery([null, null, review(1, 0), review(40, 0)])).toEqual(
            { new: 2, learning: 1, familiar: 0, mastered: 1 }
        )
    })
})
