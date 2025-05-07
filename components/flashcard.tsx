'use client'

import { cn } from '@/lib/utils'
import { useUserPreferences } from '@/store/userPreferences'
import { AnimatePresence, motion } from 'framer-motion'

import { useCallback, useEffect, useState } from 'react'

import { Card, CardContent } from '@/components/ui/card'

interface FlashcardProps {
    vorderseite: string
    rückseite: string
    onRating?: (rating: number) => void
    className?: string
}

export function Flashcard({
    vorderseite,
    rückseite,
    onRating,
    className,
}: FlashcardProps) {
    const [isFlipped, setIsFlipped] = useState(false)
    const [isFlipping, setIsFlipping] = useState(false)

    const { animationsEnabled, animationSpeed, animationDirection } =
        useUserPreferences()

    const flipCard = useCallback(() => {
        if (!isFlipping) {
            setIsFlipping(true)
            setIsFlipped(!isFlipped)
            setTimeout(
                () => setIsFlipping(false),
                animationsEnabled ? animationSpeed : 0
            )
        }
    }, [isFlipping, isFlipped, animationSpeed, animationsEnabled])

    // Enhanced keyboard handler
    useEffect(() => {
        const handleKeyDown = (e: KeyboardEvent) => {
            if (e.key === ' ' || e.code === 'Space') {
                e.preventDefault()
                flipCard()
            } else if (isFlipped && e.key >= '1' && e.key <= '4') {
                if (onRating) {
                    onRating(parseInt(e.key))
                }
            } else if (e.key === 'ArrowLeft' && isFlipped && onRating) {
                onRating(1) // Again
            } else if (e.key === 'ArrowDown' && isFlipped && onRating) {
                onRating(2) // Hard
            } else if (e.key === 'ArrowUp' && isFlipped && onRating) {
                onRating(3) // Good
            } else if (e.key === 'ArrowRight' && isFlipped && onRating) {
                onRating(4) // Easy
            }
        }

        window.addEventListener('keydown', handleKeyDown)
        return () => window.removeEventListener('keydown', handleKeyDown)
    }, [isFlipped, onRating, flipCard])

    const getAnimationVariants = () => {
        // If animations are disabled, return empty variants
        if (!animationsEnabled) {
            return {
                initial: {},
                animate: {},
                exit: {},
            }
        }

        if (animationDirection === 'vertical') {
            return {
                initial: { opacity: 0, y: -50 },
                animate: { opacity: 1, y: 0 },
                exit: { opacity: 0, y: 50 },
            }
        } else {
            return {
                initial: { opacity: 0, x: -50 },
                animate: { opacity: 1, x: 0 },
                exit: { opacity: 0, x: 50 },
            }
        }
    }

    const variants = getAnimationVariants()

    return (
        <div
            className={cn(
                'relative h-80 w-full cursor-pointer touch-manipulation sm:h-96 md:h-[26rem]',
                className
            )}
            onClick={flipCard}
            role="button"
            tabIndex={0}
            aria-label={
                isFlipped ? 'Vorderseite anzeigen' : 'Rückseite anzeigen'
            }
            aria-pressed={isFlipped}
        >
            <AnimatePresence
                mode={animationsEnabled ? 'wait' : 'sync'}
                initial={false}
            >
                {!isFlipped ? (
                    <motion.div
                        key="front"
                        initial={variants.initial}
                        animate={variants.animate}
                        exit={variants.exit}
                        transition={{
                            duration: animationsEnabled
                                ? animationSpeed / 1000
                                : 0,
                        }}
                        className="absolute inset-0"
                    >
                        <Card className="h-full w-full shadow-md transition-shadow hover:shadow-lg">
                            <CardContent className="flex h-full items-center justify-center p-4 sm:p-6">
                                <div className="text-center">
                                    <p className="text-base leading-relaxed break-words sm:text-lg md:text-xl lg:text-2xl">
                                        {vorderseite}
                                    </p>
                                    <p className="text-muted-foreground mt-4 text-xs">
                                        Tippen zum Umdrehen{' '}
                                        <kbd className="hidden md:inline">
                                            (Leertaste)
                                        </kbd>
                                    </p>
                                </div>
                            </CardContent>
                        </Card>
                    </motion.div>
                ) : (
                    <motion.div
                        key="back"
                        initial={variants.initial}
                        animate={variants.animate}
                        exit={variants.exit}
                        transition={{
                            duration: animationsEnabled
                                ? animationSpeed / 1000
                                : 0,
                        }}
                        className="absolute inset-0 h-fit min-h-full"
                    >
                        <Card className="border-primary/30 h-full w-full border-2 shadow-md">
                            <CardContent className="h-full overflow-hidden">
                                <div className="flex h-full flex-col">
                                    <div className="flex min-h-0 flex-1 items-center justify-center py-4 text-center">
                                        <div>
                                            <p className="text-muted-foreground mb-2 text-xs">
                                                Antwort
                                            </p>
                                            <p className="text-base leading-relaxed font-medium break-words sm:text-lg md:text-xl lg:text-2xl">
                                                {rückseite}
                                            </p>
                                        </div>
                                    </div>

                                    {/* Rating section - fixed at bottom */}
                                    {onRating && (
                                        <div className="border-border w-full border-t pt-2 pb-2">
                                            <p className="text-muted-foreground mb-2 text-xs">
                                                Bewertung:
                                            </p>
                                            <div className="z-99 grid grid-cols-4 gap-1 sm:gap-2">
                                                <button
                                                    onClick={(e) => {
                                                        e.stopPropagation()
                                                        onRating(1)
                                                    }}
                                                    className="flex min-h-[44px] items-center justify-center rounded bg-red-500 px-2 py-2 text-xs text-white hover:bg-red-600 sm:text-sm dark:text-black"
                                                >
                                                    <span className="hidden md:inline">
                                                        Wieder (1)
                                                    </span>
                                                    <span className="md:hidden">
                                                        Wieder
                                                    </span>
                                                </button>
                                                <button
                                                    onClick={(e) => {
                                                        e.stopPropagation()
                                                        onRating(2)
                                                    }}
                                                    className="flex min-h-[44px] items-center justify-center rounded bg-yellow-500 px-2 py-2 text-xs text-white hover:bg-yellow-600 sm:text-sm dark:text-black"
                                                >
                                                    <span className="hidden md:inline">
                                                        Schwer (2)
                                                    </span>
                                                    <span className="md:hidden">
                                                        Schwer
                                                    </span>
                                                </button>
                                                <button
                                                    onClick={(e) => {
                                                        e.stopPropagation()
                                                        onRating(3)
                                                    }}
                                                    className="flex min-h-[44px] items-center justify-center rounded bg-blue-500 px-2 py-2 text-xs text-white hover:bg-blue-600 sm:text-sm"
                                                >
                                                    <span className="hidden md:inline">
                                                        Gut (3)
                                                    </span>
                                                    <span className="md:hidden">
                                                        Gut
                                                    </span>
                                                </button>
                                                <button
                                                    onClick={(e) => {
                                                        e.stopPropagation()
                                                        onRating(4)
                                                    }}
                                                    className="flex min-h-[44px] items-center justify-center rounded bg-green-500 px-2 py-2 text-xs text-white hover:bg-green-600 sm:text-sm"
                                                >
                                                    <span className="hidden md:inline">
                                                        Einfach (4)
                                                    </span>
                                                    <span className="md:hidden">
                                                        Einfach
                                                    </span>
                                                </button>
                                            </div>
                                        </div>
                                    )}
                                </div>
                            </CardContent>
                        </Card>
                    </motion.div>
                )}
            </AnimatePresence>
        </div>
    )
}
