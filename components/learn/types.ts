export type ExerciseStatus = 'idle' | 'correct' | 'incorrect'

export interface ExerciseResult<T> {
    correct: boolean
    response: T
}

export interface ExerciseBaseProps<T> {
    /**
     * Forces the feedback that is displayed. Leave undefined to let the
     * component show its own evaluation after the user checks their answer.
     */
    status?: ExerciseStatus
    /** Called once the user has answered, with the evaluated result. */
    onResult?: (result: ExerciseResult<T>) => void
    /** Shown as a "Continue" button once feedback is visible. Without it a "Try again" button resets the exercise. */
    onContinue?: () => void
    className?: string
}
