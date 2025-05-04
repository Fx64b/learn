'use client'

import { type FlashcardType } from '@/types'
import { toast } from 'sonner'

import { useEffect, useState } from 'react'

import Link from 'next/link'

import { reviewCard } from '@/app/actions/flashcard'

import { Flashcard } from '@/components/flashcard'
import { Button } from '@/components/ui/button'

interface LernModusClientProps {
    deckId: string
    deckTitel: string
    flashcards: FlashcardType[]
}

export default function LernModusClient({
    deckId, // eslint-disable-line @typescript-eslint/no-unused-vars
    deckTitel, // eslint-disable-line @typescript-eslint/no-unused-vars
    flashcards,
}: LernModusClientProps) {
    const [aktuellerIndex, setAktuellerIndex] = useState(0)
    const [fortschritt, setFortschritt] = useState(0)
    const [istLernprozessAbgeschlossen, setIstLernprozessAbgeschlossen] =
        useState(false)

    useEffect(() => {
        // Fortschritt aktualisieren
        if (flashcards.length > 0) {
            setFortschritt(
                Math.round((aktuellerIndex / flashcards.length) * 100)
            )
        }
    }, [aktuellerIndex, flashcards.length])

    // Handler für die Bewertung einer Karte
    const handleBewertung = async (bewertung: number) => {
        if (flashcards.length === 0 || aktuellerIndex >= flashcards.length)
            return

        const aktuelleKarte = flashcards[aktuellerIndex]

        // Karte bewerten und in DB speichern
        const result = await reviewCard(aktuelleKarte.id, bewertung)

        if (result.success) {
            toast(`Karte mit ${bewertung} bewertet`, {
                description:
                    bewertung < 3
                        ? 'Diese Karte wird bald wiederholt'
                        : 'Gut gemacht!',
            })

            // Zur nächsten Karte gehen
            if (aktuellerIndex < flashcards.length - 1) {
                setAktuellerIndex(aktuellerIndex + 1)
            } else {
                // Alle Karten wurden wiederholt
                setIstLernprozessAbgeschlossen(true)
                toast.success('Alle Karten wiederholt!', {
                    description: 'Lerneinheit abgeschlossen',
                })
            }
        } else {
            toast.error('Fehler beim Bewerten der Karte')
        }
    }

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
                <div className="flex gap-2">
                    <Button
                        variant="outline"
                        onClick={() => {
                            setAktuellerIndex(0)
                            setIstLernprozessAbgeschlossen(false)
                        }}
                    >
                        Nochmal wiederholen
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
            {/* Fortschrittsanzeige */}
            <div className="text-muted-foreground mb-6 flex items-center gap-2 text-sm">
                <div className="bg-secondary h-2 w-full rounded-full">
                    <div
                        className="bg-primary h-2 rounded-full"
                        style={{ width: `${fortschritt}%` }}
                    ></div>
                </div>
                <span className="whitespace-nowrap">
                    {aktuellerIndex + 1} von {flashcards.length}
                </span>
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

                <div className="text-muted-foreground mt-4 text-center text-sm">
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
