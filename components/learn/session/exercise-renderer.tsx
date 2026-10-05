'use client'

import type { ExerciseDescriptor, ExerciseOutcome } from '@/lib/learn'

import {
    BuildSentence,
    FillBlank,
    FirstLetterRecall,
    Flashcard,
    LabelDiagram,
    ListRecall,
    LocateOnImage,
    MatchPairs,
    MultipleChoice,
    NumberAnswer,
    OrderSequence,
    TypeAnswer,
} from '@/components/learn'

interface ExerciseRendererProps {
    exercise: ExerciseDescriptor
    onResult: (outcome: ExerciseOutcome) => void
    onContinue: () => void
}

/** Renders the exercise component for a planned exercise. */
export function ExerciseRenderer({
    exercise,
    onResult,
    onContinue,
}: ExerciseRendererProps) {
    const common = { onResult, onContinue }
    switch (exercise.kind) {
        case 'flashcard':
            return <Flashcard {...exercise.props} {...common} />
        case 'multipleChoice':
            return <MultipleChoice {...exercise.props} {...common} />
        case 'typeAnswer':
            return <TypeAnswer {...exercise.props} {...common} />
        case 'matchPairs':
            return <MatchPairs {...exercise.props} {...common} />
        case 'fillBlank':
            return <FillBlank {...exercise.props} {...common} />
        case 'buildSentence':
            return <BuildSentence {...exercise.props} {...common} />
        case 'firstLetter':
            return <FirstLetterRecall {...exercise.props} {...common} />
        case 'listRecall':
            return <ListRecall {...exercise.props} {...common} />
        case 'orderSequence':
            return <OrderSequence {...exercise.props} {...common} />
        case 'numberAnswer':
            return <NumberAnswer {...exercise.props} {...common} />
        case 'labelDiagram':
            return <LabelDiagram {...exercise.props} {...common} />
        case 'locateOnImage': {
            const { question, image, alt, answer, tolerance } = exercise.props
            return (
                <LocateOnImage
                    question={question}
                    image={image}
                    alt={alt}
                    answer={answer}
                    tolerance={tolerance}
                    {...common}
                />
            )
        }
    }
}

/** Short text describing what an exercise asked, for summaries. */
export function exerciseLabel(exercise: ExerciseDescriptor): string {
    switch (exercise.kind) {
        case 'matchPairs':
            return exercise.props.answer
                .map((p) => `${p.left} – ${p.right}`)
                .join(', ')
        case 'locateOnImage':
            return exercise.props.label
        default:
            return exercise.props.question
    }
}
