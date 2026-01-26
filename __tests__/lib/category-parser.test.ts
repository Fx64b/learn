import { parseCategoryToTags } from '@/lib/category-parser'
import { describe, expect, it } from 'vitest'

describe('parseCategoryToTags', () => {
    describe('JSON array format (new format)', () => {
        it('should parse valid JSON array', () => {
            const result = parseCategoryToTags('["Math","Science","History"]')
            expect(result).toEqual(['Math', 'Science', 'History'])
        })

        it('should trim whitespace from JSON array values', () => {
            const result = parseCategoryToTags(
                '["  Math  "," Science ","History  "]'
            )
            expect(result).toEqual(['Math', 'Science', 'History'])
        })

        it('should filter empty strings from JSON array', () => {
            const result = parseCategoryToTags(
                '["Math","","Science","  ","History"]'
            )
            expect(result).toEqual(['Math', 'Science', 'History'])
        })

        it('should handle empty JSON array', () => {
            const result = parseCategoryToTags('[]')
            expect(result).toEqual([])
        })
    })

    describe('Comma-separated format (legacy)', () => {
        it('should parse comma-separated values', () => {
            const result = parseCategoryToTags('Math, Science, History')
            expect(result).toEqual(['Math', 'Science', 'History'])
        })

        it('should trim whitespace from comma-separated values', () => {
            const result = parseCategoryToTags(
                '  Math  ,  Science  ,  History  '
            )
            expect(result).toEqual(['Math', 'Science', 'History'])
        })

        it('should handle comma-separated without spaces', () => {
            const result = parseCategoryToTags('Math,Science,History')
            expect(result).toEqual(['Math', 'Science', 'History'])
        })

        it('should filter empty values from comma-separated', () => {
            const result = parseCategoryToTags('Math, , Science,  , History')
            expect(result).toEqual(['Math', 'Science', 'History'])
        })
    })

    describe('Space-separated format (legacy)', () => {
        it('should parse space-separated values', () => {
            const result = parseCategoryToTags('Math Science History')
            expect(result).toEqual(['Math', 'Science', 'History'])
        })

        it('should handle multiple spaces between values', () => {
            const result = parseCategoryToTags('Math   Science    History')
            expect(result).toEqual(['Math', 'Science', 'History'])
        })

        it('should filter empty values from space-separated', () => {
            const result = parseCategoryToTags('Math  Science   History')
            expect(result).toEqual(['Math', 'Science', 'History'])
        })
    })

    describe('Single value format (legacy)', () => {
        it('should handle single value', () => {
            const result = parseCategoryToTags('Mathematics')
            expect(result).toEqual(['Mathematics'])
        })

        it('should trim whitespace from single value', () => {
            const result = parseCategoryToTags('  Mathematics  ')
            expect(result).toEqual(['Mathematics'])
        })

        it('should handle empty string', () => {
            const result = parseCategoryToTags('')
            expect(result).toEqual([])
        })

        it('should handle whitespace-only string', () => {
            const result = parseCategoryToTags('   ')
            expect(result).toEqual([])
        })
    })

    describe('Edge cases', () => {
        it('should prioritize comma over space separation', () => {
            const result = parseCategoryToTags('Math Science, History Physics')
            expect(result).toEqual(['Math Science', 'History Physics'])
        })

        it('should handle tags with multiple words when comma-separated', () => {
            const result = parseCategoryToTags(
                'Computer Science, Machine Learning, Data Analysis'
            )
            expect(result).toEqual([
                'Computer Science',
                'Machine Learning',
                'Data Analysis',
            ])
        })

        it('should not split single multi-word category without comma or leading space', () => {
            const result = parseCategoryToTags('ComputerScience')
            expect(result).toEqual(['ComputerScience'])
        })
    })
})
