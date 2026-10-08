import type { FirstLetterRecallResponse } from '@/components/learn/first-letter-recall'
import type { FlashcardGrade } from '@/components/learn/flashcard'
import type { ListRecallResponse } from '@/components/learn/list-recall'
import type { MatchPairsResponse } from '@/components/learn/match-pairs'
import type { NumberAnswerResponse } from '@/components/learn/number-answer'
import type { TypeAnswerResponse } from '@/components/learn/type-answer'

import type { ExerciseDescriptor, ExerciseOutcome } from './types'

/** SM-2 grade: 1 = again, 2 = hard, 3 = good, 4 = easy. */
export type SrsGrade = 1 | 2 | 3 | 4

const FLASHCARD_GRADES: Record<FlashcardGrade, SrsGrade> = {
    again: 1,
    hard: 2,
    good: 3,
    easy: 4,
}

/** Share of a list that must be recalled for a failed attempt to count as "hard". */
const LIST_PARTIAL_CREDIT = 0.8

/**
 * Maps an exercise outcome to an SRS grade for every item it covers.
 * Only self-graded flashcards can give "easy"; objective exercises give
 * "good" when clean and "hard" when the answer needed help (typos, extra
 * guesses, mistakes within the allowance).
 */
export function gradeOutcome(
    exercise: ExerciseDescriptor,
    outcome: ExerciseOutcome
): Record<string, SrsGrade> {
    const all = (grade: SrsGrade) =>
        Object.fromEntries(exercise.itemIds.map((id) => [id, grade]))

    switch (exercise.kind) {
        case 'flashcard': {
            const grade = FLASHCARD_GRADES[outcome.response as FlashcardGrade]
            return all(grade ?? (outcome.correct ? 3 : 1))
        }
        case 'matchPairs': {
            const response = outcome.response as MatchPairsResponse | undefined
            if (exercise.itemIds.length === 1) {
                if (!outcome.correct) return all(1)
                return all(response?.mistakes ? 2 : 3)
            }
            // Batch of basic items: the items involved in a wrong pairing are hard.
            const missed = new Set(
                (response?.wrongAttempts ?? []).flatMap((w) => [
                    w.left,
                    w.right,
                ])
            )
            return Object.fromEntries(
                exercise.itemIds.map((id, i) => {
                    const pair = exercise.props.answer[i]
                    const hard =
                        pair &&
                        (missed.has(pair.left) || missed.has(pair.right))
                    return [id, hard ? 2 : 3]
                })
            )
        }
        case 'listRecall': {
            const response = outcome.response as ListRecallResponse | undefined
            if (outcome.correct) return all(3)
            const total =
                (response?.recalled.length ?? 0) +
                (response?.missed.length ?? 0)
            const ratio = total ? (response?.recalled.length ?? 0) / total : 0
            return all(ratio >= LIST_PARTIAL_CREDIT ? 2 : 1)
        }
        default:
            break
    }

    if (!outcome.correct) return all(1)

    switch (exercise.kind) {
        case 'typeAnswer': {
            const response = outcome.response as TypeAnswerResponse | undefined
            return all(response?.typo ? 2 : 3)
        }
        case 'numberAnswer': {
            const response = outcome.response as
                NumberAnswerResponse | undefined
            return all((response?.guesses.length ?? 1) > 1 ? 2 : 3)
        }
        case 'firstLetter': {
            const response = outcome.response as
                FirstLetterRecallResponse | undefined
            return all(response?.mistakes ? 2 : 3)
        }
        default:
            return all(3)
    }
}

export function isValidGrade(value: unknown): value is SrsGrade {
    return value === 1 || value === 2 || value === 3 || value === 4
}
