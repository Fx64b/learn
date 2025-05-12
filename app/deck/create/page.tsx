'use client'

import { format } from 'date-fns'
import { ArrowLeft, CalendarIcon } from 'lucide-react'
import { toast } from 'sonner'

import { useState } from 'react'

import Link from 'next/link'
import { useRouter } from 'next/navigation'

import { createDeck } from '@/app/actions/deck'

import { Button } from '@/components/ui/button'
import { Calendar } from '@/components/ui/calendar'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import {
    Popover,
    PopoverContent,
    PopoverTrigger,
} from '@/components/ui/popover'

export default function CreateDeckPage() {
    const router = useRouter()
    const [isSubmitting, setIsSubmitting] = useState(false)
    const [formData, setFormData] = useState({
        titel: '',
        beschreibung: '',
        kategorie: '',
        aktivBis: null as Date | null,
    })

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault()
        setIsSubmitting(true)

        const formDataToSend = new FormData()
        formDataToSend.append('titel', formData.titel)
        formDataToSend.append('beschreibung', formData.beschreibung)
        formDataToSend.append('kategorie', formData.kategorie)

        if (formData.aktivBis) {
            formDataToSend.append('aktivBis', formData.aktivBis.toISOString())
        }

        const result = await createDeck(formDataToSend)

        if (result.success) {
            toast.success('Deck erfolgreich erstellt!')
            router.push(`/deck/${result.id}/edit`)
        } else {
            toast.error('Fehler beim Erstellen des Decks')
        }

        setIsSubmitting(false)
    }

    return (
        <div className="container mx-auto max-w-2xl px-4 py-8">
            <div className="mb-8 flex items-center gap-4">
                <Button
                    className="h-10 w-10 md:h-5 md:w-5"
                    variant="ghost"
                    size="icon"
                    asChild
                >
                    <Link href="/">
                        <ArrowLeft />
                    </Link>
                </Button>
                <h1 className="text-2xl font-bold">Neues Deck erstellen</h1>
            </div>

            <Card>
                <CardHeader>
                    <CardTitle>Deck-Details</CardTitle>
                </CardHeader>
                <CardContent>
                    <form onSubmit={handleSubmit} className="space-y-4">
                        <div className="space-y-2">
                            <Label htmlFor="titel">Titel</Label>
                            <Input
                                id="titel"
                                value={formData.titel}
                                onChange={(e) =>
                                    setFormData((prev) => ({
                                        ...prev,
                                        titel: e.target.value,
                                    }))
                                }
                                placeholder="z.B. Mathematik Grundlagen"
                                required
                            />
                        </div>

                        <div className="space-y-2">
                            <Label htmlFor="beschreibung">
                                Beschreibung (optional)
                            </Label>
                            <Input
                                id="beschreibung"
                                value={formData.beschreibung}
                                onChange={(e) =>
                                    setFormData((prev) => ({
                                        ...prev,
                                        beschreibung: e.target.value,
                                    }))
                                }
                                placeholder="Kurze Beschreibung des Decks"
                            />
                        </div>

                        <div className="space-y-2">
                            <Label htmlFor="kategorie">Kategorie</Label>
                            <Input
                                id="kategorie"
                                value={formData.kategorie}
                                onChange={(e) =>
                                    setFormData((prev) => ({
                                        ...prev,
                                        kategorie: e.target.value,
                                    }))
                                }
                                placeholder="z.B. Mathematik, Sprachen, etc."
                                required
                            />
                        </div>

                        <div className="space-y-2">
                            <Label htmlFor="aktivBis">
                                Lernfrist (optional)
                            </Label>
                            <Popover>
                                <PopoverTrigger asChild>
                                    <Button
                                        variant="outline"
                                        className="w-full justify-start text-left font-normal"
                                        id="aktivBis"
                                    >
                                        <CalendarIcon className="mr-2 h-4 w-4" />
                                        {formData.aktivBis ? (
                                            format(
                                                formData.aktivBis,
                                                'dd.MM.yyyy'
                                            )
                                        ) : (
                                            <span className="text-muted-foreground">
                                                Kein Datum ausgewählt
                                            </span>
                                        )}
                                    </Button>
                                </PopoverTrigger>
                                <PopoverContent className="w-auto p-0">
                                    <Calendar
                                        mode="single"
                                        selected={
                                            formData.aktivBis || undefined
                                        }
                                        onSelect={(date) =>
                                            setFormData((prev) => ({
                                                ...prev,
                                                aktivBis: date || null,
                                            }))
                                        }
                                        initialFocus
                                    />
                                </PopoverContent>
                            </Popover>
                            {formData.aktivBis && (
                                <Button
                                    variant="ghost"
                                    size="sm"
                                    onClick={() =>
                                        setFormData((prev) => ({
                                            ...prev,
                                            aktivBis: null,
                                        }))
                                    }
                                    className="mt-2"
                                >
                                    Datum entfernen
                                </Button>
                            )}
                            <p className="text-muted-foreground text-xs">
                                Datum, bis zu dem die Karten gelernt werden
                                sollen (z.B. Prüfungsdatum)
                            </p>
                        </div>

                        <div className="flex items-center justify-between gap-2 pt-4 md:justify-end">
                            <Button variant="outline" asChild>
                                <Link href="/">Abbrechen</Link>
                            </Button>
                            <Button type="submit" disabled={isSubmitting}>
                                {isSubmitting
                                    ? 'Wird erstellt...'
                                    : 'Deck erstellen'}
                            </Button>
                        </div>
                    </form>
                </CardContent>
            </Card>
        </div>
    )
}
