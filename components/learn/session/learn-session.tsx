'use client'

import {
    type ExerciseDescriptor,
    type ExerciseOutcome,
    exerciseXp,
    gradeOutcome,
    requeue,
} from '@/lib/learn'
import { playSound } from '@/lib/learn/sound'
import { useUserPreferences } from '@/store/userPreferences'
import { nanoid } from 'nanoid'
import { toast } from 'sonner'

import { useCallback, useEffect, useRef, useState } from 'react'

import { useTranslations } from 'next-intl'
import { useRouter } from 'next/navigation'

import {
    type RewardData,
    completeSession,
    completeTest,
    loadLearnSession,
    loadTest,
    submitExerciseResult,
} from '@/app/actions/learn'

import { ExerciseRenderer, exerciseLabel } from './exercise-renderer'
import { SessionSummary, type SummaryData } from './session-summary'
import { SessionTopBar } from './session-top-bar'
import { useResultQueue } from './use-result-queue'

export type SessionMode = 'learn' | 'test'

interface LearnSessionProps {
    mode: SessionMode
    /** Deck id, or "due" / "all" / "difficult" in learn mode. */
    scope: string
    initialExercises: ExerciseDescriptor[]
    /** Where the close and done buttons lead. */
    backHref: string
}

const timezone = () => {
    try {
        return Intl.DateTimeFormat().resolvedOptions().timeZone
    } catch {
        return undefined
    }
}

const retryKey = (e: ExerciseDescriptor) => e.itemIds.join(',')

export function LearnSession({
    mode,
    scope,
    initialExercises,
    backHref,
}: LearnSessionProps) {
    const t = useTranslations('session')
    const router = useRouter()
    const soundEnabled = useUserPreferences((s) => s.soundEnabled)

    const [run, setRun] = useState(0)
    const [queue, setQueue] = useState(initialExercises)
    const [index, setIndex] = useState(0)
    const [combo, setCombo] = useState(0)
    const [xp, setXp] = useState(0)
    const [summary, setSummary] = useState<SummaryData | null>(null)

    const sessionId = useRef(nanoid())
    const startedAt = useRef(Date.now())
    const exerciseStart = useRef(Date.now())
    const outcome = useRef<ExerciseOutcome | null>(null)
    const stats = useRef({
        answered: 0,
        firstTry: 0,
        firstTryCorrect: 0,
        mistakes: 0,
        bestCombo: 0,
        streakExtended: false,
        streak: 0,
        retries: new Map<string, number>(),
        missed: new Map<string, string>(),
    })
    const container = useRef<HTMLDivElement>(null)

    const onError = useCallback(
        (error: string) => toast.error(error || t('errors.save')),
        [t]
    )
    const { enqueue, flush } = useResultQueue(onError)

    const sound = useCallback(
        (name: Parameters<typeof playSound>[0]) => {
            if (soundEnabled) playSound(name)
        },
        [soundEnabled]
    )

    const reset = useCallback((exercises: ExerciseDescriptor[]) => {
        sessionId.current = nanoid()
        startedAt.current = Date.now()
        exerciseStart.current = Date.now()
        outcome.current = null
        stats.current = {
            answered: 0,
            firstTry: 0,
            firstTryCorrect: 0,
            mistakes: 0,
            bestCombo: 0,
            streakExtended: false,
            streak: 0,
            retries: new Map(),
            missed: new Map(),
        }
        setQueue(exercises)
        setIndex(0)
        setCombo(0)
        setXp(0)
        setSummary(null)
        setRun((r) => r + 1)
    }, [])

    const handleResult = useCallback(
        (result: ExerciseOutcome) => {
            outcome.current = result
            sound(result.correct ? 'correct' : 'incorrect')
        },
        [sound]
    )

    async function finish(finalXp: number) {
        const s = stats.current
        const base: SummaryData = {
            mode,
            xp: finalXp,
            exercises: s.firstTry,
            correct: s.firstTryCorrect,
            durationMs: Date.now() - startedAt.current,
            bestCombo: s.bestCombo,
            missed: [...s.missed.values()],
            streakExtended: s.streakExtended,
            reward: null,
            loading: true,
        }
        setSummary(base)
        sound('complete')

        let reward: (RewardData & { newBest?: boolean; score?: number }) | null
        if (mode === 'learn') {
            await flush()
            reward = await enqueue(() =>
                completeSession({
                    sessionId: sessionId.current,
                    scope,
                    startedAt: startedAt.current,
                    exercises: s.firstTry,
                    mistakes: s.mistakes,
                    completed: true,
                    timezone: timezone(),
                })
            )
        } else {
            reward = await enqueue(() =>
                completeTest({
                    deckId: scope,
                    total: Math.max(1, s.firstTry),
                    correct: s.firstTryCorrect,
                    timezone: timezone(),
                })
            )
        }
        setSummary({
            ...base,
            xp: finalXp + (reward?.bonusXp ?? 0),
            reward,
            streak: reward?.streak ?? s.streak,
            loading: false,
        })
    }

    function handleContinue() {
        const exercise = queue[index]
        const result = outcome.current ?? { correct: false, response: null }
        outcome.current = null
        const durationMs = Date.now() - exerciseStart.current
        exerciseStart.current = Date.now()
        const s = stats.current

        const nextCombo = result.correct ? combo + 1 : 0
        s.bestCombo = Math.max(s.bestCombo, nextCombo)
        if (result.correct && nextCombo > 0 && nextCombo % 5 === 0) {
            sound('combo')
        }

        if (!exercise.retry) {
            s.firstTry++
            if (result.correct) s.firstTryCorrect++
            else s.mistakes++
        }
        if (!result.correct) {
            s.missed.set(retryKey(exercise), exerciseLabel(exercise))
        }

        let gained = 0
        let nextQueue = queue
        if (mode === 'learn') {
            gained = exerciseXp({
                kind: exercise.kind,
                correct: result.correct,
                retry: exercise.retry,
                combo: nextCombo,
                items: exercise.itemIds.length,
            })
            const grades = gradeOutcome(exercise, result)
            void enqueue(() =>
                submitExerciseResult({
                    kind: exercise.kind,
                    itemIds: exercise.itemIds,
                    practice: exercise.practice,
                    retry: exercise.retry,
                    correct: result.correct,
                    grades,
                    combo: nextCombo,
                    durationMs,
                    timezone: timezone(),
                })
            ).then((res) => {
                if (!res) return
                if (res.streakExtended) s.streakExtended = true
                s.streak = res.streak
                if (res.goalReachedNow) toast.success(t('goalReached'))
            })

            if (!result.correct) {
                const key = retryKey(exercise)
                const retries = s.retries.get(key) ?? 0
                nextQueue = requeue(queue, index, exercise, retries)
                s.retries.set(key, retries + 1)
            }
        }

        const nextXp = xp + gained
        setCombo(nextCombo)
        setXp(nextXp)
        setQueue(nextQueue)
        if (index + 1 >= nextQueue.length) {
            void finish(nextXp)
        } else {
            setIndex(index + 1)
        }
    }

    async function handleClose() {
        if (mode === 'learn' && stats.current.firstTry > 0) {
            void flush().then(() =>
                completeSession({
                    sessionId: sessionId.current,
                    scope,
                    startedAt: startedAt.current,
                    exercises: stats.current.firstTry,
                    mistakes: stats.current.mistakes,
                    completed: false,
                    timezone: timezone(),
                })
            )
        }
        router.push(backHref)
    }

    async function handleRestart() {
        const res =
            mode === 'learn'
                ? await loadLearnSession(scope)
                : await loadTest(scope)
        if (!res.success) {
            toast.error(res.error)
            return
        }
        if (!res.exercises.length) {
            setSummary((prev) => (prev ? { ...prev, allDone: true } : prev))
            return
        }
        reset(res.exercises)
    }

    // Keyboard: 1-9 pick options, Enter checks or continues.
    useEffect(() => {
        function onKeyDown(e: KeyboardEvent) {
            if (e.metaKey || e.ctrlKey || e.altKey) return
            const target = e.target as HTMLElement | null
            if (target?.closest('input, textarea, [contenteditable]')) return
            const root = container.current
            if (!root) return
            if (/^[1-9]$/.test(e.key)) {
                const options = root.querySelectorAll<HTMLButtonElement>(
                    '[role=radio]:not(:disabled), [role=checkbox]:not(:disabled)'
                )
                options[Number(e.key) - 1]?.click()
                return
            }
            if (e.key === 'Enter' && target?.tagName !== 'BUTTON') {
                const button =
                    root.querySelector<HTMLButtonElement>(
                        '[data-action=continue]'
                    ) ??
                    root.querySelector<HTMLButtonElement>(
                        '[data-action=check]:not(:disabled)'
                    )
                if (button) {
                    e.preventDefault()
                    button.click()
                }
            }
        }
        window.addEventListener('keydown', onKeyDown)
        return () => window.removeEventListener('keydown', onKeyDown)
    }, [])

    if (summary) {
        return (
            <SessionSummary
                data={summary}
                backHref={backHref}
                onRestart={handleRestart}
            />
        )
    }

    const exercise = queue[index]
    if (!exercise) return null

    return (
        <div ref={container} className="flex flex-col gap-6">
            <SessionTopBar
                progress={index / queue.length}
                combo={combo}
                xp={xp}
                onClose={handleClose}
            />
            {exercise.retry && (
                <p className="-mb-3 text-sm font-semibold text-amber-600 dark:text-amber-400">
                    {t('retryHint')}
                </p>
            )}
            <ExerciseRenderer
                key={`${run}-${exercise.id}`}
                exercise={exercise}
                onResult={handleResult}
                onContinue={handleContinue}
            />
        </div>
    )
}
