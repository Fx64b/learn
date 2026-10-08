import type { Item } from '@/lib/items'

import type { DiagramLabel } from '@/components/learn/label-diagram'
import type { MatchPair } from '@/components/learn/match-pairs'
import type { SequenceItem } from '@/components/learn/order-sequence'

export const MASTERY_LEVELS = [
    'new',
    'learning',
    'familiar',
    'mastered',
] as const
export type Mastery = (typeof MASTERY_LEVELS)[number]

/** Latest SRS state of an item for a user (a `cardReviews` row). */
export interface ReviewState {
    rating: number
    interval: number
    easeFactor: number
    nextReview: Date
}

export interface StudyItem {
    item: Item
    review: ReviewState | null
}

export type Rng = () => number

interface Base<K extends string, P> {
    /** Unique within a session. */
    id: string
    kind: K
    /** Items graded by this exercise. */
    itemIds: string[]
    /** Practice only: no SRS update (e.g. items that are not due yet, tests). */
    practice: boolean
    /** A repeat of an exercise that was answered wrong earlier in the session. */
    retry: boolean
    props: P
}

export type ExerciseDescriptor =
    | Base<'flashcard', { question: string; answer: string }>
    | Base<
          'multipleChoice',
          { question: string; options: string[]; answer: string | string[] }
      >
    | Base<
          'typeAnswer',
          { question: string; answer: string[]; allowOverride: boolean }
      >
    | Base<'matchPairs', { answer: MatchPair[]; question?: string }>
    | Base<
          'fillBlank',
          {
              question: string
              answer: string[]
              distractors: string[]
              hint?: string
          }
      >
    | Base<
          'buildSentence',
          { question: string; answer: string; distractors: string[] }
      >
    | Base<
          'firstLetter',
          {
              question: string
              answer: string
              hint: 'full' | 'partial' | 'none'
              allowedMistakes: number
          }
      >
    | Base<'listRecall', { question: string; answer: (string | string[])[] }>
    | Base<
          'orderSequence',
          {
              question: string
              answer: SequenceItem[]
              ends?: [string, string]
          }
      >
    | Base<
          'numberAnswer',
          {
              question: string
              answer: number
              tolerance: number
              unit?: string
              attempts: number
          }
      >
    | Base<
          'labelDiagram',
          {
              question: string
              image: string
              alt: string
              answer: DiagramLabel[]
              distractors: string[]
          }
      >
    | Base<
          'locateOnImage',
          {
              question: string
              image: string
              alt: string
              answer: { x: number; y: number }
              tolerance: number
              label: string
          }
      >

export type ExerciseKind = ExerciseDescriptor['kind']

export type ExerciseOf<K extends ExerciseKind> = Extract<
    ExerciseDescriptor,
    { kind: K }
>

/** What an exercise component reported, normalized for grading. */
export interface ExerciseOutcome {
    correct: boolean
    /** Component-specific response (see components/learn). */
    response: unknown
}
