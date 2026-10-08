'use client'

import { cn } from '@/lib/utils'
import { MapPin } from 'lucide-react'

import type * as React from 'react'
import { useState } from 'react'

import { useTranslations } from 'next-intl'

import { ExerciseShell } from './exercise-shell'
import type { ExerciseBaseProps } from './types'
import { useExerciseStatus } from './use-exercise-status'

/** Position in percent of the image: x from the left edge, y from the top edge (0-100). */
export interface ImagePoint {
    x: number
    y: number
}

export interface LocateOnImageResponse extends ImagePoint {
    /** Distance from the answer in percent of the image width. */
    distance: number
}

export interface LocateOnImageProps extends ExerciseBaseProps<LocateOnImageResponse> {
    /** e.g. "Where is iron (Fe)?" */
    question: string
    image: string
    alt: string
    answer: ImagePoint
    /** Accepted radius around the answer, in percent of the image width. */
    tolerance?: number
    title?: string
}

/** Tap the right spot on a map, diagram or any image. */
export function LocateOnImage({
    question,
    image,
    alt,
    answer,
    tolerance = 5,
    title,
    status: controlledStatus,
    onResult,
    onContinue,
    className,
}: LocateOnImageProps) {
    const t = useTranslations('exercise')
    const [pin, setPin] = useState<ImagePoint | null>(null)
    // Image height / width, so distances can be measured in width units.
    const [aspect, setAspect] = useState(1)
    const { status, locked, setEvaluated, reset } =
        useExerciseStatus(controlledStatus)

    const distance = pin
        ? Math.hypot(pin.x - answer.x, (pin.y - answer.y) * aspect)
        : null

    function place(e: React.MouseEvent<HTMLDivElement>) {
        if (locked) return
        const rect = e.currentTarget.getBoundingClientRect()
        setPin({
            x: clamp(((e.clientX - rect.left) / rect.width) * 100),
            y: clamp(((e.clientY - rect.top) / rect.height) * 100),
        })
    }

    function check() {
        if (!pin || distance === null) return
        const correct = distance <= tolerance
        setEvaluated(correct ? 'correct' : 'incorrect')
        onResult?.({
            correct,
            response: {
                x: round(pin.x),
                y: round(pin.y),
                distance: round(distance),
            },
        })
    }

    const pinTone =
        status === 'correct'
            ? 'text-emerald-500'
            : status === 'incorrect'
              ? 'text-rose-500'
              : 'text-sky-500'

    return (
        <ExerciseShell
            title={title ?? t('titles.locate')}
            prompt={
                <span className="text-foreground text-2xl font-semibold">
                    {question}
                </span>
            }
            status={status}
            solutionLabel={t('correctSpot')}
            solution={
                distance !== null
                    ? t('spotDistance', { distance: round(distance) })
                    : t('spotShown')
            }
            canCheck={pin !== null}
            onCheck={check}
            onContinue={onContinue}
            onRetry={() => {
                setPin(null)
                reset()
            }}
            className={className}
        >
            <div
                onClick={place}
                className={cn(
                    'relative overflow-hidden rounded-xl border-2 select-none',
                    !locked && 'cursor-crosshair'
                )}
            >
                {/* eslint-disable-next-line @next/next/no-img-element -- user images of unknown size; markers are positioned in % of the rendered image */}
                <img
                    src={image}
                    alt={alt}
                    draggable={false}
                    onLoad={(e) => {
                        const img = e.currentTarget
                        if (img.naturalWidth)
                            setAspect(img.naturalHeight / img.naturalWidth)
                    }}
                    className="block w-full"
                />

                {locked && (
                    <>
                        {pin && (
                            <svg
                                viewBox="0 0 100 100"
                                preserveAspectRatio="none"
                                className="pointer-events-none absolute inset-0 size-full"
                            >
                                <line
                                    x1={pin.x}
                                    y1={pin.y}
                                    x2={answer.x}
                                    y2={answer.y}
                                    vectorEffect="non-scaling-stroke"
                                    strokeDasharray="4 4"
                                    className="stroke-foreground/60"
                                    strokeWidth={2}
                                />
                            </svg>
                        )}
                        {/* Accepted area */}
                        <div
                            className="pointer-events-none absolute aspect-square -translate-x-1/2 -translate-y-1/2 rounded-full border-2 border-emerald-500 bg-emerald-500/20"
                            style={{
                                left: `${answer.x}%`,
                                top: `${answer.y}%`,
                                width: `${Math.max(tolerance * 2, 3)}%`,
                            }}
                        />
                        <div
                            className="pointer-events-none absolute size-3 -translate-x-1/2 -translate-y-1/2 rounded-full bg-emerald-500 ring-2 ring-white"
                            style={{
                                left: `${answer.x}%`,
                                top: `${answer.y}%`,
                            }}
                        />
                    </>
                )}

                {pin && (
                    <MapPin
                        aria-label={t('yourAnswer')}
                        className={cn(
                            'pointer-events-none absolute size-8 -translate-x-1/2 -translate-y-full fill-current stroke-white drop-shadow-md transition-[left,top] duration-150',
                            pinTone
                        )}
                        style={{ left: `${pin.x}%`, top: `${pin.y}%` }}
                    />
                )}
            </div>
            {!locked && (
                <p className="text-muted-foreground text-center text-sm">
                    {pin ? t('movePin') : t('dropPin')}
                </p>
            )}
        </ExerciseShell>
    )
}

const clamp = (n: number) => Math.min(100, Math.max(0, n))
const round = (n: number) => Math.round(n * 10) / 10
