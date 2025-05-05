'use client'

import { type FlashcardType } from '@/types'
import { Clock, RotateCw, Settings2 } from 'lucide-react'
import { toast } from 'sonner'

import { useCallback, useEffect, useRef, useState } from 'react'

import Link from 'next/link'

import { reviewCard } from '@/app/actions/flashcard'
import { saveStudySession } from '@/app/actions/study-session'

import { Flashcard } from '@/components/flashcard'
import { Button } from '@/components/ui/button'
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from '@/components/ui/select'
import { Slider } from '@/components/ui/slider'
import { Switch } from '@/components/ui/switch'

interface LernModusClientProps {
    deckId: string
    deckTitel: string
    flashcards: FlashcardType[]
}

export default function LernModusClient({
    deckId,
    deckTitel, // eslint-disable-line @typescript-eslint/no-unused-vars
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
    const [showSettings, setShowSettings] = useState(false)
    const [isTimerRunning, setIsTimerRunning] = useState(true)
    const [hasUnsavedSession, setHasUnsavedSession] = useState(true)
    const sessionDataRef = useRef({
        startTime,
        studyTime,
        aktuellerIndex,
        deckId,
        hasUnsavedSession,
    })

    // Animation settings
    const [animationSpeed, setAnimationSpeed] = useState(200) // ms
    const [animationDirection, setAnimationDirection] = useState<
        'horizontal' | 'vertical'
    >('horizontal')
    const [animationsEnabled, setAnimationsEnabled] = useState(false)

    useEffect(() => {
        sessionDataRef.current = {
            startTime,
            studyTime,
            aktuellerIndex,
            deckId,
            hasUnsavedSession,
        }
    }, [startTime, studyTime, aktuellerIndex, deckId, hasUnsavedSession])

    // Timer effect
    useEffect(() => {
        let timer: NodeJS.Timeout | null = null

        if (isTimerRunning) {
            timer = setInterval(() => {
                setStudyTime(Date.now() - startTime.getTime())
            }, 1000)
        }

        return () => {
            if (timer) clearInterval(timer)
        }
    }, [startTime, isTimerRunning])

    // Update progress
    useEffect(() => {
        if (flashcards.length > 0) {
            setFortschritt(
                Math.round((aktuellerIndex / flashcards.length) * 100)
            )
        }
    }, [aktuellerIndex, flashcards.length])

    // Save session on completion
    useEffect(() => {
        if (istLernprozessAbgeschlossen) {
            setIsTimerRunning(false)
            saveCurrentSession(true)
        }
    }, [istLernprozessAbgeschlossen])

    const saveCurrentSession = useCallback(
        async (isCompleted: boolean) => {
            const endTime = new Date()
            const duration = studyTime || Date.now() - startTime.getTime()

            const result = await saveStudySession({
                deckId: deckId,
                startTime: startTime,
                endTime: endTime,
                duration: duration,
                cardsReviewed: aktuellerIndex,
                isCompleted: isCompleted,
            })

            if (result.success) {
                setHasUnsavedSession(false)
            }
        },
        [deckId, startTime, studyTime, aktuellerIndex]
    )

    // Format study time
    const formatTime = (ms: number) => {
        const seconds = Math.floor(ms / 1000)
        const minutes = Math.floor(seconds / 60)
        const remainingSeconds = seconds % 60
        return `${minutes}:${remainingSeconds.toString().padStart(2, '0')}`
    }

    // Shuffle cards
    const shuffleCards = () => {
        const shuffled = [...flashcards].sort(() => Math.random() - 0.5)
        setFlashcards(shuffled)
        setAktuellerIndex(0)
        setIstLernprozessAbgeschlossen(false)
        setStartTime(new Date())
        setStudyTime(0)
        setHasUnsavedSession(true)
        toast.success('Karten gemischt!')
    }

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

    // Auto-save session every 20 seconds
    useEffect(() => {
        const autoSaveInterval = setInterval(() => {
            const { hasUnsavedSession } = sessionDataRef.current

            if (hasUnsavedSession) {
                const saveSession = async (isCompleted: boolean) => {
                    const { startTime, studyTime, aktuellerIndex, deckId } =
                        sessionDataRef.current
                    const endTime = new Date()
                    const duration =
                        studyTime || Date.now() - startTime.getTime()

                    const result = await saveStudySession({
                        deckId: deckId,
                        startTime: startTime,
                        endTime: endTime,
                        duration: duration,
                        cardsReviewed: aktuellerIndex,
                        isCompleted: isCompleted,
                    })

                    if (result.success) {
                        sessionDataRef.current.hasUnsavedSession = false
                        setHasUnsavedSession(false)
                    }
                }

                console.debug('Auto-saving session...')
                saveSession(false)
            }
        }, 20000)

        return () => clearInterval(autoSaveInterval)
    }, [])

    if (flashcards.length === 0) {
        return (
            <div className="flex flex-1 flex-col items-center justify-center gap-4 py-8">
                <h2 className="mb-2 text-xl font-semibold">
                    Keine Karten verfügbar
                </h2>
                <p className="text-muted-foreground mb-4 text-center">
                    Für diese Kategorie wurden noch keine Karten hinzugefügt.
                </p>
                <Button asChild>
                    <Link href="/">Zurück zur Übersicht</Link>
                </Button>
            </div>
        )
    }

    if (istLernprozessAbgeschlossen) {
        return (
            <div className="flex flex-1 flex-col items-center justify-center gap-4 py-8">
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
                <div className="flex gap-2">
                    <Button
                        variant="outline"
                        onClick={() => {
                            setAktuellerIndex(0)
                            setIstLernprozessAbgeschlossen(false)
                            setStartTime(new Date())
                            setStudyTime(0)
                        }}
                    >
                        Nochmal wiederholen
                    </Button>
                    <Button variant="outline" onClick={shuffleCards}>
                        Gemischt wiederholen
                    </Button>
                    <Button asChild>
                        <Link href="/">Zurück zur Übersicht</Link>
                    </Button>
                </div>
            </div>
        )
    }

    return (
        <>
            {/* Study session header with timer and settings */}
            <div className="mb-6 flex items-center justify-between">
                <div className="flex items-center gap-4">
                    <Button
                        className="hidden md:inline-flex"
                        variant="ghost"
                        size="icon"
                        onClick={() => setShowSettings(!showSettings)}
                    >
                        <Settings2 className="h-5 w-5" />
                    </Button>
                    <Button
                        className="h-10 w-10 md:h-5 md:w-5"
                        variant="ghost"
                        size="icon"
                        onClick={shuffleCards}
                    >
                        <RotateCw />
                    </Button>
                </div>
                <div className="text-muted-foreground flex items-center gap-2 text-sm">
                    <Clock className="h-4 w-4" />
                    {formatTime(studyTime)}
                </div>
            </div>

            {/* Settings panel */}
            {showSettings && (
                <div className="bg-card mb-6 rounded-lg border p-4">
                    <h3 className="mb-3 text-sm font-semibold">
                        Animations-Einstellungen
                    </h3>
                    <div className="space-y-4">
                        <div className="flex items-center justify-between">
                            <label className="text-sm">
                                Animationen aktivieren
                            </label>
                            <Switch
                                checked={animationsEnabled}
                                onCheckedChange={setAnimationsEnabled}
                            />
                        </div>
                        {animationsEnabled && (
                            <>
                                <div>
                                    <label className="text-sm">
                                        Geschwindigkeit
                                    </label>
                                    <div className="mt-2 flex items-center gap-4">
                                        <Slider
                                            value={[animationSpeed]}
                                            onValueChange={([value]) =>
                                                setAnimationSpeed(value)
                                            }
                                            max={500}
                                            min={100}
                                            step={50}
                                            className="w-32"
                                        />
                                        <p className="text-muted-foreground w-12 text-xs">
                                            {animationSpeed}ms
                                        </p>
                                    </div>
                                </div>
                                <div>
                                    <label className="text-sm">Richtung</label>
                                    <Select
                                        value={animationDirection}
                                        onValueChange={(
                                            value: 'horizontal' | 'vertical'
                                        ) => setAnimationDirection(value)}
                                    >
                                        <SelectTrigger className="mt-2 w-48">
                                            <SelectValue placeholder="Animations-Richtung" />
                                        </SelectTrigger>
                                        <SelectContent>
                                            <SelectItem value="horizontal">
                                                Horizontal
                                            </SelectItem>
                                            <SelectItem value="vertical">
                                                Vertikal
                                            </SelectItem>
                                        </SelectContent>
                                    </Select>
                                </div>
                            </>
                        )}
                    </div>
                </div>
            )}

            {/* Enhanced progress display */}
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
                        animationSpeed={animationsEnabled ? animationSpeed : 0}
                        animationDirection={animationDirection}
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
