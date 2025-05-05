'use client'

import { toast } from 'sonner'

import { useState } from 'react'

import {
    createFlashcard,
    createFlashcardsFromJson,
} from '@/app/actions/flashcard'

import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { Textarea } from '@/components/ui/textarea'

export function CreateCardForm({ deckId }: { deckId: string }) {
    const [singleCard, setSingleCard] = useState({
        vorderseite: '',
        rückseite: '',
    })
    const [jsonCards, setJsonCards] = useState('')
    const [isSubmitting, setIsSubmitting] = useState(false)

    const handleSingleSubmit = async (e: React.FormEvent) => {
        e.preventDefault()
        setIsSubmitting(true)

        const formData = new FormData()
        formData.append('deckId', deckId)
        formData.append('vorderseite', singleCard.vorderseite)
        formData.append('rückseite', singleCard.rückseite)
        formData.append('istPrüfungsrelevant', 'true')

        const result = await createFlashcard(formData)

        if (result.success) {
            toast.success('Karte erstellt')
            setSingleCard({ vorderseite: '', rückseite: '' })
        } else {
            toast.error('Fehler beim Erstellen der Karte')
        }

        setIsSubmitting(false)
    }

    const handleBulkSubmit = async (e: React.FormEvent) => {
        e.preventDefault()
        setIsSubmitting(true)

        const result = await createFlashcardsFromJson({
            deckId,
            cardsJson: jsonCards,
        })

        if (result.success) {
            const successCount =
                result.results?.filter((r) => r.success).length || 0
            const errorCount =
                result.results?.filter((r) => !r.success).length || 0

            toast.success(
                `${successCount} Karten erstellt${errorCount > 0 ? `, ${errorCount} Fehler` : ''}`
            )
            setJsonCards('')
        } else {
            toast.error(result.error || 'Fehler beim Erstellen der Karten')
        }

        setIsSubmitting(false)
    }

    return (
        <Tabs defaultValue="single" className="w-full">
            <TabsList className="grid h-full w-full grid-cols-2">
                <TabsTrigger value="single">Einzelne Karte</TabsTrigger>
                <TabsTrigger value="bulk">Mehrere Karten (JSON)</TabsTrigger>
            </TabsList>

            <TabsContent value="single">
                <Card>
                    <CardHeader>
                        <CardTitle>Neue Karte erstellen</CardTitle>
                    </CardHeader>
                    <CardContent>
                        <form
                            onSubmit={handleSingleSubmit}
                            className="space-y-4"
                        >
                            <div>
                                <label className="mb-1 block text-sm font-medium">
                                    Vorderseite
                                </label>
                                <Input
                                    value={singleCard.vorderseite}
                                    onChange={(e) =>
                                        setSingleCard((prev) => ({
                                            ...prev,
                                            vorderseite: e.target.value,
                                        }))
                                    }
                                    placeholder="Frage oder Begriff"
                                    required
                                />
                            </div>
                            <div>
                                <label className="mb-1 block text-sm font-medium">
                                    Rückseite
                                </label>
                                <Textarea
                                    value={singleCard.rückseite}
                                    onChange={(e) =>
                                        setSingleCard((prev) => ({
                                            ...prev,
                                            rückseite: e.target.value,
                                        }))
                                    }
                                    placeholder="Antwort oder Definition"
                                    className="h-56 w-full rounded border p-2"
                                    required
                                />
                            </div>
                            <Button type="submit" disabled={isSubmitting}>
                                {isSubmitting
                                    ? 'Erstelle...'
                                    : 'Karte erstellen'}
                            </Button>
                        </form>
                    </CardContent>
                </Card>
            </TabsContent>

            <TabsContent value="bulk">
                <Card>
                    <CardHeader>
                        <CardTitle>Mehrere Karten aus JSON erstellen</CardTitle>
                    </CardHeader>
                    <CardContent>
                        <form onSubmit={handleBulkSubmit} className="space-y-4">
                            <div>
                                <label className="mb-2 block text-sm font-medium">
                                    JSON Array von Karten
                                </label>
                                <Textarea
                                    value={jsonCards}
                                    onChange={(e) =>
                                        setJsonCards(e.target.value)
                                    }
                                    className="h-72 w-full rounded border p-2"
                                    placeholder={`[
  {
    "vorderseite": "Was ist ...?",
    "rückseite": "Die Antwort ist ...",
    "istPrüfungsrelevant": true
  },
  {
    "vorderseite": "Nenne drei ...",
    "rückseite": "1. ... 2. ... 3. ..."
  }
]`}
                                    required
                                />
                            </div>
                            <Button type="submit" disabled={isSubmitting}>
                                {isSubmitting
                                    ? 'Erstelle Karten...'
                                    : 'Karten aus JSON erstellen'}
                            </Button>
                        </form>
                    </CardContent>
                </Card>
            </TabsContent>
        </Tabs>
    )
}
