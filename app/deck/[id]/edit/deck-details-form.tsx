'use client'

import { fromUTCDateOnly, toUTCDateOnly } from '@/lib/date'
import { cn } from '@/lib/utils'
import type { DeckType } from '@/types'
import { format } from 'date-fns'
import {
    AlertTriangle,
    CalendarIcon,
    Check,
    Copy,
    Download,
    Loader2,
    RotateCcw,
    Save,
    Trash2,
    X,
} from 'lucide-react'
import { toast } from 'sonner'

import type React from 'react'
import { useState } from 'react'

import { useTranslations } from 'next-intl'
import { useRouter } from 'next/navigation'

import { deleteDeck, resetDeckProgress, updateDeck } from '@/app/actions/deck'
import { getExportableFlashcards } from '@/app/actions/export'

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
import { Calendar } from '@/components/ui/calendar'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import {
    Dialog,
    DialogContent,
    DialogDescription,
    DialogFooter,
    DialogHeader,
    DialogTitle,
} from '@/components/ui/dialog'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import {
    Popover,
    PopoverContent,
    PopoverTrigger,
} from '@/components/ui/popover'
import { Textarea } from '@/components/ui/textarea'

interface DeckDetailsFormProps {
    deck: DeckType
}

export default function DeckDetailsForm({ deck }: DeckDetailsFormProps) {
    const t = useTranslations('deck.edit')
    const common = useTranslations('common')

    const [isSubmitting, setIsSubmitting] = useState(false)
    const [isResetting, setIsResetting] = useState(false)
    const [isDeleting, setIsDeleting] = useState(false)
    const [exportData, setExportData] = useState<
        | {
              front: string
              back: string
          }[]
        | null
    >(null)
    const [isExportDialogOpen, setIsExportDialogOpen] = useState(false)
    const [isCopied, setIsCopied] = useState(false)
    const [isLoadingExport, setIsLoadingExport] = useState(false)
    const [formData, setFormData] = useState({
        id: deck.id,
        title: deck.title,
        description: deck.description || '',
        kategorie: deck.category,
        activeUntil: fromUTCDateOnly(deck.activeUntil),
    })

    const router = useRouter()

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault()
        setIsSubmitting(true)

        const formDataToSend = new FormData()
        formDataToSend.append('id', formData.id)
        formDataToSend.append('title', formData.title)
        formDataToSend.append('description', formData.description)
        formDataToSend.append('kategorie', formData.kategorie)

        if (formData.activeUntil) {
            // Convert to UTC date-only before sending
            const utcDate = toUTCDateOnly(formData.activeUntil)
            formDataToSend.append('activeUntil', utcDate.toISOString())
        }

        try {
            const result = await updateDeck(formDataToSend)

            if (result.success) {
                toast.success(t('success'))
            } else {
                toast.error(t('error'))
            }
        } catch (error) {
            console.error('Fehler beim Aktualisieren des Decks:', error)
            toast.error(common('error'))
        } finally {
            setIsSubmitting(false)
        }
    }
    const handleResetProgress = async () => {
        setIsResetting(true)
        try {
            const result = await resetDeckProgress(deck.id)

            if (result.success) {
                toast.success(t('dangerZone.resetProgress.success'))
            } else {
                toast.error(t('dangerZone.resetProgress.error'))
            }
        } catch (error) {
            console.error(
                'Fehler beim Zurücksetzen des Lernfortschritts:',
                error
            )
            toast.error(common('error'))
        } finally {
            setIsResetting(false)
        }
    }

    const handleDeleteDeck = async () => {
        setIsDeleting(true)
        try {
            const result = await deleteDeck(deck.id)

            if (result.success) {
                toast.success(t('dangerZone.deleteDeck.success'))
                router.push('/')
            } else {
                toast.error(t('dangerZone.deleteDeck.error'))
            }
        } catch (error) {
            console.error('Fehler beim Löschen des Decks:', error)
            toast.error(common('error'))
        } finally {
            setIsDeleting(false)
        }
    }

    const handleExport = async () => {
        setIsLoadingExport(true)
        try {
            const data = await getExportableFlashcards(deck.id)
            setExportData(data)
            setIsExportDialogOpen(true)
        } catch (error) {
            console.error('Error fetching export data:', error)
            toast.error(t('exportError'))
        } finally {
            setIsLoadingExport(false)
        }
    }

    const copyToClipboard = async () => {
        if (!exportData) return

        try {
            await navigator.clipboard.writeText(
                JSON.stringify(exportData, null, 2)
            )
            setIsCopied(true)
            toast.success(t('copiedSuccess'))
            setTimeout(() => setIsCopied(false), 2000)
        } catch (err) {
            toast.error(t('copyError'))
            console.error('Failed to copy: ', err)
        }
    }

    return (
        <div className="flex w-full max-w-3xl flex-col gap-6">
            <Card className="w-full shadow-md">
                <CardHeader>
                    <CardTitle className="text-xl md:text-2xl">
                        {t('title')}
                    </CardTitle>
                </CardHeader>
                <form onSubmit={handleSubmit}>
                    <CardContent className="space-y-6 p-6">
                        <div className="grid gap-6 md:grid-cols-2">
                            <div className="col-span-2 space-y-2">
                                <Label
                                    htmlFor="title"
                                    className="text-sm font-medium"
                                >
                                    {t('titleRequired')}{' '}
                                    <span className="text-red-500">*</span>
                                </Label>
                                <Input
                                    id="title"
                                    value={formData.title}
                                    onChange={(e) =>
                                        setFormData((prev) => ({
                                            ...prev,
                                            title: e.target.value,
                                        }))
                                    }
                                    placeholder={t('titlePlaceholder')}
                                    required
                                    className="transition-all focus-visible:ring-offset-2"
                                />
                            </div>

                            <div className="col-span-2 space-y-2">
                                <Label
                                    htmlFor="description"
                                    className="text-sm font-medium"
                                >
                                    {t('descriptionLabel')}
                                </Label>
                                <Textarea
                                    id="description"
                                    value={formData.description}
                                    onChange={(e) =>
                                        setFormData((prev) => ({
                                            ...prev,
                                            description: e.target.value,
                                        }))
                                    }
                                    placeholder={t('descriptionPlaceholder')}
                                    className="min-h-[100px] transition-all focus-visible:ring-offset-2"
                                />
                            </div>

                            <div className="col-span-2 space-y-2 md:col-span-1">
                                <Label
                                    htmlFor="kategorie"
                                    className="text-sm font-medium"
                                >
                                    {t('categoryRequired')}{' '}
                                    <span className="text-red-500">*</span>
                                </Label>
                                <Input
                                    id="kategorie"
                                    value={formData.kategorie}
                                    onChange={(e) =>
                                        setFormData((prev) => ({
                                            ...prev,
                                            kategorie: e.target.value,
                                        }))
                                    }
                                    placeholder={t('categoryPlaceholder')}
                                    required
                                    className="transition-all focus-visible:ring-offset-2"
                                />
                            </div>

                            <div className="col-span-2 space-y-2 md:col-span-1">
                                <Label
                                    htmlFor="activeUntil"
                                    className="text-sm font-medium"
                                >
                                    {t('dueDateLabel')}
                                </Label>
                                <div className="flex w-full gap-2">
                                    <Popover>
                                        <PopoverTrigger asChild>
                                            <Button
                                                variant="outline"
                                                className={cn(
                                                    'w-full flex-1 justify-start text-left font-normal',
                                                    !formData.activeUntil &&
                                                        'text-muted-foreground'
                                                )}
                                                id="activeUntil"
                                            >
                                                <CalendarIcon className="mr-2 h-4 w-4" />
                                                {formData.activeUntil ? (
                                                    format(
                                                        formData.activeUntil,
                                                        'dd.MM.yyyy'
                                                    )
                                                ) : (
                                                    <span>
                                                        {t('noDateSelected')}
                                                    </span>
                                                )}
                                            </Button>
                                        </PopoverTrigger>
                                        <PopoverContent
                                            className="p-0"
                                            align="start"
                                        >
                                            <Calendar
                                                mode="single"
                                                selected={
                                                    formData.activeUntil ||
                                                    undefined
                                                }
                                                onSelect={(date) =>
                                                    setFormData((prev) => ({
                                                        ...prev,
                                                        activeUntil: date || null,
                                                    }))
                                                }
                                                initialFocus
                                            />
                                        </PopoverContent>
                                    </Popover>

                                    {formData.activeUntil && (
                                        <Button
                                            type="button"
                                            variant="ghost"
                                            onClick={() =>
                                                setFormData((prev) => ({
                                                    ...prev,
                                                    activeUntil: null,
                                                }))
                                            }
                                            className="flex w-auto items-center justify-center gap-1"
                                        >
                                            <X className="h-3.5 w-3.5" />
                                        </Button>
                                    )}
                                </div>
                                <p className="text-muted-foreground text-xs">
                                    {t('dueDateHint')}
                                </p>
                            </div>
                        </div>
                        <div className="flex flex-col justify-end gap-2 pt-4 md:flex-row">
                            <Button
                                type="button"
                                variant="outline"
                                onClick={handleExport}
                                disabled={isLoadingExport}
                                className="gap-2"
                            >
                                {isLoadingExport ? (
                                    <>
                                        <Loader2 className="h-4 w-4 animate-spin" />
                                        <span>{t('exporting')}</span>
                                    </>
                                ) : (
                                    <>
                                        <Download className="h-4 w-4" />
                                        <span>{t('export')}</span>
                                    </>
                                )}
                            </Button>
                            <Button
                                type="submit"
                                disabled={isSubmitting}
                                className="w-full sm:w-auto"
                            >
                                {isSubmitting ? (
                                    <>
                                        <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                                        <span>{t('updating')}</span>
                                    </>
                                ) : (
                                    <>
                                        <Save className="mr-2 h-4 w-4" />
                                        <span>{t('updateDeck')}</span>
                                    </>
                                )}
                            </Button>
                        </div>
                    </CardContent>
                </form>
            </Card>
            <Card className="w-full border-red-200 shadow-md dark:border-red-950">
                <CardHeader>
                    <CardTitle className="text-xl text-red-600 md:text-2xl dark:text-red-400">
                        {t('dangerZone.title')}
                    </CardTitle>
                </CardHeader>
                <CardContent className="p-6">
                    <div className="flex flex-col space-y-4">
                        <div className="flex flex-col items-center md:items-start">
                            <p className="text-muted-foreground mb-4 text-sm">
                                {t('dangerZone.description')}
                            </p>
                            <div className="flex flex-col gap-4 sm:flex-row">
                                <AlertDialog>
                                    <AlertDialogTrigger asChild>
                                        <Button
                                            type="button"
                                            variant="outline"
                                            className="w-64"
                                            disabled={isResetting}
                                        >
                                            {isResetting ? (
                                                <>
                                                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                                                    <span>
                                                        {t(
                                                            'dangerZone.resetProgress.resetting'
                                                        )}
                                                    </span>
                                                </>
                                            ) : (
                                                <>
                                                    <RotateCcw className="mr-2 h-4 w-4" />
                                                    <span>
                                                        {t(
                                                            'dangerZone.resetProgress.button'
                                                        )}
                                                    </span>
                                                </>
                                            )}
                                        </Button>
                                    </AlertDialogTrigger>
                                    <AlertDialogContent>
                                        <AlertDialogHeader>
                                            <AlertDialogTitle className="flex items-center gap-2">
                                                <AlertTriangle className="h-5 w-5 text-amber-500" />
                                                {t(
                                                    'dangerZone.resetProgress.confirmTitle'
                                                )}
                                            </AlertDialogTitle>
                                            <AlertDialogDescription>
                                                {t(
                                                    'dangerZone.resetProgress.confirmDescription',
                                                    { title: formData.title }
                                                )}
                                            </AlertDialogDescription>
                                        </AlertDialogHeader>
                                        <AlertDialogFooter>
                                            <AlertDialogCancel>
                                                {common('cancel')}
                                            </AlertDialogCancel>
                                            <AlertDialogAction
                                                onClick={handleResetProgress}
                                                className="bg-amber-500 hover:bg-amber-600"
                                            >
                                                {common('reset')}
                                            </AlertDialogAction>
                                        </AlertDialogFooter>
                                    </AlertDialogContent>
                                </AlertDialog>

                                <AlertDialog>
                                    <AlertDialogTrigger asChild>
                                        <Button
                                            type="button"
                                            className="w-64 bg-red-500 hover:bg-red-600"
                                            disabled={isDeleting}
                                        >
                                            {isDeleting ? (
                                                <>
                                                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                                                    <span>
                                                        {t(
                                                            'dangerZone.deleteDeck.deleting'
                                                        )}
                                                    </span>
                                                </>
                                            ) : (
                                                <>
                                                    <Trash2 className="mr-2 h-4 w-4" />
                                                    <span>
                                                        {t(
                                                            'dangerZone.deleteDeck.button'
                                                        )}
                                                    </span>
                                                </>
                                            )}
                                        </Button>
                                    </AlertDialogTrigger>
                                    <AlertDialogContent>
                                        <AlertDialogHeader>
                                            <AlertDialogTitle className="flex items-center gap-2">
                                                <AlertTriangle className="h-5 w-5 text-red-500" />
                                                {t(
                                                    'dangerZone.deleteDeck.confirmTitle'
                                                )}
                                            </AlertDialogTitle>
                                            <AlertDialogDescription>
                                                {t(
                                                    'dangerZone.deleteDeck.confirmDescription',
                                                    { title: formData.title }
                                                )}
                                            </AlertDialogDescription>
                                        </AlertDialogHeader>
                                        <AlertDialogFooter>
                                            <AlertDialogCancel>
                                                {common('cancel')}
                                            </AlertDialogCancel>
                                            <AlertDialogAction
                                                onClick={handleDeleteDeck}
                                                className="bg-red-500 hover:bg-red-600"
                                            >
                                                {t(
                                                    'dangerZone.deleteDeck.button'
                                                )}
                                            </AlertDialogAction>
                                        </AlertDialogFooter>
                                    </AlertDialogContent>
                                </AlertDialog>
                            </div>
                        </div>
                    </div>
                </CardContent>
            </Card>
            {exportData && (
                <Dialog
                    open={isExportDialogOpen}
                    onOpenChange={setIsExportDialogOpen}
                >
                    <DialogContent>
                        <DialogHeader>
                            <DialogTitle>
                                {t('exportTitle', { title: deck.title })}
                            </DialogTitle>
                            <DialogDescription>
                                {t('exportDescription')}
                            </DialogDescription>
                        </DialogHeader>

                        {/*Dirty fix because for some fucking reason the dialog has weird overwrites*/}
                        <div className="w-[300px] py-4 md:max-w-md">
                            <div className="bg-muted max-h-[50vh] overflow-auto rounded p-2 sm:max-h-96 sm:p-4">
                                <div className="overflow-x-auto">
                                    <pre
                                        className="text-xs sm:text-sm"
                                        style={{ tabSize: 2 }}
                                    >
                                        {JSON.stringify(exportData, null, 2)}
                                    </pre>
                                </div>
                            </div>
                        </div>

                        <DialogFooter>
                            <Button
                                variant="outline"
                                onClick={copyToClipboard}
                                className="gap-2"
                            >
                                {isCopied ? (
                                    <>
                                        <Check className="h-4 w-4" />
                                        {common('copied')}
                                    </>
                                ) : (
                                    <>
                                        <Copy className="h-4 w-4" />
                                        {t('copyToClipboard')}
                                    </>
                                )}
                            </Button>
                        </DialogFooter>
                    </DialogContent>
                </Dialog>
            )}
        </div>
    )
}
