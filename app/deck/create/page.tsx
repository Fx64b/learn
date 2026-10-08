'use client'

import { cn } from '@/lib/utils'
import { ArrowLeft, Check, ListPlus, Play, Settings2 } from 'lucide-react'
import { toast } from 'sonner'

import { useTranslations } from 'next-intl'
import Link from 'next/link'
import { useRouter } from 'next/navigation'

import { createDeck } from '@/app/actions/deck'

import { DeckForm, deckFormData } from '@/components/decks/deck-form'
import { Button } from '@/components/ui/button'

const STEPS = [
    { key: 'details', icon: Settings2 },
    { key: 'items', icon: ListPlus },
    { key: 'learn', icon: Play },
] as const

export default function CreateDeckPage() {
    const router = useRouter()
    const t = useTranslations('decks.create')

    return (
        <div className="container mx-auto max-w-5xl space-y-8 px-4 py-6 sm:py-10">
            <div className="flex items-start gap-3">
                <Button
                    variant="ghost"
                    size="icon"
                    asChild
                    aria-label={t('back')}
                >
                    <Link href="/">
                        <ArrowLeft className="size-5" />
                    </Link>
                </Button>
                <div className="space-y-1">
                    <h1 className="text-3xl font-extrabold tracking-tight">
                        {t('title')}
                    </h1>
                    <p className="text-muted-foreground">{t('subtitle')}</p>
                </div>
            </div>

            <ol className="grid grid-cols-3 gap-2">
                {STEPS.map(({ key, icon: Icon }, i) => (
                    <li
                        key={key}
                        className={cn(
                            'flex items-center gap-2 rounded-xl border-2 px-3 py-2 text-sm font-semibold',
                            i === 0
                                ? 'border-emerald-500 bg-emerald-50 text-emerald-700 dark:bg-emerald-950/60 dark:text-emerald-300'
                                : 'text-muted-foreground'
                        )}
                    >
                        <span
                            className={cn(
                                'flex size-6 shrink-0 items-center justify-center rounded-full text-xs',
                                i === 0
                                    ? 'bg-emerald-500 text-white'
                                    : 'bg-muted'
                            )}
                        >
                            {i === 0 ? <Icon className="size-3.5" /> : i + 1}
                        </span>
                        <span className="truncate">{t(`steps.${key}`)}</span>
                    </li>
                ))}
            </ol>

            <DeckForm
                submitLabel={t('submit')}
                submittingLabel={t('submitting')}
                onSubmit={async (values) => {
                    const result = await createDeck(deckFormData(values))
                    if (result.success && result.id) {
                        toast.success(t('success'), {
                            icon: <Check className="size-4" />,
                        })
                        router.push(`/deck/${result.id}/edit?new=1`)
                    } else {
                        toast.error(result.error || t('error'))
                    }
                }}
            />
        </div>
    )
}
