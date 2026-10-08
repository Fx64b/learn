import type { ExerciseDescriptor } from '@/lib/learn'

type Locale = 'en' | 'de'

function ex<D extends ExerciseDescriptor>(
    id: string,
    kind: D['kind'],
    props: D['props']
): ExerciseDescriptor {
    return {
        id,
        kind,
        itemIds: [id],
        practice: true,
        retry: false,
        props,
    } as ExerciseDescriptor
}

const PLANETS = [
    { x: 18.75, de: 'Merkur', en: 'Mercury' },
    { x: 26.5, de: 'Venus', en: 'Venus', tag: 'above' as const },
    { x: 34.75, de: 'Erde', en: 'Earth' },
    { x: 42.5, de: 'Mars', en: 'Mars', tag: 'above' as const },
    { x: 55, de: 'Jupiter', en: 'Jupiter' },
    { x: 71.25, de: 'Saturn', en: 'Saturn', tag: 'above' as const },
    { x: 85, de: 'Uranus', en: 'Uranus' },
    { x: 95, de: 'Neptun', en: 'Neptune', tag: 'above' as const },
]

/** Short lesson for the hero: three quick exercises. */
export function heroExercises(locale: Locale): ExerciseDescriptor[] {
    const de = locale === 'de'
    return [
        ex('hero-mc', 'multipleChoice', {
            question: de
                ? 'Welcher Planet hat die meisten bekannten Monde?'
                : 'Which planet has the most known moons?',
            options: de
                ? ['Erde', 'Mars', 'Saturn', 'Venus']
                : ['Earth', 'Mars', 'Saturn', 'Venus'],
            answer: 'Saturn',
        }),
        ex('hero-match', 'matchPairs', {
            answer: de
                ? [
                      { left: 'Gold', right: 'Au' },
                      { left: 'Eisen', right: 'Fe' },
                      { left: 'Silber', right: 'Ag' },
                      { left: 'Natrium', right: 'Na' },
                  ]
                : [
                      { left: 'Gold', right: 'Au' },
                      { left: 'Iron', right: 'Fe' },
                      { left: 'Silver', right: 'Ag' },
                      { left: 'Sodium', right: 'Na' },
                  ],
        }),
        ex('hero-type', 'typeAnswer', {
            question: de
                ? 'Was ist die Hauptstadt von Australien?'
                : 'What is the capital of Australia?',
            answer: ['Canberra'],
            allowOverride: false,
        }),
    ]
}

export interface ShowcaseEntry {
    key: string
    exercise: ExerciseDescriptor
}

/** One example per exercise kind for the interactive showcase. */
export function showcaseExercises(locale: Locale): ShowcaseEntry[] {
    const de = locale === 'de'
    return [
        {
            key: 'multipleChoice',
            exercise: ex('s-mc', 'multipleChoice', {
                question: de
                    ? 'Welche davon sind Edelgase?'
                    : 'Which of these are noble gases?',
                options: de
                    ? ['Neon', 'Stickstoff', 'Argon', 'Sauerstoff']
                    : ['Neon', 'Nitrogen', 'Argon', 'Oxygen'],
                answer: ['Neon', 'Argon'],
            }),
        },
        {
            key: 'typeAnswer',
            exercise: ex('s-type', 'typeAnswer', {
                question: de
                    ? 'Chemisches Symbol für Gold?'
                    : 'Chemical symbol for gold?',
                answer: ['Au'],
                allowOverride: true,
            }),
        },
        {
            key: 'matchPairs',
            exercise: ex('s-match', 'matchPairs', {
                answer: de
                    ? [
                          { left: 'Kanada', right: 'Ottawa' },
                          { left: 'Japan', right: 'Tokio' },
                          { left: 'Kenia', right: 'Nairobi' },
                          { left: 'Peru', right: 'Lima' },
                      ]
                    : [
                          { left: 'Canada', right: 'Ottawa' },
                          { left: 'Japan', right: 'Tokyo' },
                          { left: 'Kenya', right: 'Nairobi' },
                          { left: 'Peru', right: 'Lima' },
                      ],
            }),
        },
        {
            key: 'fillBlank',
            exercise: ex('s-fill', 'fillBlank', {
                question: de
                    ? 'Die Fotosynthese wandelt ___ in ___ Energie um.'
                    : 'Photosynthesis converts ___ energy into ___ energy.',
                answer: de ? ['Licht', 'chemische'] : ['light', 'chemical'],
                distractors: de
                    ? ['kinetische', 'Wärme']
                    : ['kinetic', 'thermal'],
            }),
        },
        {
            key: 'orderSequence',
            exercise: ex('s-order', 'orderSequence', {
                question: de
                    ? 'Ordne vom frühesten zum spätesten Ereignis.'
                    : 'Order these events from earliest to latest.',
                answer: de
                    ? [
                          { label: 'Magna Carta', detail: '1215' },
                          { label: 'Buchdruck', detail: 'ca. 1440' },
                          { label: 'Französische Revolution', detail: '1789' },
                          { label: 'Mondlandung', detail: '1969' },
                      ]
                    : [
                          { label: 'Magna Carta is sealed', detail: '1215' },
                          { label: 'Printing press', detail: 'c. 1440' },
                          { label: 'French Revolution', detail: '1789' },
                          { label: 'First Moon landing', detail: '1969' },
                      ],
                ends: de ? ['Früheste', 'Späteste'] : ['Earliest', 'Latest'],
            }),
        },
        {
            key: 'listRecall',
            exercise: ex('s-list', 'listRecall', {
                question: de
                    ? 'Nenne die sieben Kontinente.'
                    : 'Name the seven continents.',
                answer: de
                    ? [
                          'Afrika',
                          'Antarktika',
                          'Asien',
                          ['Australien', 'Ozeanien'],
                          'Europa',
                          'Nordamerika',
                          'Südamerika',
                      ]
                    : [
                          'Africa',
                          'Antarctica',
                          'Asia',
                          ['Australia', 'Oceania'],
                          'Europe',
                          'North America',
                          'South America',
                      ],
            }),
        },
        {
            key: 'numberAnswer',
            exercise: ex('s-number', 'numberAnswer', {
                question: de
                    ? 'Wie hoch ist der Mount Everest?'
                    : 'How tall is Mount Everest?',
                answer: 8849,
                tolerance: 50,
                unit: 'm',
                attempts: 3,
            }),
        },
        {
            key: 'labelDiagram',
            exercise: ex('s-diagram', 'labelDiagram', {
                question: de
                    ? 'Benenne die Planeten von der Sonne aus.'
                    : 'Name the planets in order from the Sun.',
                image: '/landing/solar-system.svg',
                alt: de
                    ? 'Die acht Planeten des Sonnensystems'
                    : 'The eight planets of the solar system',
                answer: PLANETS.map((p) => ({
                    label: de ? p.de : p.en,
                    x: p.x,
                    y: 68.33,
                    tag: p.tag,
                })),
                distractors: ['Pluto'],
            }),
        },
        {
            key: 'locateOnImage',
            exercise: ex('s-locate', 'locateOnImage', {
                question: de ? 'Wo ist Eisen (Fe)?' : 'Where is iron (Fe)?',
                image: '/landing/periodic-table.svg',
                alt: de ? 'Leeres Periodensystem' : 'Blank periodic table',
                answer: { x: 43.41, y: 40.27 },
                tolerance: 2.6,
                label: 'Fe',
            }),
        },
        {
            key: 'firstLetter',
            exercise: ex('s-first', 'firstLetter', {
                question: de
                    ? 'Zitiere den ersten Hauptsatz der Thermodynamik.'
                    : 'Recite the first law of thermodynamics.',
                answer: de
                    ? 'Energie kann weder erzeugt noch vernichtet, sondern nur umgewandelt werden.'
                    : 'Energy cannot be created or destroyed, only transformed.',
                hint: 'full',
                allowedMistakes: 1,
            }),
        },
        {
            key: 'buildSentence',
            exercise: ex('s-build', 'buildSentence', {
                question: de
                    ? 'Erstes Newtonsches Gesetz'
                    : "Newton's first law",
                answer: de
                    ? 'Ein Körper bleibt in Ruhe oder gleichförmiger Bewegung'
                    : 'An object stays at rest or in uniform motion',
                distractors: de ? ['immer', 'schnell'] : ['always', 'fast'],
            }),
        },
        {
            key: 'flashcard',
            exercise: ex('s-flash', 'flashcard', {
                question: de
                    ? 'Was ist Spaced Repetition?'
                    : 'What is spaced repetition?',
                answer: de
                    ? 'Wiederholen in wachsenden Abständen, kurz bevor man vergisst.'
                    : 'Reviewing at growing intervals, just before you would forget.',
            }),
        },
    ]
}
