import { type ExerciseDescriptor, gradeOutcome } from '@/lib/learn'
import { describe, expect, it } from 'vitest'

function ex(
    kind: ExerciseDescriptor['kind'],
    itemIds = ['a'],
    props: unknown = {}
) {
    return {
        id: 'e',
        kind,
        itemIds,
        practice: false,
        retry: false,
        props,
    } as ExerciseDescriptor
}

describe('gradeOutcome', () => {
    it('passes flashcard self-grades through', () => {
        expect(
            gradeOutcome(ex('flashcard'), { correct: true, response: 'easy' })
        ).toEqual({ a: 4 })
        expect(
            gradeOutcome(ex('flashcard'), { correct: false, response: 'again' })
        ).toEqual({ a: 1 })
    })

    it('gives again for wrong answers and good for clean ones', () => {
        expect(
            gradeOutcome(ex('multipleChoice'), { correct: false, response: [] })
        ).toEqual({ a: 1 })
        expect(
            gradeOutcome(ex('multipleChoice'), { correct: true, response: [] })
        ).toEqual({ a: 3 })
    })

    it('gives hard when the answer needed help', () => {
        expect(
            gradeOutcome(ex('typeAnswer'), {
                correct: true,
                response: { value: 'x', typo: true, overridden: false },
            })
        ).toEqual({ a: 2 })
        expect(
            gradeOutcome(ex('numberAnswer'), {
                correct: true,
                response: { value: 3, guesses: [1, 3] },
            })
        ).toEqual({ a: 2 })
    })

    it('grades match batches per item', () => {
        const exercise = ex('matchPairs', ['a', 'b', 'c'], {
            answer: [
                { left: 'A', right: '1' },
                { left: 'B', right: '2' },
                { left: 'C', right: '3' },
            ],
        })
        expect(
            gradeOutcome(exercise, {
                correct: true,
                response: {
                    mistakes: 1,
                    wrongAttempts: [{ left: 'A', right: '2' }],
                },
            })
        ).toEqual({ a: 2, b: 2, c: 3 })
    })

    it('gives partial credit for nearly complete lists', () => {
        const list = ex('listRecall')
        const response = (recalled: number, missed: number) => ({
            recalled: Array(recalled).fill('x'),
            missed: Array(missed).fill('y'),
            wrongGuesses: [],
        })
        expect(
            gradeOutcome(list, { correct: false, response: response(8, 2) })
        ).toEqual({ a: 2 })
        expect(
            gradeOutcome(list, { correct: false, response: response(5, 5) })
        ).toEqual({ a: 1 })
    })
})
