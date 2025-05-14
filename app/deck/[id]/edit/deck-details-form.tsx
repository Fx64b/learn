'use client'

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
    const [isSubmitting, setIsSubmitting] = useState(false)
    const [isResetting, setIsResetting] = useState(false)
    const [isDeleting, setIsDeleting] = useState(false)
    const [exportData, setExportData] = useState<any[] | null>(null)
    const [isExportDialogOpen, setIsExportDialogOpen] = useState(false)
    const [isCopied, setIsCopied] = useState(false)
    const [isLoadingExport, setIsLoadingExport] = useState(false)
    const [formData, setFormData] = useState({
        id: deck.id,
        titel: deck.titel,
        beschreibung: deck.beschreibung || '',
        kategorie: deck.kategorie,
        aktivBis: deck.aktivBis
            ? new Date(deck.aktivBis)
            : (null as Date | null),
    })

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault()
        setIsSubmitting(true)

        const formDataToSend = new FormData()
        formDataToSend.append('id', formData.id)
        formDataToSend.append('titel', formData.titel)
        formDataToSend.append('beschreibung', formData.beschreibung)
        formDataToSend.append('kategorie', formData.kategorie)

        if (formData.aktivBis) {
            formDataToSend.append('aktivBis', formData.aktivBis.toISOString())
        }

        try {
            const result = await updateDeck(formDataToSend)

            if (result.success) {
                toast.success('Deck erfolgreich aktualisiert!')
            } else {
                toast.error('Fehler beim Aktualisieren des Decks')
            }
        } catch (error) {
            console.error('Fehler beim Aktualisieren des Decks:', error)
            toast.error('Ein unerwarteter Fehler ist aufgetreten')
        } finally {
            setIsSubmitting(false)
        }
    }

    const handleResetProgress = async () => {
        setIsResetting(true)
        try {
            const result = await resetDeckProgress(deck.id)

            if (result.success) {
                toast.success('Lernfortschritt erfolgreich zurückgesetzt!')
            } else {
                toast.error('Fehler beim Zurücksetzen des Lernfortschritts')
            }
        } catch (error) {
            console.error(
                'Fehler beim Zurücksetzen des Lernfortschritts:',
                error
            )
            toast.error('Ein unerwarteter Fehler ist aufgetreten')
        } finally {
            setIsResetting(false)
        }
    }

    const handleDeleteDeck = async () => {
        setIsDeleting(true)
        try {
            const result = await deleteDeck(deck.id)

            if (result.success) {
                toast.success('Deck erfolgreich gelöscht!')
                window.location.href = '/'
            } else {
                toast.error('Fehler beim Löschen des Decks')
            }
        } catch (error) {
            console.error('Fehler beim Löschen des Decks:', error)
            toast.error('Ein unerwarteter Fehler ist aufgetreten')
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
            toast.error('Fehler beim Exportieren des Decks')
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
            toast.success('JSON in die Zwischenablage kopiert')
            setTimeout(() => setIsCopied(false), 2000)
        } catch (err) {
            toast.error('Fehler beim Kopieren')
            console.error('Failed to copy: ', err)
        }
    }

    return (
        <div className="flex w-full max-w-3xl flex-col gap-6">
            <Card className="w-full shadow-md">
                <CardHeader>
                    <CardTitle className="text-xl md:text-2xl">
                        Deck-Details bearbeiten
                    </CardTitle>
                </CardHeader>
                <form onSubmit={handleSubmit}>
                    <CardContent className="space-y-6 p-6">
                        <div className="grid gap-6 md:grid-cols-2">
                            <div className="col-span-2 space-y-2">
                                <Label
                                    htmlFor="titel"
                                    className="text-sm font-medium"
                                >
                                    Titel{' '}
                                    <span className="text-red-500">*</span>
                                </Label>
                                <Input
                                    id="titel"
                                    value={formData.titel}
                                    onChange={(e) =>
                                        setFormData((prev) => ({
                                            ...prev,
                                            titel: e.target.value,
                                        }))
                                    }
                                    placeholder="z.B. Mathematik Grundlagen"
                                    required
                                    className="transition-all focus-visible:ring-offset-2"
                                />
                            </div>

                            <div className="col-span-2 space-y-2">
                                <Label
                                    htmlFor="beschreibung"
                                    className="text-sm font-medium"
                                >
                                    Beschreibung
                                </Label>
                                <Textarea
                                    id="beschreibung"
                                    value={formData.beschreibung}
                                    onChange={(e) =>
                                        setFormData((prev) => ({
                                            ...prev,
                                            beschreibung: e.target.value,
                                        }))
                                    }
                                    placeholder="Kurze Beschreibung des Decks"
                                    className="min-h-[100px] transition-all focus-visible:ring-offset-2"
                                />
                            </div>

                            <div className="col-span-2 space-y-2 md:col-span-1">
                                <Label
                                    htmlFor="kategorie"
                                    className="text-sm font-medium"
                                >
                                    Kategorie{' '}
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
                                    placeholder="z.B. Mathematik, Sprachen, etc."
                                    required
                                    className="transition-all focus-visible:ring-offset-2"
                                />
                            </div>

                            <div className="col-span-2 space-y-2 md:col-span-1">
                                <Label
                                    htmlFor="aktivBis"
                                    className="text-sm font-medium"
                                >
                                    Lernfrist
                                </Label>
                                <div className="flex w-full gap-2">
                                    <Popover>
                                        <PopoverTrigger asChild>
                                            <Button
                                                variant="outline"
                                                className={cn(
                                                    'w-full flex-1 justify-start text-left font-normal',
                                                    !formData.aktivBis &&
                                                        'text-muted-foreground'
                                                )}
                                                id="aktivBis"
                                            >
                                                <CalendarIcon className="mr-2 h-4 w-4" />
                                                {formData.aktivBis ? (
                                                    format(
                                                        formData.aktivBis,
                                                        'dd.MM.yyyy'
                                                    )
                                                ) : (
                                                    <span>
                                                        Kein Datum ausgewählt
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
                                                    formData.aktivBis ||
                                                    undefined
                                                }
                                                onSelect={(date) =>
                                                    setFormData((prev) => ({
                                                        ...prev,
                                                        aktivBis: date || null,
                                                    }))
                                                }
                                                initialFocus
                                            />
                                        </PopoverContent>
                                    </Popover>

                                    {formData.aktivBis && (
                                        <Button
                                            type="button"
                                            variant="ghost"
                                            onClick={() =>
                                                setFormData((prev) => ({
                                                    ...prev,
                                                    aktivBis: null,
                                                }))
                                            }
                                            className="flex w-auto items-center justify-center gap-1"
                                        >
                                            <X className="h-3.5 w-3.5" />
                                        </Button>
                                    )}
                                </div>
                                <p className="text-muted-foreground text-xs">
                                    Datum, bis zu dem die Karten gelernt werden
                                    sollen (z.B. Prüfungsdatum)
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
                                        <span>Lädt...</span>
                                    </>
                                ) : (
                                    <>
                                        <Download className="h-4 w-4" />
                                        <span>Exportieren</span>
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
                                        <span>Wird aktualisiert...</span>
                                    </>
                                ) : (
                                    <>
                                        <Save className="mr-2 h-4 w-4" />
                                        <span>Deck aktualisieren</span>
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
                        Dangerzone
                    </CardTitle>
                </CardHeader>
                <CardContent className="p-6">
                    <div className="flex flex-col space-y-4">
                        <div className="flex flex-col items-center md:items-start">
                            <p className="text-muted-foreground mb-4 text-sm">
                                Die folgenden Aktionen können nicht rückgängig
                                gemacht werden. Bitte mit Vorsicht verwenden.
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
                                                        Wird zurückgesetzt...
                                                    </span>
                                                </>
                                            ) : (
                                                <>
                                                    <RotateCcw className="mr-2 h-4 w-4" />
                                                    <span>
                                                        Lernfortschritt
                                                        zurücksetzen
                                                    </span>
                                                </>
                                            )}
                                        </Button>
                                    </AlertDialogTrigger>
                                    <AlertDialogContent>
                                        <AlertDialogHeader>
                                            <AlertDialogTitle className="flex items-center gap-2">
                                                <AlertTriangle className="h-5 w-5 text-amber-500" />
                                                Lernfortschritt zurücksetzen?
                                            </AlertDialogTitle>
                                            <AlertDialogDescription>
                                                Der gesamte Lernfortschritt für{' '}
                                                <strong>
                                                    &quot;{formData.titel}&quot;
                                                </strong>{' '}
                                                wird gelöscht. Diese Aktion kann
                                                nicht rückgängig gemacht werden.
                                                Alle Karten werden als noch nie
                                                gelernt markiert.
                                            </AlertDialogDescription>
                                        </AlertDialogHeader>
                                        <AlertDialogFooter>
                                            <AlertDialogCancel>
                                                Abbrechen
                                            </AlertDialogCancel>
                                            <AlertDialogAction
                                                onClick={handleResetProgress}
                                                className="bg-amber-500 hover:bg-amber-600"
                                            >
                                                Zurücksetzen
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
                                                        Wird gelöscht...
                                                    </span>
                                                </>
                                            ) : (
                                                <>
                                                    <Trash2 className="mr-2 h-4 w-4" />
                                                    <span>Deck löschen</span>
                                                </>
                                            )}
                                        </Button>
                                    </AlertDialogTrigger>
                                    <AlertDialogContent>
                                        <AlertDialogHeader>
                                            <AlertDialogTitle className="flex items-center gap-2">
                                                <AlertTriangle className="h-5 w-5 text-red-500" />
                                                Deck komplett löschen?
                                            </AlertDialogTitle>
                                            <AlertDialogDescription>
                                                Das Deck{' '}
                                                <strong>
                                                    &quot;{formData.titel}&quot;
                                                </strong>{' '}
                                                wird mit allen Karten und
                                                Lernfortschritten unwiderruflich
                                                gelöscht. Diese Aktion kann
                                                nicht rückgängig gemacht werden.
                                            </AlertDialogDescription>
                                        </AlertDialogHeader>
                                        <AlertDialogFooter>
                                            <AlertDialogCancel>
                                                Abbrechen
                                            </AlertDialogCancel>
                                            <AlertDialogAction
                                                onClick={handleDeleteDeck}
                                                className="bg-red-500 hover:bg-red-600"
                                            >
                                                Deck löschen
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
                                Deck "{deck.titel}" exportieren
                            </DialogTitle>
                            <DialogDescription>
                                JSON-Format zum Importieren in andere Decks oder
                                zum Backup
                            </DialogDescription>
                        </DialogHeader>

                        {/*Dirty fix because for some fucking reason the dialog has weird overwrites*/}
                        <div className="py-4 w-[300px] md:max-w-md">
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
                                        Kopiert
                                    </>
                                ) : (
                                    <>
                                        <Copy className="h-4 w-4" />
                                        In Zwischenablage kopieren
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
