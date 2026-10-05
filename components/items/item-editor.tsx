'use client'

import {
    ITEM_TYPES,
    type ItemInput,
    type ItemType,
    itemInputSchema,
    parseItemRow,
    toItemRow,
} from '@/lib/items'
import { type Mastery, planExercise } from '@/lib/learn'
import { cn } from '@/lib/utils'
import { Eye, EyeOff, Plus, Trash2 } from 'lucide-react'

import type * as React from 'react'
import { useMemo, useState } from 'react'

import { useTranslations } from 'next-intl'

import { ExerciseRenderer } from '@/components/learn/session/exercise-renderer'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'

import { DiagramEditor } from './diagram-editor'
import {
    type ItemFormState,
    emptyFormState,
    formToInput,
    inputToForm,
} from './item-form-state'
import { ITEM_TYPE_ICONS } from './item-type-badge'

interface ItemEditorProps {
    initial?: ItemInput
    submitLabel: string
    /** Returns true when saved; a new item form is then cleared. */
    onSubmit: (item: ItemInput) => Promise<boolean>
    onCancel?: () => void
}

function Field({
    label,
    hint,
    children,
    htmlFor,
}: {
    label: string
    hint?: string
    htmlFor?: string
    children: React.ReactNode
}) {
    return (
        <div className="space-y-1.5">
            <Label htmlFor={htmlFor}>{label}</Label>
            {children}
            {hint && <p className="text-muted-foreground text-xs">{hint}</p>}
        </div>
    )
}

const PREVIEW_STAGES: Mastery[] = ['new', 'learning', 'mastered']

/** Create or edit an item of any type, with a live exercise preview. */
export function ItemEditor({
    initial,
    submitLabel,
    onSubmit,
    onCancel,
}: ItemEditorProps) {
    const t = useTranslations('items')
    const [type, setType] = useState<ItemType>(initial?.type ?? 'basic')
    const [form, setForm] = useState<ItemFormState>(() =>
        initial ? inputToForm(initial) : emptyFormState()
    )
    const [error, setError] = useState<string | null>(null)
    const [saving, setSaving] = useState(false)
    const [preview, setPreview] = useState<Mastery | null>(null)
    const [previewRun, setPreviewRun] = useState(0)

    const set = <K extends keyof ItemFormState>(
        key: K,
        value: ItemFormState[K]
    ) => {
        setForm((prev) => ({ ...prev, [key]: value }))
        setError(null)
    }

    const parsed = useMemo(
        () => itemInputSchema.safeParse(formToInput(type, form)),
        [type, form]
    )

    const previewExercise = useMemo(() => {
        if (!preview || !parsed.success) return null
        const row = toItemRow(parsed.data)
        if (!row.success) return null
        const item = parseItemRow({
            id: 'preview',
            deckId: 'preview',
            ...row.data,
        })
        return planExercise(item, preview, { rng: Math.random, pool: [] })
        // previewRun re-plans the preview (new shuffle) on demand
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [preview, parsed, previewRun])

    async function submit(e: React.FormEvent) {
        e.preventDefault()
        if (!parsed.success) {
            const issue = parsed.error.issues[0]
            setError(
                t('editor.invalid', {
                    field: issue.path.slice(-1).join('') || type,
                    message: issue.message,
                })
            )
            return
        }
        setSaving(true)
        try {
            const ok = await onSubmit(parsed.data)
            if (ok && !initial) {
                setForm(emptyFormState())
                setPreview(null)
            }
        } finally {
            setSaving(false)
        }
    }

    const promptLabel =
        type === 'basic' ? t('editor.question') : t('editor.prompt')
    const promptOptional = type === 'cloze' || type === 'pairs'

    return (
        <form onSubmit={submit} className="space-y-5">
            <div className="space-y-1.5">
                <Label>{t('editor.type')}</Label>
                <div className="grid grid-cols-3 gap-2 sm:grid-cols-5">
                    {ITEM_TYPES.map((it) => {
                        const Icon = ITEM_TYPE_ICONS[it]
                        return (
                            <button
                                key={it}
                                type="button"
                                onClick={() => {
                                    setType(it)
                                    setError(null)
                                    setPreview(null)
                                }}
                                aria-pressed={type === it}
                                className={cn(
                                    'focus-visible:ring-ring/50 flex flex-col items-center gap-1 rounded-xl border-2 p-2 text-xs font-medium transition-colors outline-none focus-visible:ring-[3px]',
                                    type === it
                                        ? 'border-sky-500 bg-sky-50 text-sky-700 dark:bg-sky-950 dark:text-sky-300'
                                        : 'hover:bg-accent'
                                )}
                            >
                                <Icon className="size-5" aria-hidden />
                                {t(`types.${it}`)}
                            </button>
                        )
                    })}
                </div>
                <p className="text-muted-foreground text-xs">
                    {t(`descriptions.${type}`)}
                </p>
            </div>

            <Field
                label={
                    promptOptional
                        ? `${promptLabel} (${t('editor.optional')})`
                        : promptLabel
                }
                htmlFor="item-front"
            >
                <Input
                    id="item-front"
                    value={form.front}
                    onChange={(e) => set('front', e.target.value)}
                    placeholder={t(`placeholders.${type}`)}
                />
            </Field>

            {type === 'basic' && (
                <>
                    <Field label={t('editor.answer')} htmlFor="item-back">
                        <Textarea
                            id="item-back"
                            value={form.back}
                            onChange={(e) => set('back', e.target.value)}
                            className="min-h-24"
                        />
                    </Field>
                    <Field
                        label={`${t('editor.accept')} (${t('editor.optional')})`}
                        hint={t('editor.acceptHint')}
                        htmlFor="item-accept"
                    >
                        <Input
                            id="item-accept"
                            value={form.accept}
                            onChange={(e) => set('accept', e.target.value)}
                        />
                    </Field>
                </>
            )}

            {type === 'choice' && (
                <Field
                    label={t('editor.options')}
                    hint={t('editor.optionsHint')}
                >
                    <div className="space-y-2">
                        {form.options.map((option, i) => (
                            <div key={i} className="flex items-center gap-2">
                                <input
                                    type="checkbox"
                                    className="size-5 accent-emerald-500"
                                    checked={option.correct}
                                    aria-label={t('editor.correct')}
                                    onChange={(e) =>
                                        set(
                                            'options',
                                            form.options.map((o, j) =>
                                                j === i
                                                    ? {
                                                          ...o,
                                                          correct:
                                                              e.target.checked,
                                                      }
                                                    : o
                                            )
                                        )
                                    }
                                />
                                <Input
                                    value={option.text}
                                    aria-label={t('editor.option', {
                                        n: i + 1,
                                    })}
                                    onChange={(e) =>
                                        set(
                                            'options',
                                            form.options.map((o, j) =>
                                                j === i
                                                    ? {
                                                          ...o,
                                                          text: e.target.value,
                                                      }
                                                    : o
                                            )
                                        )
                                    }
                                />
                                <Button
                                    type="button"
                                    variant="ghost"
                                    size="icon"
                                    disabled={form.options.length <= 2}
                                    aria-label={t('editor.remove')}
                                    onClick={() =>
                                        set(
                                            'options',
                                            form.options.filter(
                                                (_, j) => j !== i
                                            )
                                        )
                                    }
                                >
                                    <Trash2 />
                                </Button>
                            </div>
                        ))}
                        {form.options.length < 8 && (
                            <Button
                                type="button"
                                variant="outline"
                                size="sm"
                                onClick={() =>
                                    set('options', [
                                        ...form.options,
                                        { text: '', correct: false },
                                    ])
                                }
                            >
                                <Plus />
                                {t('editor.addOption')}
                            </Button>
                        )}
                    </div>
                </Field>
            )}

            {type === 'cloze' && (
                <>
                    <Field
                        label={t('editor.clozeText')}
                        hint={t('editor.clozeHint')}
                        htmlFor="item-cloze"
                    >
                        <Textarea
                            id="item-cloze"
                            value={form.cloze}
                            onChange={(e) => set('cloze', e.target.value)}
                            placeholder={t('editor.clozePlaceholder')}
                            className="min-h-24"
                        />
                    </Field>
                    <Field
                        label={`${t('editor.distractors')} (${t('editor.optional')})`}
                        hint={t('editor.distractorsHint')}
                        htmlFor="item-distractors"
                    >
                        <Input
                            id="item-distractors"
                            value={form.distractors}
                            onChange={(e) => set('distractors', e.target.value)}
                        />
                    </Field>
                </>
            )}

            {type === 'passage' && (
                <Field
                    label={t('editor.passage')}
                    hint={t('editor.passageHint')}
                    htmlFor="item-passage"
                >
                    <Textarea
                        id="item-passage"
                        value={form.passage}
                        onChange={(e) => set('passage', e.target.value)}
                        className="min-h-32"
                    />
                </Field>
            )}

            {(type === 'list' || type === 'sequence') && (
                <Field
                    label={
                        type === 'list'
                            ? t('editor.listItems')
                            : t('editor.sequenceItems')
                    }
                    hint={
                        type === 'list'
                            ? t('editor.listHint')
                            : t('editor.sequenceHint')
                    }
                    htmlFor="item-lines"
                >
                    <Textarea
                        id="item-lines"
                        value={form.lines}
                        onChange={(e) => set('lines', e.target.value)}
                        className="min-h-40 font-mono text-sm"
                    />
                </Field>
            )}

            {type === 'sequence' && (
                <div className="grid gap-3 sm:grid-cols-2">
                    <Field
                        label={`${t('editor.endStart')} (${t('editor.optional')})`}
                        htmlFor="item-end-start"
                    >
                        <Input
                            id="item-end-start"
                            value={form.endStart}
                            onChange={(e) => set('endStart', e.target.value)}
                            placeholder={t('editor.endStartPlaceholder')}
                        />
                    </Field>
                    <Field
                        label={`${t('editor.endEnd')} (${t('editor.optional')})`}
                        htmlFor="item-end-end"
                    >
                        <Input
                            id="item-end-end"
                            value={form.endEnd}
                            onChange={(e) => set('endEnd', e.target.value)}
                            placeholder={t('editor.endEndPlaceholder')}
                        />
                    </Field>
                </div>
            )}

            {type === 'number' && (
                <div className="grid gap-3 sm:grid-cols-3">
                    <Field label={t('editor.value')} htmlFor="item-value">
                        <Input
                            id="item-value"
                            inputMode="decimal"
                            value={form.value}
                            onChange={(e) => set('value', e.target.value)}
                        />
                    </Field>
                    <Field
                        label={`${t('editor.tolerance')} (${t('editor.optional')})`}
                        hint={t('editor.toleranceHint')}
                        htmlFor="item-tolerance"
                    >
                        <Input
                            id="item-tolerance"
                            inputMode="decimal"
                            value={form.tolerance}
                            onChange={(e) => set('tolerance', e.target.value)}
                        />
                    </Field>
                    <Field
                        label={`${t('editor.unit')} (${t('editor.optional')})`}
                        htmlFor="item-unit"
                    >
                        <Input
                            id="item-unit"
                            value={form.unit}
                            onChange={(e) => set('unit', e.target.value)}
                        />
                    </Field>
                </div>
            )}

            {type === 'pairs' && (
                <Field label={t('editor.pairs')}>
                    <div className="space-y-2">
                        {form.pairs.map((pair, i) => (
                            <div key={i} className="flex items-center gap-2">
                                <Input
                                    value={pair.left}
                                    aria-label={t('editor.left', { n: i + 1 })}
                                    onChange={(e) =>
                                        set(
                                            'pairs',
                                            form.pairs.map((p, j) =>
                                                j === i
                                                    ? {
                                                          ...p,
                                                          left: e.target.value,
                                                      }
                                                    : p
                                            )
                                        )
                                    }
                                />
                                <span className="text-muted-foreground">–</span>
                                <Input
                                    value={pair.right}
                                    aria-label={t('editor.right', { n: i + 1 })}
                                    onChange={(e) =>
                                        set(
                                            'pairs',
                                            form.pairs.map((p, j) =>
                                                j === i
                                                    ? {
                                                          ...p,
                                                          right: e.target.value,
                                                      }
                                                    : p
                                            )
                                        )
                                    }
                                />
                                <Button
                                    type="button"
                                    variant="ghost"
                                    size="icon"
                                    disabled={form.pairs.length <= 2}
                                    aria-label={t('editor.remove')}
                                    onClick={() =>
                                        set(
                                            'pairs',
                                            form.pairs.filter((_, j) => j !== i)
                                        )
                                    }
                                >
                                    <Trash2 />
                                </Button>
                            </div>
                        ))}
                        {form.pairs.length < 10 && (
                            <Button
                                type="button"
                                variant="outline"
                                size="sm"
                                onClick={() =>
                                    set('pairs', [
                                        ...form.pairs,
                                        { left: '', right: '' },
                                    ])
                                }
                            >
                                <Plus />
                                {t('editor.addPair')}
                            </Button>
                        )}
                    </div>
                </Field>
            )}

            {type === 'diagram' && (
                <DiagramEditor
                    image={form.image}
                    alt={form.alt}
                    labels={form.labels}
                    distractors={form.distractors}
                    onChange={(patch) => {
                        setForm((prev) => ({ ...prev, ...patch }))
                        setError(null)
                    }}
                />
            )}

            {error && (
                <p
                    role="alert"
                    className="text-sm text-rose-600 dark:text-rose-400"
                >
                    {error}
                </p>
            )}

            <div className="flex flex-wrap items-center gap-2">
                <Button type="submit" disabled={saving}>
                    {submitLabel}
                </Button>
                {onCancel && (
                    <Button type="button" variant="ghost" onClick={onCancel}>
                        {t('editor.cancel')}
                    </Button>
                )}
                <Button
                    type="button"
                    variant="outline"
                    className="ml-auto"
                    disabled={!parsed.success}
                    onClick={() => setPreview(preview ? null : 'new')}
                >
                    {preview ? <EyeOff /> : <Eye />}
                    {preview ? t('editor.hidePreview') : t('editor.preview')}
                </Button>
            </div>

            {preview && previewExercise && (
                <div className="space-y-3 rounded-2xl border-2 border-dashed p-3">
                    <div className="flex flex-wrap items-center gap-2 text-sm">
                        <span className="text-muted-foreground">
                            {t('editor.previewAs')}
                        </span>
                        {PREVIEW_STAGES.map((stage) => (
                            <Button
                                key={stage}
                                type="button"
                                size="sm"
                                variant={
                                    preview === stage ? 'secondary' : 'ghost'
                                }
                                onClick={() => {
                                    setPreview(stage)
                                    setPreviewRun((r) => r + 1)
                                }}
                            >
                                {t(`editor.stage.${stage}`)}
                            </Button>
                        ))}
                    </div>
                    <ExerciseRenderer
                        key={`${previewRun}-${preview}`}
                        exercise={previewExercise}
                        onResult={() => {}}
                        onContinue={() => setPreviewRun((r) => r + 1)}
                    />
                </div>
            )}
        </form>
    )
}
