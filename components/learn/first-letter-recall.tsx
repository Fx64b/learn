'use client'

import { cn } from '@/lib/utils'

import { useRef, useState } from 'react'

import { useTranslations } from 'next-intl'

import { Progress } from '@/components/ui/progress'

import { ActionButton, ExerciseShell } from './exercise-shell'
import type { ExerciseBaseProps } from './types'
import { useExerciseStatus } from './use-exercise-status'
import { initialOf } from './utils'

export interface FirstLetterRecallResponse {
    mistakes: number
    missedWords: string[]
}

export interface FirstLetterRecallProps
    extends ExerciseBaseProps<FirstLetterRecallResponse> {
    /** The passage to recite word for word. */
    answer: string
    /** What to recite, e.g. "Recite the first sentence of the Gettysburg Address". */
    question?: string
    title?: string
    /**
     * How much of the upcoming text is visible:
     * "full" = faded text (reading practice), "partial" = word-length gaps, "none" = nothing.
     */
    hint?: 'full' | 'partial' | 'none'
    /** Wrong letters tolerated while still counting as correct. */
    allowedMistakes?: number
}

type WordResult = 'ok' | 'miss'

/**
 * Recite a passage by typing only the first letter of each word. A wrong letter
 * reveals the word in red and moves on, so the whole text is always completed.
 */
export function FirstLetterRecall({
    answer,
    question,
    title,
    hint = 'partial',
    allowedMistakes = 0,
    status: controlledStatus,
    onResult,
    onContinue,
    className,
}: FirstLetterRecallProps) {
    const t = useTranslations('exercise')
    const words = answer.split(/\s+/).filter(Boolean)
    const [results, setResults] = useState<WordResult[]>(() =>
        skipPunctuation([], words)
    )
    const { status, locked, setEvaluated, reset } =
        useExerciseStatus(controlledStatus)
    const inputRef = useRef<HTMLInputElement>(null)
    const done = results.length === words.length

    function submit(result: WordResult) {
        if (locked || done) return
        const next = skipPunctuation([...results, result], words)
        setResults(next)
        if (next.length === words.length) {
            const missedWords = words.filter((_, i) => next[i] === 'miss')
            const correct = missedWords.length <= allowedMistakes
            setEvaluated(correct ? 'correct' : 'incorrect')
            onResult?.({
                correct,
                response: { mistakes: missedWords.length, missedWords },
            })
        }
    }

    function handleInput(char: string) {
        const expected = initialOf(words[results.length])
        const typed = initialOf(char)
        if (!typed) return
        submit(typed === expected ? 'ok' : 'miss')
    }

    const mistakes = results.filter((r) => r === 'miss').length

    return (
        <ExerciseShell
            title={title ?? t('titles.firstLetter')}
            prompt={question}
            status={status}
            solutionLabel={t('missedWords')}
            solution={t('mistakesOf', {
                count: mistakes,
                max: allowedMistakes,
            })}
            onContinue={onContinue}
            onRetry={() => {
                setResults(skipPunctuation([], words))
                reset()
                inputRef.current?.focus()
            }}
            idleFooter={
                <div className="flex w-full items-center gap-4">
                    <Progress
                        value={(results.length / words.length) * 100}
                        className="h-3"
                    />
                    <span className="text-muted-foreground shrink-0 text-sm tabular-nums">
                        {results.length} / {words.length}
                    </span>
                    <ActionButton
                        tone="neutral"
                        onClick={() => {
                            submit('miss')
                            inputRef.current?.focus()
                        }}
                        className="px-4 sm:min-w-0"
                    >
                        {t('reveal')}
                    </ActionButton>
                </div>
            }
            className={className}
        >
            <div
                onClick={() => inputRef.current?.focus()}
                className="bg-muted/30 cursor-text rounded-xl border-2 border-dashed p-4 text-xl leading-relaxed has-[input:focus]:border-sky-400"
            >
                {words.map((word, i) => {
                    if (i < results.length) {
                        return (
                            <span
                                key={i}
                                className={cn(
                                    'mr-[0.3em] inline-block',
                                    results[i] === 'miss' &&
                                        'animate-shake text-rose-600 underline decoration-wavy decoration-2 dark:text-rose-400'
                                )}
                            >
                                {word}
                            </span>
                        )
                    }
                    if (locked) {
                        return (
                            <span
                                key={i}
                                className="text-muted-foreground mr-[0.3em] inline-block"
                            >
                                {word}
                            </span>
                        )
                    }
                    return (
                        <span key={i} className="mr-[0.3em] inline-block">
                            {i === results.length && (
                                <span className="mr-0.5 inline-block h-[1.1em] w-0.5 animate-pulse bg-sky-500 align-[-0.15em]" />
                            )}
                            {hint === 'full' && (
                                <span className="text-muted-foreground/40">
                                    {word}
                                </span>
                            )}
                            {hint === 'partial' && (
                                <span
                                    className="bg-muted-foreground/20 inline-block h-[0.35em] rounded-full align-middle"
                                    style={{
                                        width: `${Math.max(word.length * 0.5, 0.8)}em`,
                                    }}
                                />
                            )}
                        </span>
                    )
                })}
                <input
                    ref={inputRef}
                    value=""
                    onChange={(e) => handleInput(e.target.value.slice(-1))}
                    readOnly={locked || done}
                    aria-label={t('firstLetterInput')}
                    autoComplete="off"
                    autoCapitalize="off"
                    autoCorrect="off"
                    spellCheck={false}
                    className="sr-only"
                />
            </div>
            {!locked && (
                <p className="text-muted-foreground text-center text-sm">
                    {t('firstLetterHelp')}
                </p>
            )}
        </ExerciseShell>
    )
}

/** Auto-completes words without letters or digits (dashes, lone symbols). */
function skipPunctuation(results: WordResult[], words: string[]) {
    const out = [...results]
    while (out.length < words.length && initialOf(words[out.length]) === null)
        out.push('ok')
    return out
}
