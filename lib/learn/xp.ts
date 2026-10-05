import type { ExerciseKind } from './types'

const BASE_XP: Record<ExerciseKind, number> = {
    flashcard: 10,
    multipleChoice: 10,
    matchPairs: 10,
    typeAnswer: 15,
    fillBlank: 15,
    numberAnswer: 15,
    buildSentence: 15,
    listRecall: 20,
    firstLetter: 20,
    orderSequence: 20,
    labelDiagram: 20,
    locateOnImage: 20,
}

export const SESSION_COMPLETE_XP = 10
export const PERFECT_SESSION_XP = 10
/** Upper bound for one exercise, used to validate client input. */
export const MAX_EXERCISE_XP = 40

export function isExerciseKind(value: unknown): value is ExerciseKind {
    return typeof value === 'string' && value in BASE_XP
}

/** Bonus for a streak of correct answers: +2 for every 5 in a row, max +10. */
export function comboBonus(combo: number) {
    return Math.min(10, Math.floor(Math.max(0, combo) / 5) * 2)
}

/**
 * XP for one answered exercise. Wrong answers give nothing; a correct retry of
 * an exercise that was missed earlier in the session gives half.
 */
export function exerciseXp(input: {
    kind: ExerciseKind
    correct: boolean
    retry?: boolean
    combo?: number
    /** Items covered (match batches give a little more). */
    items?: number
}) {
    if (!input.correct) return 0
    const base =
        BASE_XP[input.kind] + Math.max(0, Math.min(5, (input.items ?? 1) - 1))
    const xp = input.retry ? Math.ceil(base / 2) : base
    return Math.min(MAX_EXERCISE_XP, xp + comboBonus(input.combo ?? 0))
}

export function sessionBonusXp(input: {
    completed: boolean
    perfect: boolean
}) {
    if (!input.completed) return 0
    return SESSION_COMPLETE_XP + (input.perfect ? PERFECT_SESSION_XP : 0)
}

/** XP for the match game: one per pair plus 5 for a new personal best. */
export function matchGameXp(pairs: number, newBest: boolean) {
    return Math.max(0, pairs) + (newBest ? 5 : 0)
}

/** XP for a practice test: a tenth of the score plus 5 for finishing. */
export function testXp(scorePercent: number) {
    return 5 + Math.round(Math.min(100, Math.max(0, scorePercent)) / 10)
}
