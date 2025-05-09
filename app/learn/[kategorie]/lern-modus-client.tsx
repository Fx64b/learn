'use client'

import { type FlashcardType } from '@/types'
import {Clock, Shuffle} from 'lucide-react'
import { toast } from 'sonner'

import { useCallback, useEffect, useRef, useState } from 'react'

import Link from 'next/link'

import { reviewCard } from '@/app/actions/flashcard'
import { saveStudySession } from '@/app/actions/study-session'

import { Flashcard } from '@/components/flashcard'
import { Button } from '@/components/ui/button'

interface LernModusClientProps {
    deckId: string
    flashcards: FlashcardType[]
}

export default function LernModusClient({
    deckId,
    flashcards: initialFlashcards,
}: LernModusClientProps) {
    const [flashcards, setFlashcards] = useState(initialFlashcards)
    const [aktuellerIndex, setAktuellerIndex] = useState(0)
    const [fortschritt, setFortschritt] = useState(0)
    const [istLernprozessAbgeschlossen, setIstLernprozessAbgeschlossen] =
        useState(false)

    // Session tracking
    const [startTime, setStartTime] = useState(new Date())
    const [studyTime, setStudyTime] = useState(0)
    const [isTimerRunning, setIsTimerRunning] = useState(true)
    const [hasUnsavedSession, setHasUnsavedSession] = useState(true)
    const [isSaving, setIsSaving] = useState(false)
    const [currentSessionId, setCurrentSessionId] = useState<string | null>(
        null
    )

    const sessionDataRef = useRef({
        startTime,
        studyTime,
        aktuellerIndex,
        deckId,
        hasUnsavedSession,
        currentSessionId,
    })
    const autoSaveIntervalRef = useRef<NodeJS.Timeout | null>(null)

    useEffect(() => {
        sessionDataRef.current = {
            startTime,
            studyTime,
            aktuellerIndex,
            deckId,
            hasUnsavedSession,
            currentSessionId,
        }
    }, [
        startTime,
        studyTime,
        aktuellerIndex,
        deckId,
        hasUnsavedSession,
        currentSessionId,
    ])

    const saveCurrentSession = useCallback(
        async (isCompleted: boolean) => {
            if (isSaving) return // Prevent concurrent saves

            setIsSaving(true)
            try {
                const endTime = new Date()
                const duration = studyTime || Date.now() - startTime.getTime()

                const sessionData: {
                    id?: string
                    deckId: string
                    startTime: Date
                    endTime: Date
                    duration: number
                    cardsReviewed: number
                    isCompleted: boolean
                } = {
                    deckId: deckId,
                    startTime: startTime,
                    endTime: endTime,
                    duration: duration,
                    cardsReviewed: aktuellerIndex,
                    isCompleted: isCompleted,
                }

                if (currentSessionId) {
                    sessionData.id = currentSessionId
                }

                const result = await saveStudySession(sessionData)

                if (result.success) {
                    setHasUnsavedSession(false)
                    if (result.id && !currentSessionId) {
                        console.log('Setting new session ID:', result.id)
                        setCurrentSessionId(result.id)
                    }
                } else {
                    console.error('Failed to save session:', result.error)
                }
            } catch (error) {
                console.error('Error saving session:', error)
            } finally {
                setIsSaving(false)
            }
        },
        [
            deckId,
            startTime,
            studyTime,
            aktuellerIndex,
            currentSessionId,
            isSaving,
        ]
    )

    useEffect(() => {
        let timer: NodeJS.Timeout | null = null

        const handleVisibilityChange = () => {
            if (document.hidden) {
                // User left the page - pause timer
                if (timer) clearInterval(timer)
                setIsTimerRunning(false)
                if (hasUnsavedSession && !isSaving) {
                    saveCurrentSession(false)
                }
            } else {
                // User is back - resume timer if not completed
                if (!istLernprozessAbgeschlossen) {
                    setIsTimerRunning(true)
                }
            }
        }

        if (isTimerRunning) {
            timer = setInterval(() => {
                setStudyTime(Date.now() - startTime.getTime())
            }, 1000)
        }

        document.addEventListener('visibilitychange', handleVisibilityChange)

        return () => {
            if (timer) clearInterval(timer)
            document.removeEventListener(
                'visibilitychange',
                handleVisibilityChange
            )
        }
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [
        startTime,
        isTimerRunning,
        istLernprozessAbgeschlossen,
        hasUnsavedSession,
        isSaving,
    ])

    useEffect(() => {
        if (flashcards.length > 0) {
            setFortschritt(
                Math.round((aktuellerIndex / flashcards.length) * 100)
            )
        }
    }, [aktuellerIndex, flashcards.length])

    useEffect(() => {
        if (istLernprozessAbgeschlossen) {
            setIsTimerRunning(false)
            saveCurrentSession(true)
        }
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [istLernprozessAbgeschlossen])

    useEffect(() => {
        if (autoSaveIntervalRef.current) {
            clearInterval(autoSaveIntervalRef.current)
        }

        // Create new auto-save
        autoSaveIntervalRef.current = setInterval(() => {
            if (
                hasUnsavedSession &&
                !isSaving &&
                !istLernprozessAbgeschlossen
            ) {
                console.log('Auto-save triggered')
                saveCurrentSession(false)
            }
        }, 20000) // Auto-save every 20 seconds

        // Cleanup on unmount
        return () => {
            if (autoSaveIntervalRef.current) {
                clearInterval(autoSaveIntervalRef.current)
            }
        }
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [hasUnsavedSession, isSaving, istLernprozessAbgeschlossen])

    const formatTime = (ms: number) => {
        const seconds = Math.floor(ms / 1000)
        const minutes = Math.floor(seconds / 60)
        const remainingSeconds = seconds % 60
        return `${minutes}:${remainingSeconds.toString().padStart(2, '0')}`
    }

    const shuffleCards = useCallback(() => {
        const shuffled = [...flashcards].sort(() => Math.random() - 0.5)

        setIstLernprozessAbgeschlossen(false)

        const newStartTime = new Date()
        setStartTime(newStartTime)
        setStudyTime(0)
        setCurrentSessionId(null)

        setAktuellerIndex(0)

        setFlashcards(shuffled)

        setHasUnsavedSession(true)
        toast.success('Karten gemischt!')
    }, [flashcards])

    const handleBewertung = async (bewertung: number) => {
        if (flashcards.length === 0 || aktuellerIndex >= flashcards.length)
            return

        const aktuelleKarte = flashcards[aktuellerIndex]

        const result = await reviewCard(aktuelleKarte.id, bewertung)

        setHasUnsavedSession(true)

        if (result.success) {
            if (aktuellerIndex < flashcards.length - 1) {
                setAktuellerIndex(aktuellerIndex + 1)
            } else {
                setIstLernprozessAbgeschlossen(true)
                toast.success('Alle Karten wiederholt!', {
                    description: 'Lerneinheit abgeschlossen',
                })
            }
        } else {
            toast.error('Fehler beim Bewerten der Karte')
        }
    }

    // Save session before component unmounts
    useEffect(() => {
        return () => {
            if (hasUnsavedSession && !isSaving) {
                console.log('Saving session on unmount')
                saveCurrentSession(false)
            }
        }
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [hasUnsavedSession, isSaving])

    if (flashcards.length === 0) {
        return (
            <div className="flex flex-1 flex-col items-center justify-start gap-4 py-8">
                <h2 className="mb-2 text-xl font-semibold">
                    Sieht so aus, als hättest du schon alles gelernt!
                </h2>
                <p className="text-muted-foreground mb-4 text-center">
                    Für diese Kategorie sind keine Karten verfügbar.
                </p>
                <Button asChild>
                    <Link href="/">Zurück zur Übersicht</Link>
                </Button>
            </div>
        )
    }

    if (istLernprozessAbgeschlossen) {
        return (
            <div className="flex flex-1 flex-col items-center justify-start gap-4 py-8">
                <h2 className="mb-2 text-xl font-semibold">
                    Lerneinheit abgeschlossen!
                </h2>
                <p className="text-muted-foreground mb-4 text-center">
                    Du hast alle {flashcards.length} Karten in dieser Kategorie
                    wiederholt.
                </p>
                <p className="text-muted-foreground mb-4 text-sm">
                    Lernzeit: {formatTime(studyTime)}
                </p>
                <div className="flex flex-wrap justify-center gap-4 md:gap-2">
                    <Button
                        variant="outline"
                        onClick={() => {
                            setAktuellerIndex(0)
                            setIstLernprozessAbgeschlossen(false)
                            setStartTime(new Date())
                            setStudyTime(0)
                            setHasUnsavedSession(true)
                        }}
                    >
                        Nochmal wiederholen
                    </Button>
                    <Button variant="outline" onClick={shuffleCards}>
                        Gemischt wiederholen
                    </Button>
                    <Button>
                        <Link href="/">Zurück zur Übersicht</Link>
                    </Button>
                </div>
            </div>
        )
    }

    return (
        <>
            <div className="mb-6 flex items-center justify-between">
                <div className="flex items-center gap-4">
                    <Button
                        className="h-10 w-10 md:h-5 md:w-5"
                        variant="ghost"
                        size="icon"
                        onClick={shuffleCards}
                    >
                        <Shuffle />
                    </Button>
                </div>
                <div className="text-muted-foreground flex items-center gap-2 text-sm">
                    <Clock className="h-4 w-4" />
                    {formatTime(studyTime)}
                </div>
            </div>

            <div className="mb-6">
                <div className="mb-2 flex items-center justify-between">
                    <div className="text-lg font-semibold">
                        Karte {aktuellerIndex + 1} von {flashcards.length}
                    </div>
                    <div className="text-lg font-semibold">
                        Verbleibend: {flashcards.length - aktuellerIndex}
                    </div>
                </div>
                <div className="bg-secondary h-3 w-full rounded-full">
                    <div
                        className="bg-primary h-3 rounded-full transition-all duration-300"
                        style={{ width: `${fortschritt}%` }}
                    ></div>
                </div>
            </div>

            <div className="flex flex-1 flex-col items-center justify-center">
                {flashcards[aktuellerIndex] && (
                    <Flashcard
                        key={flashcards[aktuellerIndex].id}
                        vorderseite={flashcards[aktuellerIndex].vorderseite}
                        rückseite={flashcards[aktuellerIndex].rückseite}
                        onRating={handleBewertung}
                        className="w-full max-w-2xl"
                    />
                )}

                <div className="text-muted-foreground mt-4 text-center text-sm opacity-0 md:opacity-100">
                    <p>
                        Drücke die{' '}
                        <kbd className="bg-muted border-border rounded-md border px-2 py-1.5 text-xs font-semibold">
                            Leertaste
                        </kbd>{' '}
                        zum Umdrehen
                    </p>
                    <p className="mt-1">
                        Bewerte mit{' '}
                        <kbd className="bg-muted border-border rounded-md border px-1 py-0.5 text-xs font-semibold">
                            1
                        </kbd>{' '}
                        bis{' '}
                        <kbd className="bg-muted border-border rounded-md border px-1 py-0.5 text-xs font-semibold">
                            4
                        </kbd>{' '}
                        oder klicke auf die Schaltflächen
                    </p>
                </div>
            </div>
        </>
    )
}
