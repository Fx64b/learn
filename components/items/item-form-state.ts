import { BLANK_PATTERN, type ItemInput, type ItemType } from '@/lib/items'

import type { DiagramLabel } from '@/components/learn/label-diagram'

/** Flat editor state for every item type; only the fields of one type are used. */
export interface ItemFormState {
    front: string
    back: string
    /** Comma separated extra accepted answers (basic). */
    accept: string
    options: { text: string; correct: boolean }[]
    /** Cloze text with [brackets] around each blank. */
    cloze: string
    /** Comma separated wrong words (cloze, diagram). */
    distractors: string
    passage: string
    /** One entry per line (list, sequence). */
    lines: string
    endStart: string
    endEnd: string
    value: string
    tolerance: string
    unit: string
    pairs: { left: string; right: string }[]
    image: string
    alt: string
    labels: DiagramLabel[]
}

export const emptyFormState = (): ItemFormState => ({
    front: '',
    back: '',
    accept: '',
    options: [
        { text: '', correct: true },
        { text: '', correct: false },
        { text: '', correct: false },
    ],
    cloze: '',
    distractors: '',
    passage: '',
    lines: '',
    endStart: '',
    endEnd: '',
    value: '',
    tolerance: '',
    unit: '',
    pairs: [
        { left: '', right: '' },
        { left: '', right: '' },
        { left: '', right: '' },
    ],
    image: '',
    alt: '',
    labels: [],
})

const splitList = (value: string) =>
    value
        .split(',')
        .map((v) => v.trim())
        .filter(Boolean)

const splitLines = (value: string) =>
    value
        .split('\n')
        .map((v) => v.trim())
        .filter(Boolean)

const optionalNumber = (value: string) =>
    value.trim() === '' ? undefined : Number(value.replace(',', '.'))

/** "Photosynthesis uses [light]" -> text with ___ and the answers. */
export function parseBrackets(value: string) {
    const answers: string[] = []
    const text = value.replace(/\[([^\]]*)\]/g, (_, word: string) => {
        answers.push(word.trim())
        return '___'
    })
    return { text, answers }
}

export function toBrackets(text: string, answers: string[]) {
    let i = 0
    return text.replace(BLANK_PATTERN, () => `[${answers[i++] ?? ''}]`)
}

/** Builds the raw item input that is validated with itemInputSchema. */
export function formToInput(type: ItemType, f: ItemFormState): unknown {
    const front = f.front.trim()
    switch (type) {
        case 'basic': {
            const accept = splitList(f.accept)
            return {
                type,
                front,
                back: f.back.trim(),
                ...(accept.length ? { content: { accept } } : {}),
            }
        }
        case 'choice': {
            const options = f.options.filter((o) => o.text.trim())
            return {
                type,
                front,
                content: {
                    options: options.map((o) => o.text.trim()),
                    answer: options
                        .filter((o) => o.correct)
                        .map((o) => o.text.trim()),
                },
            }
        }
        case 'cloze': {
            const { text, answers } = parseBrackets(f.cloze.trim())
            const distractors = splitList(f.distractors)
            return {
                type,
                front,
                content: {
                    text,
                    answers,
                    ...(distractors.length ? { distractors } : {}),
                },
            }
        }
        case 'passage':
            return { type, front, content: { text: f.passage.trim() } }
        case 'list':
            return {
                type,
                front,
                content: {
                    items: splitLines(f.lines).map((line) => {
                        const aliases = line
                            .split('/')
                            .map((a) => a.trim())
                            .filter(Boolean)
                        return aliases.length > 1 ? aliases : aliases[0]
                    }),
                },
            }
        case 'sequence': {
            const ends =
                f.endStart.trim() && f.endEnd.trim()
                    ? [f.endStart.trim(), f.endEnd.trim()]
                    : undefined
            return {
                type,
                front,
                content: {
                    items: splitLines(f.lines).map((line) => {
                        const [label, detail] = line
                            .split('|')
                            .map((p) => p.trim())
                        return detail ? { label, detail } : { label }
                    }),
                    ...(ends ? { ends } : {}),
                },
            }
        }
        case 'number':
            return {
                type,
                front,
                content: {
                    value: optionalNumber(f.value),
                    ...(optionalNumber(f.tolerance) !== undefined
                        ? { tolerance: optionalNumber(f.tolerance) }
                        : {}),
                    ...(f.unit.trim() ? { unit: f.unit.trim() } : {}),
                },
            }
        case 'pairs':
            return {
                type,
                front,
                content: {
                    pairs: f.pairs
                        .filter((p) => p.left.trim() || p.right.trim())
                        .map((p) => ({
                            left: p.left.trim(),
                            right: p.right.trim(),
                        })),
                },
            }
        case 'diagram': {
            const distractors = splitList(f.distractors)
            return {
                type,
                front,
                content: {
                    image: f.image,
                    alt: f.alt.trim() || front,
                    labels: f.labels.map((l) => ({
                        ...l,
                        label: l.label.trim(),
                    })),
                    ...(distractors.length ? { distractors } : {}),
                },
            }
        }
    }
}

/** Editor state for an existing item. */
export function inputToForm(input: ItemInput): ItemFormState {
    const f = emptyFormState()
    f.front = input.front ?? ''
    switch (input.type) {
        case 'basic':
            f.back = input.back
            f.accept = input.content?.accept?.join(', ') ?? ''
            break
        case 'choice':
            f.options = input.content.options.map((text) => ({
                text,
                correct: input.content.answer.includes(text),
            }))
            break
        case 'cloze':
            f.cloze = toBrackets(input.content.text, input.content.answers)
            f.distractors = input.content.distractors?.join(', ') ?? ''
            // A cloze item without own prompt shows its text as front.
            if (f.front === input.content.text) f.front = ''
            break
        case 'passage':
            f.passage = input.content.text
            break
        case 'list':
            f.lines = input.content.items
                .map((i) => (Array.isArray(i) ? i.join(' / ') : i))
                .join('\n')
            break
        case 'sequence':
            f.lines = input.content.items
                .map((i) => (i.detail ? `${i.label} | ${i.detail}` : i.label))
                .join('\n')
            f.endStart = input.content.ends?.[0] ?? ''
            f.endEnd = input.content.ends?.[1] ?? ''
            break
        case 'number':
            f.value = String(input.content.value)
            f.tolerance =
                input.content.tolerance !== undefined
                    ? String(input.content.tolerance)
                    : ''
            f.unit = input.content.unit ?? ''
            break
        case 'pairs':
            f.pairs = input.content.pairs.map((p) => ({ ...p }))
            if (f.front === input.content.pairs.map((p) => p.left).join(', '))
                f.front = ''
            break
        case 'diagram':
            f.image = input.content.image
            f.alt = input.content.alt
            f.labels = input.content.labels.map((l) => ({ ...l }))
            f.distractors = input.content.distractors?.join(', ') ?? ''
            break
    }
    return f
}
