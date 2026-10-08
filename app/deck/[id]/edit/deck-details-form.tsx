'use client'

import { parseCategoryToTags } from '@/lib/category-parser'
import { fromUTCDateOnly } from '@/lib/date'
import type { DeckType } from '@/types'
import {
    AlertTriangle,
    Check,
    Copy,
    Download,
    Loader2,
    RotateCcw,
    Trash2,
} from 'lucide-react'
import { toast } from 'sonner'

import { useState } from 'react'

import { useTranslations } from 'next-intl'
import { useRouter } from 'next/navigation'

import { deleteDeck, resetDeckProgress, updateDeck } from '@/app/actions/deck'
import { getExportableFlashcards } from '@/app/actions/export'

import { DeckForm, deckFormData } from '@/components/decks/deck-form'
import {
    AlertDialog,
    AlertDialogAction,
    AlertDialogCancel,
    AlertDialogContent,
    AlertDialogDescription,
    AlertDialogFooter,
    AlertDialogHeader,
    AlertDialogTitle,
    AlertDialogTrigger,
} from '@/components/ui/alert-dialog'
import { Button } from '@/components/ui/button'
import {
    Dialog,
    DialogContent,
    DialogDescription,
    DialogFooter,
    DialogHeader,
    DialogTitle,
} from '@/components/ui/dialog'

interface DeckDetailsFormProps {
    deck: DeckType
    itemCount: number
}

type ExportData = Awaited<ReturnType<typeof getExportableFlashcards>>

function ConfirmAction({
    title,
    description,
    button,
    busyLabel,
    busy,
    icon,
    onConfirm,
}: {
    title: string
    description: string
    button: string
    busyLabel: string
    busy: boolean
    icon: React.ReactNode
    onConfirm: () => void
}) {
    const common = useTranslations('common')
    return (
        <AlertDialog>
            <AlertDialogTrigger asChild>
                <Button
                    type="button"
                    variant="outline"
                    disabled={busy}
                    className="justify-start border-rose-300 text-rose-600 hover:bg-rose-50 hover:text-rose-700 dark:border-rose-900 dark:hover:bg-rose-950"
                >
                    {busy ? <Loader2 className="animate-spin" /> : icon}
                    {busy ? busyLabel : button}
                </Button>
            </AlertDialogTrigger>
            <AlertDialogContent>
                <AlertDialogHeader>
                    <AlertDialogTitle className="flex items-center gap-2">
                        <AlertTriangle className="size-5 text-rose-500" />
                        {title}
                    </AlertDialogTitle>
                    <AlertDialogDescription>
                        {description}
                    </AlertDialogDescription>
                </AlertDialogHeader>
                <AlertDialogFooter>
                    <AlertDialogCancel>{common('cancel')}</AlertDialogCancel>
                    <AlertDialogAction
                        onClick={onConfirm}
                        className="bg-rose-500 text-white hover:bg-rose-600"
                    >
                        {button}
                    </AlertDialogAction>
                </AlertDialogFooter>
            </AlertDialogContent>
        </AlertDialog>
    )
}

export default function DeckDetailsForm({
    deck,
    itemCount,
}: DeckDetailsFormProps) {
    const t = useTranslations('deck.edit')
    const td = useTranslations('decks.settings')
    const common = useTranslations('common')
    const router = useRouter()
    const [isResetting, setIsResetting] = useState(false)
    const [isDeleting, setIsDeleting] = useState(false)
    const [exportData, setExportData] = useState<ExportData | null>(null)
    const [isExportOpen, setIsExportOpen] = useState(false)
    const [isLoadingExport, setIsLoadingExport] = useState(false)
    const [isCopied, setIsCopied] = useState(false)

    async function handleExport() {
        setIsLoadingExport(true)
        try {
            setExportData(await getExportableFlashcards(deck.id))
            setIsExportOpen(true)
        } catch (error) {
            console.error('Error fetching export data:', error)
            toast.error(t('exportError'))
        } finally {
            setIsLoadingExport(false)
        }
    }

    async function copyToClipboard() {
        if (!exportData) return
        try {
            await navigator.clipboard.writeText(
                JSON.stringify(exportData, null, 2)
            )
            setIsCopied(true)
            toast.success(t('copiedSuccess'))
            setTimeout(() => setIsCopied(false), 2000)
        } catch {
            toast.error(t('copyError'))
        }
    }

    function downloadJson() {
        if (!exportData) return
        const blob = new Blob([JSON.stringify(exportData, null, 2)], {
            type: 'application/json',
        })
        const url = URL.createObjectURL(blob)
        const a = document.createElement('a')
        a.href = url
        a.download = `${deck.title.replace(/[^\p{L}\p{N}]+/gu, '-').toLowerCase() || 'deck'}.json`
        a.click()
        URL.revokeObjectURL(url)
    }

    async function handleReset() {
        setIsResetting(true)
        try {
            const result = await resetDeckProgress(deck.id)
            if (result.success)
                toast.success(t('dangerZone.resetProgress.success'))
            else toast.error(t('dangerZone.resetProgress.error'))
        } catch {
            toast.error(common('error'))
        } finally {
            setIsResetting(false)
        }
    }

    async function handleDelete() {
        setIsDeleting(true)
        try {
            const result = await deleteDeck(deck.id)
            if (result.success) {
                toast.success(t('dangerZone.deleteDeck.success'))
                router.push('/')
            } else {
                toast.error(t('dangerZone.deleteDeck.error'))
            }
        } catch {
            toast.error(common('error'))
        } finally {
            setIsDeleting(false)
        }
    }

    return (
        <div className="space-y-8">
            <DeckForm
                initial={{
                    title: deck.title,
                    description: deck.description ?? '',
                    tags: parseCategoryToTags(deck.category),
                    activeUntil: fromUTCDateOnly(deck.activeUntil),
                }}
                itemCount={itemCount}
                submitLabel={t('updateDeck')}
                submittingLabel={t('updating')}
                onSubmit={async (values) => {
                    const result = await updateDeck(
                        deckFormData(values, deck.id)
                    )
                    if (result.success) {
                        toast.success(t('success'))
                        router.refresh()
                    } else {
                        toast.error(result.error || t('error'))
                    }
                }}
                actions={
                    <Button
                        type="button"
                        variant="outline"
                        size="lg"
                        onClick={handleExport}
                        disabled={isLoadingExport}
                    >
                        {isLoadingExport ? (
                            <Loader2 className="animate-spin" />
                        ) : (
                            <Download />
                        )}
                        {isLoadingExport ? t('exporting') : t('export')}
                    </Button>
                }
            />

            <section className="space-y-3 rounded-2xl border-2 border-rose-300/60 p-5 sm:p-6 dark:border-rose-900/60">
                <div>
                    <h2 className="flex items-center gap-2 text-lg font-bold text-rose-600 dark:text-rose-400">
                        <AlertTriangle className="size-5" />
                        {t('dangerZone.title')}
                    </h2>
                    <p className="text-muted-foreground text-sm">
                        {t('dangerZone.description')}
                    </p>
                </div>
                <div className="grid gap-3 sm:grid-cols-2">
                    <div className="space-y-2 rounded-xl border p-4">
                        <p className="text-sm">{td('resetHint')}</p>
                        <ConfirmAction
                            title={t('dangerZone.resetProgress.confirmTitle')}
                            description={t(
                                'dangerZone.resetProgress.confirmDescription',
                                { title: deck.title }
                            )}
                            button={t('dangerZone.resetProgress.button')}
                            busyLabel={t('dangerZone.resetProgress.resetting')}
                            busy={isResetting}
                            icon={<RotateCcw />}
                            onConfirm={handleReset}
                        />
                    </div>
                    <div className="space-y-2 rounded-xl border p-4">
                        <p className="text-sm">{td('deleteHint')}</p>
                        <ConfirmAction
                            title={t('dangerZone.deleteDeck.confirmTitle')}
                            description={t(
                                'dangerZone.deleteDeck.confirmDescription',
                                { title: deck.title }
                            )}
                            button={t('dangerZone.deleteDeck.button')}
                            busyLabel={t('dangerZone.deleteDeck.deleting')}
                            busy={isDeleting}
                            icon={<Trash2 />}
                            onConfirm={handleDelete}
                        />
                    </div>
                </div>
            </section>

            <Dialog open={isExportOpen} onOpenChange={setIsExportOpen}>
                <DialogContent className="sm:max-w-2xl">
                    <DialogHeader>
                        <DialogTitle>
                            {t('exportTitle', { title: deck.title })}
                        </DialogTitle>
                        <DialogDescription>
                            {t('exportDescription')}
                        </DialogDescription>
                    </DialogHeader>
                    <pre className="bg-muted max-h-[50vh] overflow-auto rounded-xl p-3 text-xs">
                        {JSON.stringify(exportData, null, 2)}
                    </pre>
                    <DialogFooter className="gap-2">
                        <Button variant="outline" onClick={downloadJson}>
                            <Download />
                            {td('download')}
                        </Button>
                        <Button variant="outline" onClick={copyToClipboard}>
                            {isCopied ? <Check /> : <Copy />}
                            {isCopied ? common('copied') : t('copyToClipboard')}
                        </Button>
                    </DialogFooter>
                </DialogContent>
            </Dialog>
        </div>
    )
}
