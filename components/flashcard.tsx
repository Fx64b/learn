'use client'

import { cn } from '@/lib/utils'
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

    const flipCard = useCallback(() => {
        if (!isFlipping) {
            setIsFlipping(true)
            setIsFlipped(!isFlipped)
            setTimeout(() => setIsFlipping(false), 200)
        }
    }, [isFlipping, isFlipped])

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

    return (
        <div
            className={cn(
                'relative h-64 w-full cursor-pointer touch-manipulation sm:h-72',
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
            <AnimatePresence mode="wait" initial={false}>
                {!isFlipped ? (
                    <motion.div
                        key="front"
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        exit={{ opacity: 0 }}
                        transition={{ duration: 0.2 }}
                        className="absolute inset-0"
                    >
                        <Card className="h-full w-full shadow-md transition-shadow hover:shadow-lg">
                            <CardContent className="flex h-full items-center justify-center p-6">
                                <div className="text-center">
                                    <p className="text-lg sm:text-xl md:text-2xl">
                                        {vorderseite}
                                    </p>
                                    <p className="text-muted-foreground mt-4 text-xs">
                                        Tippen zum Umdrehen (Leertaste)
                                    </p>
                                </div>
                            </CardContent>
                        </Card>
                    </motion.div>
                ) : (
                    <motion.div
                        key="back"
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        exit={{ opacity: 0 }}
                        transition={{ duration: 0.2 }}
                        className="absolute inset-0"
                    >
                        <Card className="border-primary/30 h-full w-full border-2 shadow-md">
                            <CardContent className="flex h-full items-center justify-center p-6">
                                <div className="text-center">
                                    <p className="text-muted-foreground mb-2 text-xs">
                                        Antwort
                                    </p>
                                    <p className="text-lg font-medium sm:text-xl md:text-2xl">
                                        {rückseite}
                                    </p>

                                    {onRating && (
                                        <div className="border-border mt-4 border-t pt-2">
                                            <p className="text-muted-foreground mb-2 text-xs">
                                                Bewertung (1-4):
                                            </p>
                                            <div className="mt-1 grid grid-cols-4 gap-2">
                                                <button
                                                    onClick={(e) => {
                                                        e.stopPropagation()
                                                        onRating(1)
                                                    }}
                                                    className="rounded bg-red-500 px-2 py-1 text-sm text-white hover:bg-red-600 dark:text-black"
                                                >
                                                    Wieder (1)
                                                </button>
                                                <button
                                                    onClick={(e) => {
                                                        e.stopPropagation()
                                                        onRating(2)
                                                    }}
                                                    className="rounded bg-yellow-500 px-2 py-1 text-sm text-white hover:bg-yellow-600 dark:text-black"
                                                >
                                                    Schwer (2)
                                                </button>
                                                <button
                                                    onClick={(e) => {
                                                        e.stopPropagation()
                                                        onRating(3)
                                                    }}
                                                    className="rounded bg-blue-500 px-2 py-1 text-sm text-white hover:bg-blue-600"
                                                >
                                                    Gut (3)
                                                </button>
                                                <button
                                                    onClick={(e) => {
                                                        e.stopPropagation()
                                                        onRating(4)
                                                    }}
                                                    className="rounded bg-green-500 px-2 py-1 text-sm text-white hover:bg-green-600"
                                                >
                                                    Einfach (4)
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