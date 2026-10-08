'use client'

import { toUTCDateOnly } from '@/lib/date'
import { cn } from '@/lib/utils'
import { addMonths, addWeeks, differenceInCalendarDays, format } from 'date-fns'
import { CalendarIcon, Loader2, Plus } from 'lucide-react'

import type * as React from 'react'
import { useState } from 'react'

import { useTranslations } from 'next-intl'

import { MasteryBar } from '@/components/gamification/mastery-bar'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Calendar } from '@/components/ui/calendar'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import {
    Popover,
    PopoverContent,
    PopoverTrigger,
} from '@/components/ui/popover'
import { TagInput } from '@/components/ui/tag-input'
import { Textarea } from '@/components/ui/textarea'

export interface DeckFormValues {
    title: string
    description: string
    tags: string[]
    activeUntil: Date | null
}

interface DeckFormProps {
    initial?: Partial<DeckFormValues>
    submitLabel: string
    submittingLabel: string
    onSubmit: (values: DeckFormValues) => Promise<void>
    /** Extra buttons next to submit (e.g. export). */
    actions?: React.ReactNode
    itemCount?: number
}

export const MAX_TITLE = 100
export const MAX_DESCRIPTION = 500

const TAG_SUGGESTIONS = [
    'languages',
    'math',
    'science',
    'history',
    'geography',
    'medicine',
    'law',
    'programming',
] as const

function startOfToday() {
    const d = new Date()
    d.setHours(0, 0, 0, 0)
    return d
}

/** Deck details form with a live preview of the deck card. */
export function DeckForm({
    initial,
    submitLabel,
    submittingLabel,
    onSubmit,
    actions,
    itemCount = 0,
}: DeckFormProps) {
    const t = useTranslations('decks.form')
    const [values, setValues] = useState<DeckFormValues>({
        title: initial?.title ?? '',
        description: initial?.description ?? '',
        tags: initial?.tags ?? [],
        activeUntil: initial?.activeUntil ?? null,
    })
    const [saving, setSaving] = useState(false)
    const [calendarOpen, setCalendarOpen] = useState(false)

    const set = <K extends keyof DeckFormValues>(
        key: K,
        value: DeckFormValues[K]
    ) => setValues((prev) => ({ ...prev, [key]: value }))

    const today = startOfToday()
    const daysLeft = values.activeUntil
        ? differenceInCalendarDays(values.activeUntil, today)
        : null
    const quickDates = [
        { key: 'week', date: addWeeks(today, 1) },
        { key: 'month', date: addMonths(today, 1) },
        { key: 'threeMonths', date: addMonths(today, 3) },
    ] as const
    const suggestions = TAG_SUGGESTIONS.map((key) => t(`suggestions.${key}`))
        .filter((tag) => !values.tags.includes(tag))
        .slice(0, 6)

    async function submit(e: React.FormEvent) {
        e.preventDefault()
        if (!values.title.trim()) return
        setSaving(true)
        try {
            await onSubmit({ ...values, title: values.title.trim() })
        } finally {
            setSaving(false)
        }
    }

    return (
        <form
            onSubmit={submit}
            className="grid items-start gap-6 lg:grid-cols-[1fr_20rem]"
        >
            <div className="bg-card min-w-0 space-y-6 rounded-2xl border-2 border-b-4 p-5 sm:p-6">
                <div className="space-y-2">
                    <Label htmlFor="deck-title" className="text-base font-bold">
                        {t('title')}
                    </Label>
                    <Input
                        id="deck-title"
                        value={values.title}
                        onChange={(e) => set('title', e.target.value)}
                        maxLength={MAX_TITLE}
                        placeholder={t('titlePlaceholder')}
                        required
                        autoFocus={!initial?.title}
                        className="h-12 text-lg font-semibold md:text-lg"
                    />
                </div>

                <div className="space-y-2">
                    <div className="flex items-baseline justify-between">
                        <Label htmlFor="deck-description" className="font-bold">
                            {t('description')}
                        </Label>
                        <span className="text-muted-foreground text-xs tabular-nums">
                            {values.description.length}/{MAX_DESCRIPTION}
                        </span>
                    </div>
                    <Textarea
                        id="deck-description"
                        value={values.description}
                        onChange={(e) => set('description', e.target.value)}
                        maxLength={MAX_DESCRIPTION}
                        placeholder={t('descriptionPlaceholder')}
                        className="min-h-24"
                    />
                </div>

                <div className="space-y-2">
                    <Label htmlFor="deck-tags" className="font-bold">
                        {t('tags')}
                    </Label>
                    <TagInput
                        id="deck-tags"
                        tags={values.tags}
                        onChange={(tags) => set('tags', tags.slice(0, 10))}
                        placeholder={t('tagsPlaceholder')}
                    />
                    {suggestions.length > 0 && (
                        <div className="flex flex-wrap items-center gap-1.5">
                            <span className="text-muted-foreground text-xs">
                                {t('suggested')}
                            </span>
                            {suggestions.map((tag) => (
                                <button
                                    key={tag}
                                    type="button"
                                    onClick={() =>
                                        set('tags', [...values.tags, tag])
                                    }
                                    className="hover:bg-accent text-muted-foreground inline-flex items-center gap-1 rounded-full border px-2 py-0.5 text-xs"
                                >
                                    <Plus className="size-3" />
                                    {tag}
                                </button>
                            ))}
                        </div>
                    )}
                </div>

                <div className="space-y-2">
                    <Label className="font-bold">{t('deadline')}</Label>
                    <p className="text-muted-foreground text-xs">
                        {t('deadlineHint')}
                    </p>
                    <div className="flex flex-wrap gap-2">
                        <Button
                            type="button"
                            size="sm"
                            variant={
                                values.activeUntil ? 'outline' : 'secondary'
                            }
                            onClick={() => set('activeUntil', null)}
                        >
                            {t('noDeadline')}
                        </Button>
                        {quickDates.map(({ key, date }) => (
                            <Button
                                key={key}
                                type="button"
                                size="sm"
                                variant={
                                    values.activeUntil &&
                                    differenceInCalendarDays(
                                        values.activeUntil,
                                        date
                                    ) === 0
                                        ? 'secondary'
                                        : 'outline'
                                }
                                onClick={() => set('activeUntil', date)}
                            >
                                {t(`quick.${key}`)}
                            </Button>
                        ))}
                        <Popover
                            open={calendarOpen}
                            onOpenChange={setCalendarOpen}
                        >
                            <PopoverTrigger asChild>
                                <Button
                                    type="button"
                                    size="sm"
                                    variant="outline"
                                >
                                    <CalendarIcon />
                                    {values.activeUntil
                                        ? format(
                                              values.activeUntil,
                                              'dd.MM.yyyy'
                                          )
                                        : t('pickDate')}
                                </Button>
                            </PopoverTrigger>
                            <PopoverContent
                                className="w-auto p-0"
                                align="start"
                            >
                                <Calendar
                                    mode="single"
                                    selected={values.activeUntil ?? undefined}
                                    disabled={(date) => date < today}
                                    onSelect={(date) => {
                                        set('activeUntil', date ?? null)
                                        setCalendarOpen(false)
                                    }}
                                />
                            </PopoverContent>
                        </Popover>
                    </div>
                    {daysLeft !== null && (
                        <p className="text-sm font-semibold text-sky-600 dark:text-sky-400">
                            {daysLeft < 0
                                ? t('deadlinePast')
                                : t('daysLeft', { count: daysLeft })}
                        </p>
                    )}
                </div>

                <div className="flex flex-col-reverse gap-2 border-t-2 pt-5 sm:flex-row sm:items-center sm:justify-end">
                    {actions}
                    <Button
                        type="submit"
                        size="lg"
                        disabled={saving || !values.title.trim()}
                        className="border-b-4 border-emerald-700 bg-emerald-500 font-bold text-white hover:bg-emerald-500/90 active:translate-y-0.5 active:border-b-2"
                    >
                        {saving && <Loader2 className="animate-spin" />}
                        {saving ? submittingLabel : submitLabel}
                    </Button>
                </div>
            </div>

            <aside className="min-w-0 space-y-2 lg:sticky lg:top-6">
                <p className="text-muted-foreground text-xs font-bold tracking-widest uppercase">
                    {t('preview')}
                </p>
                <div className="bg-card space-y-3 rounded-2xl border-2 border-b-4 p-5">
                    <p
                        className={cn(
                            'text-lg leading-tight font-bold break-words',
                            !values.title.trim() && 'text-muted-foreground'
                        )}
                    >
                        {values.title.trim() || t('titlePlaceholder')}
                    </p>
                    {values.description && (
                        <p className="text-muted-foreground line-clamp-3 text-sm break-words">
                            {values.description}
                        </p>
                    )}
                    {values.tags.length > 0 && (
                        <div className="flex flex-wrap gap-1">
                            {values.tags.map((tag) => (
                                <Badge key={tag} variant="secondary">
                                    {tag}
                                </Badge>
                            ))}
                        </div>
                    )}
                    <MasteryBar
                        counts={{
                            new: Math.max(1, itemCount),
                            learning: 0,
                            familiar: 0,
                            mastered: 0,
                        }}
                    />
                    <div className="text-muted-foreground flex justify-between text-xs">
                        <span>{t('items', { count: itemCount })}</span>
                        {values.activeUntil && (
                            <span>
                                {t('until', {
                                    date: format(
                                        values.activeUntil,
                                        'dd.MM.yyyy'
                                    ),
                                })}
                            </span>
                        )}
                    </div>
                </div>
            </aside>
        </form>
    )
}

/** FormData as expected by the createDeck / updateDeck actions. */
export function deckFormData(values: DeckFormValues, id?: string) {
    const data = new FormData()
    if (id) data.append('id', id)
    data.append('title', values.title)
    data.append('description', values.description)
    data.append('category', JSON.stringify(values.tags))
    if (values.activeUntil) {
        data.append(
            'activeUntil',
            toUTCDateOnly(values.activeUntil).toISOString()
        )
    }
    return data
}
