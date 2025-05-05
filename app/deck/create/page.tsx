'use client'

import { ArrowLeft } from 'lucide-react'
import { toast } from 'sonner'

import { useState } from 'react'

import Link from 'next/link'
import { useRouter } from 'next/navigation'

import { createDeck } from '@/app/actions/deck'

import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'

export default function CreateDeckPage() {
    const router = useRouter()
    const [isSubmitting, setIsSubmitting] = useState(false)
    const [formData, setFormData] = useState({
        titel: '',
        beschreibung: '',
        kategorie: '',
    })

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault()
        setIsSubmitting(true)

        const formDataToSend = new FormData()
        formDataToSend.append('titel', formData.titel)
        formDataToSend.append('beschreibung', formData.beschreibung)
        formDataToSend.append('kategorie', formData.kategorie)

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
