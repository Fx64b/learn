import type { Item, ItemOf } from '@/lib/items'

import { normalizeAnswer } from '@/components/learn/utils'

import { exerciseId, pick, shuffleWith } from './random'
import type { ExerciseDescriptor, Mastery, Rng } from './types'

/** Answers longer than this are self-graded instead of typed. */
export const MAX_TYPEABLE_LENGTH = 60
/** Passages with up to this many words can be rebuilt from word tiles. */
const MAX_BUILD_WORDS = 25
const MAX_MATCH_PAIRS = 6

export interface PlanContext {
    rng: Rng
    /** Other items, used to build distractors for multiple choice. */
    pool: readonly Item[]
    practice?: boolean
}

type Draft = ExerciseDescriptor extends infer D
    ? D extends ExerciseDescriptor
        ? Omit<D, 'id' | 'practice' | 'retry'>
        : never
    : never

function finish(draft: Draft, ctx: PlanContext): ExerciseDescriptor {
    return {
        ...draft,
        id: exerciseId(ctx.rng),
        practice: ctx.practice ?? false,
        retry: false,
    } as ExerciseDescriptor
}

const isTypeable = (text: string) =>
    text.length > 0 &&
    text.length <= MAX_TYPEABLE_LENGTH &&
    !text.includes('\n')

/** Picks up to `count` distinct wrong answers of similar length from `candidates`. */
export function pickDistractors(
    answer: string,
    candidates: readonly string[],
    count: number,
    rng: Rng
): string[] {
    const seen = new Set([normalizeAnswer(answer)])
    const unique: string[] = []
    for (const c of shuffleWith(candidates, rng)) {
        const key = normalizeAnswer(c)
        if (!key || seen.has(key)) continue
        seen.add(key)
        unique.push(c)
    }
    // Prefer options of similar length so the answer does not stand out.
    unique.sort(
        (a, b) =>
            Math.abs(a.length - answer.length) -
            Math.abs(b.length - answer.length)
    )
    return unique.slice(0, count)
}

/** Plausible wrong numbers for multiple choice. */
export function numericDistractors(
    value: number,
    tolerance: number,
    count: number,
    rng: Rng
): number[] {
    const decimals = (String(value).split('.')[1] ?? '').length
    const round = (n: number) => Number(n.toFixed(decimals))
    const isYear = Number.isInteger(value) && value >= 1000 && value <= 2100
    let candidates: number[]
    if (isYear) {
        candidates = [-50, -25, -12, -7, -3, 3, 7, 12, 25, 50].map(
            (d) => value + d
        )
    } else if (Number.isInteger(value) && Math.abs(value) < 12) {
        candidates = [-3, -2, -1, 1, 2, 3, 4].map((d) => value + d)
    } else {
        candidates = [0.5, 0.7, 0.8, 0.9, 1.1, 1.25, 1.5, 2].map((f) =>
            round(value * f)
        )
    }
    const valid = [
        ...new Set(
            candidates.filter(
                (n) => n !== value && Math.abs(n - value) > tolerance
            )
        ),
    ]
    return shuffleWith(valid, rng).slice(0, count)
}

function basicAnswers(item: ItemOf<'basic'>) {
    return [item.back, ...(item.content.accept ?? [])]
}

function planBasic(
    item: ItemOf<'basic'>,
    mastery: Mastery,
    ctx: PlanContext
): Draft {
    const typeable = isTypeable(item.back)
    if (mastery === 'new') {
        const pool = ctx.pool
            .filter((p) => p.type === 'basic' && p.id !== item.id)
            .map((p) => p.back)
        const distractors = pickDistractors(item.back, pool, 3, ctx.rng)
        if (distractors.length >= 2) {
            return {
                kind: 'multipleChoice',
                itemIds: [item.id],
                props: {
                    question: item.front,
                    options: shuffleWith([item.back, ...distractors], ctx.rng),
                    answer: item.back,
                },
            }
        }
    }
    if (typeable) {
        return {
            kind: 'typeAnswer',
            itemIds: [item.id],
            props: {
                question: item.front,
                answer: basicAnswers(item),
                allowOverride: true,
            },
        }
    }
    return {
        kind: 'flashcard',
        itemIds: [item.id],
        props: { question: item.front, answer: item.back },
    }
}

function planCloze(
    item: ItemOf<'cloze'>,
    mastery: Mastery,
    ctx: PlanContext
): Draft {
    const { text, answers } = item.content
    const recall = mastery === 'familiar' || mastery === 'mastered'
    if (recall && answers.length === 1) {
        return {
            kind: 'typeAnswer',
            itemIds: [item.id],
            props: {
                question: text,
                answer: [answers[0]],
                allowOverride: true,
            },
        }
    }
    const others = ctx.pool
        .filter((p) => p.type === 'cloze' && p.id !== item.id)
        .flatMap((p) => (p as ItemOf<'cloze'>).content.answers)
    const distractors = item.content.distractors?.length
        ? item.content.distractors
        : pickDistractors(answers[0], others, 2, ctx.rng)
    return {
        kind: 'fillBlank',
        itemIds: [item.id],
        props: {
            question: text,
            answer: answers,
            distractors,
            hint: item.front && item.front !== text ? item.front : undefined,
        },
    }
}

function planPassage(item: ItemOf<'passage'>, mastery: Mastery): Draft {
    const text = item.content.text
    const words = text.split(/\s+/).filter(Boolean)
    if (mastery === 'new' && words.length <= MAX_BUILD_WORDS) {
        return {
            kind: 'buildSentence',
            itemIds: [item.id],
            props: { question: item.front, answer: text, distractors: [] },
        }
    }
    const hint =
        mastery === 'new' || mastery === 'learning'
            ? 'full'
            : mastery === 'familiar'
              ? 'partial'
              : 'none'
    return {
        kind: 'firstLetter',
        itemIds: [item.id],
        props: {
            question: item.front,
            answer: text,
            hint,
            allowedMistakes: Math.floor(words.length / 10),
        },
    }
}

function planNumber(
    item: ItemOf<'number'>,
    mastery: Mastery,
    ctx: PlanContext
): Draft {
    const { value, unit } = item.content
    const tolerance = item.content.tolerance ?? 0
    if (mastery === 'new') {
        const wrong = numericDistractors(value, tolerance, 3, ctx.rng)
        if (wrong.length >= 2) {
            const format = (n: number) => `${n}${unit ? ` ${unit}` : ''}`
            const answer = format(value)
            return {
                kind: 'multipleChoice',
                itemIds: [item.id],
                props: {
                    question: item.front,
                    options: shuffleWith(
                        [answer, ...wrong.map(format)],
                        ctx.rng
                    ),
                    answer,
                },
            }
        }
    }
    return {
        kind: 'numberAnswer',
        itemIds: [item.id],
        props: {
            question: item.front,
            answer: value,
            tolerance,
            unit,
            attempts:
                mastery === 'mastered' ? 1 : mastery === 'familiar' ? 2 : 3,
        },
    }
}

function planDiagram(
    item: ItemOf<'diagram'>,
    mastery: Mastery,
    ctx: PlanContext
): Draft {
    const { image, alt, labels, distractors } = item.content
    if (mastery === 'familiar' || mastery === 'mastered') {
        const target = pick(labels, ctx.rng)
        return {
            kind: 'locateOnImage',
            itemIds: [item.id],
            props: {
                question: target.label,
                label: target.label,
                image,
                alt,
                answer: { x: target.x, y: target.y },
                tolerance: 5,
            },
        }
    }
    return {
        kind: 'labelDiagram',
        itemIds: [item.id],
        props: {
            question: item.front,
            image,
            alt,
            answer: labels,
            distractors: distractors ?? [],
        },
    }
}

/** Chooses the exercise for one item based on its type and mastery stage. */
export function planExercise(
    item: Item,
    mastery: Mastery,
    ctx: PlanContext
): ExerciseDescriptor {
    let draft: Draft
    switch (item.type) {
        case 'basic':
            draft = planBasic(item, mastery, ctx)
            break
        case 'choice':
            draft = {
                kind: 'multipleChoice',
                itemIds: [item.id],
                props: {
                    question: item.front,
                    options: shuffleWith(item.content.options, ctx.rng),
                    answer:
                        item.content.answer.length === 1
                            ? item.content.answer[0]
                            : item.content.answer,
                },
            }
            break
        case 'cloze':
            draft = planCloze(item, mastery, ctx)
            break
        case 'passage':
            draft = planPassage(item, mastery)
            break
        case 'list':
            draft = {
                kind: 'listRecall',
                itemIds: [item.id],
                props: { question: item.front, answer: item.content.items },
            }
            break
        case 'sequence':
            draft = {
                kind: 'orderSequence',
                itemIds: [item.id],
                props: {
                    question: item.front,
                    answer: item.content.items,
                    ends: item.content.ends,
                },
            }
            break
        case 'number':
            draft = planNumber(item, mastery, ctx)
            break
        case 'pairs': {
            const pairs = shuffleWith(item.content.pairs, ctx.rng).slice(
                0,
                MAX_MATCH_PAIRS
            )
            draft = {
                kind: 'matchPairs',
                itemIds: [item.id],
                props: { answer: pairs, question: item.front || undefined },
            }
            break
        }
        case 'diagram':
            draft = planDiagram(item, mastery, ctx)
            break
    }
    return finish(draft, ctx)
}

/** True when a basic item is short enough to be a tile in a match exercise. */
export function isMatchable(item: Item): item is ItemOf<'basic'> {
    return (
        item.type === 'basic' &&
        item.front.length <= MAX_TYPEABLE_LENGTH &&
        item.back.length <= MAX_TYPEABLE_LENGTH
    )
}

/** One match exercise covering several short basic items. */
export function planMatchBatch(
    items: ItemOf<'basic'>[],
    ctx: PlanContext
): ExerciseDescriptor {
    // Duplicate texts would make the pairs ambiguous.
    const seen = new Set<string>()
    const unique = items.filter((i) => {
        const keys = [normalizeAnswer(i.front), normalizeAnswer(i.back)]
        if (keys.some((k) => seen.has(k))) return false
        keys.forEach((k) => seen.add(k))
        return true
    })
    return finish(
        {
            kind: 'matchPairs',
            itemIds: unique.map((i) => i.id),
            props: {
                answer: unique.map((i) => ({ left: i.front, right: i.back })),
            },
        },
        ctx
    )
}
