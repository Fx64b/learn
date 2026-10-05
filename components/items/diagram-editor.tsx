'use client'

import { cn } from '@/lib/utils'
import { ImageUp, Loader2, Trash2 } from 'lucide-react'
import { toast } from 'sonner'

import { useRef, useState } from 'react'

import { useTranslations } from 'next-intl'

import type { DiagramLabel } from '@/components/learn/label-diagram'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'

interface DiagramEditorProps {
    image: string
    alt: string
    labels: DiagramLabel[]
    distractors: string
    onChange: (patch: {
        image?: string
        alt?: string
        labels?: DiagramLabel[]
        distractors?: string
    }) => void
}

const round = (n: number) => Math.round(n * 100) / 100

/** Upload an image and click on it to place labelled markers. */
export function DiagramEditor({
    image,
    alt,
    labels,
    distractors,
    onChange,
}: DiagramEditorProps) {
    const t = useTranslations('items.diagram')
    const [uploading, setUploading] = useState(false)
    const fileInput = useRef<HTMLInputElement>(null)

    async function upload(file: File) {
        setUploading(true)
        try {
            const body = new FormData()
            body.append('file', file)
            const res = await fetch('/api/upload', { method: 'POST', body })
            const data = (await res.json()) as { url?: string; error?: string }
            if (!res.ok || !data.url)
                throw new Error(data.error ?? res.statusText)
            onChange({ image: data.url, labels: [] })
        } catch (error) {
            toast.error(
                t('uploadError', {
                    message: error instanceof Error ? error.message : '',
                })
            )
        } finally {
            setUploading(false)
        }
    }

    function place(e: React.MouseEvent<HTMLDivElement>) {
        if (labels.length >= 20) return
        const rect = e.currentTarget.getBoundingClientRect()
        const x = round(((e.clientX - rect.left) / rect.width) * 100)
        const y = round(((e.clientY - rect.top) / rect.height) * 100)
        onChange({ labels: [...labels, { label: '', x, y }] })
    }

    const update = (i: number, patch: Partial<DiagramLabel>) =>
        onChange({
            labels: labels.map((l, j) => (j === i ? { ...l, ...patch } : l)),
        })

    return (
        <div className="space-y-4">
            <input
                ref={fileInput}
                type="file"
                accept="image/png,image/jpeg,image/webp"
                className="hidden"
                onChange={(e) => {
                    const file = e.target.files?.[0]
                    if (file) void upload(file)
                    e.target.value = ''
                }}
            />
            {image ? (
                <div className="space-y-2">
                    <div
                        onClick={place}
                        className="relative cursor-crosshair overflow-hidden rounded-xl border-2 select-none"
                    >
                        {/* eslint-disable-next-line @next/next/no-img-element -- user upload of unknown size */}
                        <img
                            src={image}
                            alt={alt}
                            draggable={false}
                            className="block w-full"
                        />
                        {labels.map((l, i) => (
                            <span
                                key={i}
                                className="absolute flex size-7 -translate-x-1/2 -translate-y-1/2 items-center justify-center rounded-full border-2 border-white bg-sky-500 text-xs font-bold text-white shadow-md"
                                style={{ left: `${l.x}%`, top: `${l.y}%` }}
                            >
                                {i + 1}
                            </span>
                        ))}
                    </div>
                    <div className="flex flex-wrap items-center justify-between gap-2">
                        <p className="text-muted-foreground text-xs">
                            {t('clickHint')}
                        </p>
                        <Button
                            type="button"
                            variant="outline"
                            size="sm"
                            disabled={uploading}
                            onClick={() => fileInput.current?.click()}
                        >
                            {uploading ? (
                                <Loader2 className="animate-spin" />
                            ) : (
                                <ImageUp />
                            )}
                            {t('replace')}
                        </Button>
                    </div>
                </div>
            ) : (
                <button
                    type="button"
                    disabled={uploading}
                    onClick={() => fileInput.current?.click()}
                    className="hover:bg-accent text-muted-foreground flex w-full flex-col items-center gap-2 rounded-xl border-2 border-dashed p-8 text-sm"
                >
                    {uploading ? (
                        <Loader2 className="size-8 animate-spin" />
                    ) : (
                        <ImageUp className="size-8" />
                    )}
                    {t('upload')}
                    <span className="text-xs">{t('uploadHint')}</span>
                </button>
            )}

            {labels.length > 0 && (
                <ol className="space-y-2">
                    {labels.map((l, i) => (
                        <li key={i} className="flex items-center gap-2">
                            <span className="w-6 text-right text-sm font-bold tabular-nums">
                                {i + 1}
                            </span>
                            <Input
                                value={l.label}
                                placeholder={t('labelPlaceholder')}
                                aria-label={t('label', { n: i + 1 })}
                                onChange={(e) =>
                                    update(i, { label: e.target.value })
                                }
                            />
                            <Button
                                type="button"
                                variant="ghost"
                                size="sm"
                                className={cn('shrink-0 text-xs')}
                                onClick={() =>
                                    update(i, {
                                        tag:
                                            l.tag === 'above'
                                                ? 'below'
                                                : 'above',
                                    })
                                }
                            >
                                {l.tag === 'above' ? t('above') : t('below')}
                            </Button>
                            <Button
                                type="button"
                                variant="ghost"
                                size="icon"
                                aria-label={t('remove')}
                                onClick={() =>
                                    onChange({
                                        labels: labels.filter(
                                            (_, j) => j !== i
                                        ),
                                    })
                                }
                            >
                                <Trash2 />
                            </Button>
                        </li>
                    ))}
                </ol>
            )}

            {image && (
                <div className="grid gap-3 sm:grid-cols-2">
                    <div className="space-y-1.5">
                        <Label htmlFor="diagram-alt">{t('alt')}</Label>
                        <Input
                            id="diagram-alt"
                            value={alt}
                            onChange={(e) => onChange({ alt: e.target.value })}
                        />
                    </div>
                    <div className="space-y-1.5">
                        <Label htmlFor="diagram-distractors">
                            {t('distractors')}
                        </Label>
                        <Input
                            id="diagram-distractors"
                            value={distractors}
                            onChange={(e) =>
                                onChange({ distractors: e.target.value })
                            }
                        />
                    </div>
                </div>
            )}
        </div>
    )
}
