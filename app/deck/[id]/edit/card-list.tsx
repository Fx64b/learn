'use client'

import { FlashcardType } from '@/types'
import { Check, Pencil, Trash2, X } from 'lucide-react'
import { toast } from 'sonner'

import { useState } from 'react'

import { deleteFlashcard, updateFlashcard } from '@/app/actions/flashcard'

import { Button } from '@/components/ui/button'
import { Card, CardContent } from '@/components/ui/card'
import { Input } from '@/components/ui/input'

interface CardListProps {
    flashcards: FlashcardType[]
}

interface EditingState {
    id: string | null
    vorderseite: string
    rückseite: string
}

export default function CardList({ flashcards }: CardListProps) {
    const [editing, setEditing] = useState<EditingState>({
        id: null,
        vorderseite: '',
        rückseite: '',
    })
    const [isSubmitting, setIsSubmitting] = useState(false)

    const startEditing = (card: FlashcardType) => {
        setEditing({
            id: card.id,
            vorderseite: card.vorderseite,
            rückseite: card.rückseite,
        })
    }

    const cancelEditing = () => {
        setEditing({ id: null, vorderseite: '', rückseite: '' })
    }

    const saveEdit = async () => {
        if (!editing.id) return

        setIsSubmitting(true)
        const result = await updateFlashcard({
            id: editing.id,
            vorderseite: editing.vorderseite,
            rückseite: editing.rückseite,
            istPrüfungsrelevant: true, // Default to true
        })

        if (result.success) {
            toast.success('Karte aktualisiert')
            cancelEditing()
        } else {
            toast.error('Fehler beim Aktualisieren')
        }
        setIsSubmitting(false)
    }

    const handleDelete = async (id: string) => {
        if (!confirm('Möchten Sie diese Karte wirklich löschen?')) return

        const result = await deleteFlashcard(id)
        if (result.success) {
            toast.success('Karte gelöscht')
        } else {
            toast.error('Fehler beim Löschen')
        }
    }

    return (
        <div className="space-y-3">
            {flashcards.map((card) => (
                <Card key={card.id}>
                    <CardContent className="pt-6">
                        {editing.id === card.id ? (
                            <div className="space-y-4">
                                <div>
                                    <label className="block text-sm font-medium">
                                        Vorderseite
                                    </label>
                                    <Input
                                        value={editing.vorderseite}
                                        onChange={(e) =>
                                            setEditing((prev) => ({
                                                ...prev,
                                                vorderseite: e.target.value,
                                            }))
                                        }
                                    />
                                </div>
                                <div>
                                    <label className="block text-sm font-medium">
                                        Rückseite
                                    </label>
                                    <Input
                                        value={editing.rückseite}
                                        onChange={(e) =>
                                            setEditing((prev) => ({
                                                ...prev,
                                                rückseite: e.target.value,
                                            }))
                                        }
                                    />
                                </div>
                                <div className="flex gap-2">
                                    <Button
                                        size="sm"
                                        onClick={saveEdit}
                                        disabled={isSubmitting}
                                    >
                                        <Check className="h-4 w-4" />
                                    </Button>
                                    <Button
                                        size="sm"
                                        variant="ghost"
                                        onClick={cancelEditing}
                                    >
                                        <X className="h-4 w-4" />
                                    </Button>
                                </div>
                            </div>
                        ) : (
                            <div className="flex items-start justify-between gap-4">
                                <div>
                                    <p className="font-medium">
                                        {card.vorderseite}
                                    </p>
                                    <p className="text-muted-foreground text-sm">
                                        {card.rückseite}
                                    </p>
                                </div>
                                <div className="flex gap-1">
                                    <Button
                                        size="sm"
                                        variant="ghost"
                                        onClick={() => startEditing(card)}
                                    >
                                        <Pencil className="h-4 w-4" />
                                    </Button>
                                    <Button
                                        size="sm"
                                        variant="ghost"
                                        onClick={() => handleDelete(card.id)}
                                    >
                                        <Trash2 className="h-4 w-4" />
                                    </Button>
                                </div>
                            </div>
                        )}
                    </CardContent>
                </Card>
            ))}
        </div>
    )
}
