'use client'

import { itemToInput, parseItemRow } from '@/lib/items'
import { FlashcardType } from '@/types'
import { Pencil, Trash2 } from 'lucide-react'
import { toast } from 'sonner'

import { useState } from 'react'

import { useTranslations } from 'next-intl'

import { deleteFlashcard, updateItem } from '@/app/actions/flashcard'

import { ItemEditor } from '@/components/items/item-editor'
import { ItemTypeBadge } from '@/components/items/item-type-badge'
import { Button } from '@/components/ui/button'
import { Card, CardContent } from '@/components/ui/card'

interface CardListProps {
    flashcards: FlashcardType[]
}

export default function CardList({ flashcards }: CardListProps) {
    const t = useTranslations('deck.cards')
    const ti = useTranslations('items.types')
    const [editingId, setEditingId] = useState<string | null>(null)

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
            {flashcards.map((card) => {
                const item = parseItemRow(card)
                return (
                    <Card key={card.id}>
                        <CardContent className="pt-6">
                            {editingId === card.id ? (
                                <ItemEditor
                                    initial={itemToInput(item)}
                                    submitLabel={t('save')}
                                    onCancel={() => setEditingId(null)}
                                    onSubmit={async (input) => {
                                        const result = await updateItem({
                                            id: card.id,
                                            item: input,
                                        })
                                        if (result.success) {
                                            toast.success(t('updateSuccess'))
                                            setEditingId(null)
                                            return true
                                        }
                                        toast.error(
                                            result.error || t('updateError')
                                        )
                                        return false
                                    }}
                                />
                            ) : (
                                <div className="flex items-start justify-between gap-4">
                                    <div className="min-w-0 space-y-1">
                                        <ItemTypeBadge
                                            type={item.type}
                                            label={ti(item.type)}
                                        />
                                        <p className="font-medium break-words">
                                            {item.front || item.back}
                                        </p>
                                        <p className="text-muted-foreground line-clamp-3 text-sm break-words whitespace-pre-line">
                                            {item.back}
                                        </p>
                                    </div>
                                    <div className="flex shrink-0 gap-1">
                                        <Button
                                            size="sm"
                                            variant="ghost"
                                            aria-label={t('edit')}
                                            onClick={() =>
                                                setEditingId(card.id)
                                            }
                                        >
                                            <Pencil className="h-4 w-4" />
                                        </Button>
                                        <Button
                                            size="sm"
                                            variant="ghost"
                                            aria-label={t('delete')}
                                            onClick={() =>
                                                handleDelete(card.id)
                                            }
                                        >
                                            <Trash2 className="h-4 w-4" />
                                        </Button>
                                    </div>
                                </div>
                            )}
                        </CardContent>
                    </Card>
                )
            })}
        </div>
    )
}
