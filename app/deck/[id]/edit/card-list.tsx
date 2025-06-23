'use client'

import { FlashcardType } from '@/types'
import { Check, Pencil, Trash2, X } from 'lucide-react'
import { toast } from 'sonner'

import { useState } from 'react'

import { useTranslations } from 'next-intl'

import { deleteFlashcard, updateFlashcard } from '@/app/actions/flashcard'

import { Button } from '@/components/ui/button'
import { Card, CardContent } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { Textarea } from '@/components/ui/textarea'

interface CardListProps {
    flashcards: FlashcardType[]
}

interface EditingState {
    id: string | null
    front: string
    back: string
}

export default function CardList({ flashcards }: CardListProps) {
    const t = useTranslations('deck.cards')
    const [editing, setEditing] = useState<EditingState>({
        id: null,
        front: '',
        back: '',
    })
    const [isSubmitting, setIsSubmitting] = useState(false)

    const startEditing = (card: FlashcardType) => {
        setEditing({
            id: card.id,
            front: card.front,
            back: card.back,
        })
    }

    const cancelEditing = () => {
        setEditing({ id: null, front: '', back: '' })
    }

    const saveEdit = async () => {
        if (!editing.id) return

        setIsSubmitting(true)
        const result = await updateFlashcard({
            id: editing.id,
            front: editing.front,
            back: editing.back,
            isExamRelevant: true, // Default to true, this is not implemented yet
        })

        if (result.success) {
            toast.success(t('updateSuccess'))
            cancelEditing()
        } else {
            toast.error(t('updateError'))
        }
        setIsSubmitting(false)
    }

    const handleDelete = async (id: string) => {
        if (!confirm(t('deleteConfirm'))) return

        const result = await deleteFlashcard(id)
        if (result.success) {
            toast.success(t('deleteSuccess'))
        } else {
            toast.error(t('deleteError'))
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
                                        {t('frontSide')}
                                    </label>
                                    <Input
                                        value={editing.front}
                                        onChange={(e) =>
                                            setEditing((prev) => ({
                                                ...prev,
                                                front: e.target.value,
                                            }))
                                        }
                                    />
                                </div>
                                <div>
                                    <label className="block text-sm font-medium">
                                        {t('backSide')}
                                    </label>
                                    <Textarea
                                        value={editing.back}
                                        onChange={(e) =>
                                            setEditing((prev) => ({
                                                ...prev,
                                                back: e.target.value,
                                            }))
                                        }
                                        placeholder={t('backPlaceholder')}
                                        className="h-56 w-full rounded border p-2"
                                        required
                                    />
                                </div>
                                <div className="flex gap-2">
                                    <Button
                                        size="default"
                                        onClick={saveEdit}
                                        disabled={isSubmitting}
                                    >
                                        <Check className="h-4 w-4" />
                                    </Button>
                                    <Button
                                        size="default"
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
                                    <p className="font-medium">{card.front}</p>
                                    <p className="text-muted-foreground text-sm">
                                        {card.back}
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
