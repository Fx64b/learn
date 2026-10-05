import type { ItemType } from '@/lib/items'

/** One import/export example per item type, shown in the documentation. */
export const DOCS_EXAMPLES: Record<ItemType, unknown> = {
    basic: {
        front: 'What is the capital of Australia?',
        back: 'Canberra',
        content: { accept: ['Canberra City'] },
    },
    choice: {
        type: 'choice',
        front: 'Which of these are noble gases?',
        content: {
            options: ['Neon', 'Nitrogen', 'Argon'],
            answer: ['Neon', 'Argon'],
        },
    },
    cloze: {
        type: 'cloze',
        content: {
            text: 'Photosynthesis converts ___ energy into ___ energy.',
            answers: ['light', 'chemical'],
            distractors: ['kinetic'],
        },
    },
    passage: {
        type: 'passage',
        front: 'Recite the first law of thermodynamics',
        content: {
            text: 'Energy cannot be created or destroyed, only transformed.',
        },
    },
    list: {
        type: 'list',
        front: 'Name the seven continents',
        content: {
            items: [
                'Africa',
                'Antarctica',
                'Asia',
                ['Australia', 'Oceania'],
                'Europe',
                'North America',
                'South America',
            ],
        },
    },
    sequence: {
        type: 'sequence',
        front: 'Order these events from earliest to latest',
        content: {
            items: [
                { label: 'Magna Carta', detail: '1215' },
                { label: 'Printing press', detail: 'c. 1440' },
                { label: 'Moon landing', detail: '1969' },
            ],
            ends: ['Earliest', 'Latest'],
        },
    },
    number: {
        type: 'number',
        front: 'How tall is Mount Everest?',
        content: { value: 8849, tolerance: 50, unit: 'm' },
    },
    pairs: {
        type: 'pairs',
        front: 'Match the elements and symbols',
        content: {
            pairs: [
                { left: 'Gold', right: 'Au' },
                { left: 'Iron', right: 'Fe' },
            ],
        },
    },
    diagram: {
        type: 'diagram',
        front: 'Name the planets',
        content: {
            image: 'https://example.com/solar-system.png',
            alt: 'The solar system',
            labels: [
                { label: 'Mercury', x: 18.75, y: 68.3 },
                { label: 'Venus', x: 26.5, y: 68.3, tag: 'above' },
            ],
        },
    },
}
