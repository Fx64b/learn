'use client'

import {
    ITEM_TYPES,
    type ItemType,
    itemToInput,
    parseItemRow,
} from '@/lib/items'
import { cn } from '@/lib/utils'
import { FlashcardType } from '@/types'
import { Pencil, Search, Trash2 } from 'lucide-react'
import { toast } from 'sonner'

import { useMemo, useState } from 'react'

import { useTranslations } from 'next-intl'

import { deleteFlashcard, updateItem } from '@/app/actions/flashcard'

import { ItemEditor } from '@/components/items/item-editor'
import {
    ITEM_TYPE_ICONS,
    ItemTypeBadge,
} from '@/components/items/item-type-badge'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'

interface CardListProps {
    flashcards: FlashcardType[]
}

export default function CardList({ flashcards }: CardListProps) {
    const t = useTranslations('deck.cards')
    const ti = useTranslations('items.types')
    const tl = useTranslations('decks.items')
    const [editingId, setEditingId] = useState<string | null>(null)
    const [query, setQuery] = useState('')
    const [typeFilter, setTypeFilter] = useState<ItemType | null>(null)

    const items = useMemo(
        () => flashcards.map((card) => parseItemRow(card)),
        [flashcards]
    )
    const counts = useMemo(() => {
        const c = new Map<ItemType, number>()
        for (const item of items) c.set(item.type, (c.get(item.type) ?? 0) + 1)
        return c
    }, [items])
    const needle = query.trim().toLowerCase()
    const visible = items.filter(
        (item) =>
            (!typeFilter || item.type === typeFilter) &&
            (!needle ||
                item.front.toLowerCase().includes(needle) ||
                item.back.toLowerCase().includes(needle))
    )

    const handleDelete = async (id: string) => {
        if (!confirm(t('deleteConfirm'))) return

        const result = await deleteFlashcard(id)
        if (result.success) {
            toast.success(t('deleteSuccess'))
        } else {
            toast.error(t('deleteError'))
        }
    }

    if (items.length === 0) {
        return (
            <p className="text-muted-foreground rounded-2xl border-2 border-dashed p-8 text-center">
                {tl('empty')}
            </p>
        )
    }

    return (
        <div className="space-y-4">
            <div className="flex flex-col gap-3 sm:flex-row sm:items-center">
                <div className="relative flex-1">
                    <Search
                        className="text-muted-foreground pointer-events-none absolute top-1/2 left-3 size-4 -translate-y-1/2"
                        aria-hidden
                    />
                    <Input
                        value={query}
                        onChange={(e) => setQuery(e.target.value)}
                        placeholder={tl('search')}
                        aria-label={tl('search')}
                        className="pl-9"
                    />
                </div>
            </div>
            {counts.size > 1 && (
                <div className="flex flex-wrap gap-1.5">
                    <button
                        type="button"
                        onClick={() => setTypeFilter(null)}
                        className={cn(
                            'rounded-full border-2 px-3 py-1 text-xs font-semibold',
                            typeFilter === null
                                ? 'border-sky-500 bg-sky-50 text-sky-700 dark:bg-sky-950 dark:text-sky-300'
                                : 'text-muted-foreground hover:bg-accent'
                        )}
                    >
                        {tl('all', { count: items.length })}
                    </button>
                    {ITEM_TYPES.filter((type) => counts.has(type)).map(
                        (type) => {
                            const Icon = ITEM_TYPE_ICONS[type]
                            return (
                                <button
                                    key={type}
                                    type="button"
                                    onClick={() =>
                                        setTypeFilter(
                                            typeFilter === type ? null : type
                                        )
                                    }
                                    className={cn(
                                        'inline-flex items-center gap-1.5 rounded-full border-2 px-3 py-1 text-xs font-semibold',
                                        typeFilter === type
                                            ? 'border-sky-500 bg-sky-50 text-sky-700 dark:bg-sky-950 dark:text-sky-300'
                                            : 'text-muted-foreground hover:bg-accent'
                                    )}
                                >
                                    <Icon className="size-3.5" aria-hidden />
                                    {ti(type)}
                                    <span className="tabular-nums opacity-70">
                                        {counts.get(type)}
                                    </span>
                                </button>
                            )
                        }
                    )}
                </div>
            )}

            {visible.length === 0 ? (
                <p className="text-muted-foreground py-6 text-center text-sm">
                    {tl('noMatch')}
                </p>
            ) : (
                <ul className="space-y-2">
                    {visible.map((item) => (
                        <li
                            key={item.id}
                            className={cn(
                                'bg-card rounded-2xl border-2 p-4 transition-colors',
                                editingId === item.id
                                    ? 'border-sky-500'
                                    : 'hover:border-foreground/20'
                            )}
                        >
                            {editingId === item.id ? (
                                <ItemEditor
                                    initial={itemToInput(item)}
                                    submitLabel={t('save')}
                                    onCancel={() => setEditingId(null)}
                                    onSubmit={async (input) => {
                                        const result = await updateItem({
                                            id: item.id,
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
                                <div className="flex items-start gap-3">
                                    <div className="min-w-0 flex-1 space-y-1">
                                        <ItemTypeBadge
                                            type={item.type}
                                            label={ti(item.type)}
                                        />
                                        <p className="font-semibold break-words">
                                            {item.front || item.back}
                                        </p>
                                        <p className="text-muted-foreground line-clamp-2 text-sm break-words whitespace-pre-line">
                                            {item.back}
                                        </p>
                                    </div>
                                    <div className="flex shrink-0 gap-1">
                                        <Button
                                            size="icon"
                                            variant="ghost"
                                            aria-label={t('edit')}
                                            onClick={() =>
                                                setEditingId(item.id)
                                            }
                                        >
                                            <Pencil className="size-4" />
                                        </Button>
                                        <Button
                                            size="icon"
                                            variant="ghost"
                                            aria-label={t('delete')}
                                            className="hover:text-rose-600"
                                            onClick={() =>
                                                handleDelete(item.id)
                                            }
                                        >
                                            <Trash2 className="size-4" />
                                        </Button>
                                    </div>
                                </div>
                            )}
                        </li>
                    ))}
                </ul>
            )}
        </div>
    )
}
