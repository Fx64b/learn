import { describe, it, expect } from 'vitest'
import { calculateNextReview } from '@/lib/srs'

describe('SRS (Spaced Repetition System)', () => {
  describe('calculateNextReview', () => {
    describe('First review (previousInterval = 0)', () => {
      it('should handle "Again" (rating 1) for new cards', () => {
        const result = calculateNextReview(1, 0, 2.5)
        
        expect(result.nextInterval).toBe(1)
        expect(result.newEaseFactor).toBe(2.3) // 2.5 - 0.2
      })

      it('should handle "Hard" (rating 2) for new cards', () => {
        const result = calculateNextReview(2, 0, 2.5)
        
        expect(result.nextInterval).toBe(1)
        expect(result.newEaseFactor).toBe(2.35) // 2.5 - 0.15
      })

      it('should handle "Good" (rating 3) for new cards', () => {
        const result = calculateNextReview(3, 0, 2.5)
        
        expect(result.nextInterval).toBe(1)
        expect(result.newEaseFactor).toBe(2.5) // remains the same
      })

      it('should handle "Easy" (rating 4) for new cards', () => {
        const result = calculateNextReview(4, 0, 2.5)
        
        expect(result.nextInterval).toBe(1)
        expect(result.newEaseFactor).toBe(2.65) // 2.5 + 0.15
      })
    })

    describe('Subsequent reviews (previousInterval > 0)', () => {
      it('should reset to 1 day when "Again" is pressed', () => {
        const result = calculateNextReview(1, 7, 2.5)
        
        expect(result.nextInterval).toBe(1)
        expect(result.newEaseFactor).toBe(2.3) // 2.5 - 0.2
      })

      it('should handle "Hard" rating correctly', () => {
        const result = calculateNextReview(2, 7, 2.5)
        
        expect(result.nextInterval).toBe(Math.ceil(7 * 1.2)) // 9 days
        expect(result.newEaseFactor).toBe(2.35) // 2.5 - 0.15
      })

      it('should handle "Good" rating correctly', () => {
        const result = calculateNextReview(3, 7, 2.5)
        
        expect(result.nextInterval).toBe(Math.ceil(7 * 2.5)) // 18 days
        expect(result.newEaseFactor).toBe(2.5) // remains the same
      })

      it('should handle "Easy" rating correctly', () => {
        const result = calculateNextReview(4, 7, 2.5)
        
        expect(result.nextInterval).toBe(Math.ceil(7 * 2.5 * 1.3)) // 23 days
        expect(result.newEaseFactor).toBe(2.65) // 2.5 + 0.15
      })
    })

    describe('Edge cases and constraints', () => {
      it('should ensure minimum ease factor of 1.3', () => {
        const result = calculateNextReview(1, 5, 1.3)
        
        expect(result.newEaseFactor).toBe(1.3) // should not go below 1.3
      })

      it('should cap interval at 365 days', () => {
        const result = calculateNextReview(4, 300, 4.0)
        
        expect(result.nextInterval).toBe(365) // capped at 365
        expect(result.newEaseFactor).toBe(4.15)
      })

      it('should handle minimum interval of 1 day for Hard rating', () => {
        const result = calculateNextReview(2, 1, 2.0)
        
        expect(result.nextInterval).toBeGreaterThanOrEqual(1)
      })

      it('should handle very low ease factors', () => {
        const result = calculateNextReview(1, 10, 1.4)
        
        expect(result.newEaseFactor).toBe(1.3) // minimum enforced
        expect(result.nextInterval).toBe(1)
      })
    })

    describe('SuperMemo-2 algorithm compliance', () => {
      it('should follow the basic SuperMemo-2 progression', () => {
        // Simulate a typical learning sequence
        let interval = 0
        let easeFactor = 2.5

        // First review - Good
        const review1 = calculateNextReview(3, interval, easeFactor)
        expect(review1.nextInterval).toBe(1)
        expect(review1.newEaseFactor).toBe(2.5)

        // Second review - Good
        interval = review1.nextInterval
        easeFactor = review1.newEaseFactor
        const review2 = calculateNextReview(3, interval, easeFactor)
        expect(review2.nextInterval).toBe(Math.ceil(1 * 2.5)) // 3 days

        // Third review - Good
        interval = review2.nextInterval
        easeFactor = review2.newEaseFactor
        const review3 = calculateNextReview(3, interval, easeFactor)
        expect(review3.nextInterval).toBe(Math.ceil(3 * 2.5)) // 8 days
      })

      it('should handle difficulty degradation correctly', () => {
        let interval = 7
        let easeFactor = 2.5

        // Mark as "Again" should reset
        const result1 = calculateNextReview(1, interval, easeFactor)
        expect(result1.nextInterval).toBe(1)
        expect(result1.newEaseFactor).toBeLessThan(easeFactor)

        // Multiple "Again" ratings should continue lowering ease factor
        interval = result1.nextInterval
        easeFactor = result1.newEaseFactor
        const result2 = calculateNextReview(1, interval, easeFactor)
        expect(result2.newEaseFactor).toBeLessThan(result1.newEaseFactor)
      })
    })

    describe('Mathematical precision', () => {
      it('should handle decimal intervals correctly', () => {
        const result = calculateNextReview(3, 3, 2.7)
        
        expect(result.nextInterval).toBe(Math.ceil(3 * 2.7)) // 9 days
        expect(Number.isInteger(result.nextInterval)).toBe(true)
      })

      it('should maintain ease factor precision', () => {
        const result = calculateNextReview(4, 5, 2.33)
        
        expect(result.newEaseFactor).toBe(2.48) // 2.33 + 0.15
        expect(typeof result.newEaseFactor).toBe('number')
      })
    })

    describe('Boundary value testing', () => {
      it('should handle rating boundaries correctly', () => {
        // Test each valid rating
        [1, 2, 3, 4].forEach(rating => {
          const result = calculateNextReview(rating as 1 | 2 | 3 | 4, 5, 2.5)
          expect(result.nextInterval).toBeGreaterThan(0)
          expect(result.newEaseFactor).toBeGreaterThanOrEqual(1.3)
        })
      })

      it('should handle extreme ease factors', () => {
        // Very low ease factor
        const lowResult = calculateNextReview(3, 5, 1.3)
        expect(lowResult.newEaseFactor).toBe(1.3)
        
        // High ease factor
        const highResult = calculateNextReview(3, 5, 4.0)
        expect(highResult.newEaseFactor).toBe(4.0)
      })

      it('should handle large intervals', () => {
        const result = calculateNextReview(3, 200, 2.5)
        expect(result.nextInterval).toBe(365) // capped
      })
    })
  })
})