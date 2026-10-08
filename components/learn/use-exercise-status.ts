'use client'

import { useState } from 'react'

import type { ExerciseStatus } from './types'

/** Merges an optional controlled `status` with the component's own evaluation. */
export function useExerciseStatus(controlled?: ExerciseStatus) {
    const [evaluated, setEvaluated] = useState<ExerciseStatus>('idle')
    const status = controlled ?? evaluated

    return {
        status,
        locked: status !== 'idle',
        setEvaluated,
        reset: () => setEvaluated('idle'),
    }
}
