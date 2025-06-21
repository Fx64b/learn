'use client'

import { ChevronDown, Copy } from 'lucide-react'
import { toast } from 'sonner'

import { useState } from 'react'

import { useLocale, useTranslations } from 'next-intl'

import {
    createFlashcard,
    createFlashcardsFromJson,
} from '@/app/actions/flashcard'

import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import {
    DropdownMenu,
    DropdownMenuContent,
    DropdownMenuItem,
    DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu'
import { Input } from '@/components/ui/input'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { Textarea } from '@/components/ui/textarea'

export function CreateCardForm({ deckId }: { deckId: string }) {
    const t = useTranslations('deck.cards')
    const locale = useLocale()
    const [singleCard, setSingleCard] = useState({
        vorderseite: '',
        rueckseite: '',
    })
    const [jsonCards, setJsonCards] = useState('')
    const [isSubmitting, setIsSubmitting] = useState(false)

    const getJsonPlaceholder = () => {
        if (locale === 'de') {
            return `[
  {
    "vorderseite": "Was ist ...?",
    "rueckseite": "Die Antwort ist ...",
  },
  {
    "vorderseite": "Nenne drei ...",
    "rueckseite": "1. ... 2. ... 3. ..."
  }
]`
        }

        return `[
  {
    "vorderseite": "What is ...?",
    "rueckseite": "The answer is ...",
  },
  {
    "vorderseite": "Name three ...",
    "rueckseite": "1. ... 2. ... 3. ..."
  }
]`
    }

    const getAiPrompt = () => {
        const schema = getJsonPlaceholder()

        if (locale === 'de') {
            return `Bitte erstelle Lernkarten für das gewünschte Thema im folgenden JSON-Format:

${schema}

Wichtige Hinweise:
- "vorderseite" ist die Frage oder der Begriff
- "rueckseite" ist die Antwort oder Erklärung  
- "istPruefungsrelevant" ist optional (Standard: true)
- Verwende \\n für Zeilenumbrüche in längeren Texten
- Erstelle mindestens 5-10 Karten pro Thema
- Variiere die Fragetypen (Definitionen, Aufzählungen, Erklärungen)

Thema für die Lernkarten:`
        }

        return `Please create flashcards for the requested topic in the following JSON format:

${schema}

Important notes:
- "vorderseite" is the question or term (front side)
- "rueckseite" is the answer or explanation (back side)
- "istPruefungsrelevant" is optional (defaults to true)
- Use \\n for line breaks in longer texts
- Create at least 5-10 cards per topic
- Vary question types (definitions, lists, explanations)

Topic for the flashcards:`
    }

    const copyToClipboard = async (text: string) => {
        try {
            await navigator.clipboard.writeText(text)
            toast.success(t('copiedToClipboard'))
        } catch (err) {
            console.error('Failed to copy: ', err)
            toast.error(t('copyFailed'))
        }
    }

    const handleCopySchema = () => {
        copyToClipboard(getJsonPlaceholder())
    }

    const handleCopyWithAiPrompt = () => {
        copyToClipboard(getAiPrompt())
    }

    const handleSingleSubmit = async (e: React.FormEvent) => {
        e.preventDefault()
        setIsSubmitting(true)

        const formData = new FormData()
        formData.append('deckId', deckId)
        formData.append('vorderseite', singleCard.vorderseite)
        formData.append('rueckseite', singleCard.rueckseite)
        formData.append('istPruefungsrelevant', 'true')

        const result = await createFlashcard(formData)

        if (result.success) {
            toast.success(t('cardCreated'))
            setSingleCard({ vorderseite: '', rueckseite: '' })
        } else {
            toast.error(t('common.error'))
        }

        setIsSubmitting(false)
    }

    const handleBulkSubmit = async (e: React.FormEvent) => {
        e.preventDefault()
        setIsSubmitting(true)

        const result = await createFlashcardsFromJson({
            deckId,
            cardsJson: jsonCards,
        })

        if (result.success) {
            const successCount =
                result.results?.filter((r) => r.success).length || 0
            const errorCount =
                result.results?.filter((r) => !r.success).length || 0

            const message =
                errorCount > 0
                    ? t('cardsCreated', {
                          success: successCount,
                          errors: t('withErrors', { count: errorCount }),
                      })
                    : t('cardsCreated', { success: successCount, errors: '' })

            toast.success(message)
            setJsonCards('')
        } else {
            toast.error(result.error || t('common.error'))
        }

        setIsSubmitting(false)
    }

    return (
        <Tabs defaultValue="single" className="w-full">
            <TabsList className="grid h-full w-full grid-cols-2">
                <TabsTrigger value="single">{t('singleCard')}</TabsTrigger>
                <TabsTrigger value="bulk">{t('createMultiple')}</TabsTrigger>
            </TabsList>

            <TabsContent value="single">
                <Card>
                    <CardHeader>
                        <CardTitle>{t('newCard')}</CardTitle>
                    </CardHeader>
                    <CardContent>
                        <form
                            onSubmit={handleSingleSubmit}
                            className="space-y-4"
                        >
                            <div>
                                <label className="mb-1 block text-sm font-medium">
                                    {t('frontLabel')}
                                </label>
                                <Input
                                    value={singleCard.vorderseite}
                                    onChange={(e) =>
                                        setSingleCard((prev) => ({
                                            ...prev,
                                            vorderseite: e.target.value,
                                        }))
                                    }
                                    placeholder={t('frontPlaceholder')}
                                    required
                                />
                            </div>
                            <div>
                                <label className="mb-1 block text-sm font-medium">
                                    {t('backLabel')}
                                </label>
                                <Textarea
                                    value={singleCard.rueckseite}
                                    onChange={(e) =>
                                        setSingleCard((prev) => ({
                                            ...prev,
                                            rueckseite: e.target.value,
                                        }))
                                    }
                                    placeholder={t('backPlaceholder')}
                                    className="h-56 w-full rounded border p-2"
                                    required
                                />
                            </div>
                            <Button type="submit" disabled={isSubmitting}>
                                {isSubmitting ? t('creating') : t('createCard')}
                            </Button>
                        </form>
                    </CardContent>
                </Card>
            </TabsContent>

            <TabsContent value="bulk">
                <Card>
                    <CardHeader>
                        <CardTitle>{t('createMultiple')}</CardTitle>
                    </CardHeader>
                    <CardContent>
                        <form onSubmit={handleBulkSubmit} className="space-y-4">
                            <div>
                                <div className="mb-2 flex items-center justify-between">
                                    <label className="block text-sm font-medium">
                                        JSON Array
                                    </label>
                                    <DropdownMenu>
                                        <DropdownMenuTrigger asChild>
                                            <Button
                                                variant="outline"
                                                size="sm"
                                                type="button"
                                                className="gap-1"
                                            >
                                                <Copy className="h-3 w-3" />
                                                {t('copySchema')}
                                                <ChevronDown className="h-3 w-3" />
                                            </Button>
                                        </DropdownMenuTrigger>
                                        <DropdownMenuContent align="end">
                                            <DropdownMenuItem
                                                onClick={handleCopySchema}
                                            >
                                                <Copy className="mr-2 h-4 w-4" />
                                                {t('copySchema')}
                                            </DropdownMenuItem>
                                            <DropdownMenuItem
                                                onClick={handleCopyWithAiPrompt}
                                            >
                                                <Copy className="mr-2 h-4 w-4" />
                                                {t('copyWithAiPrompt')}
                                            </DropdownMenuItem>
                                        </DropdownMenuContent>
                                    </DropdownMenu>
                                </div>
                                <Textarea
                                    value={jsonCards}
                                    onChange={(e) =>
                                        setJsonCards(e.target.value)
                                    }
                                    className="h-72 w-full rounded border p-2"
                                    placeholder={getJsonPlaceholder()}
                                    required
                                />
                            </div>
                            <Button type="submit" disabled={isSubmitting}>
                                {isSubmitting
                                    ? t('creatingMultiple')
                                    : t('createFromJson')}
                            </Button>
                        </form>
                    </CardContent>
                </Card>
            </TabsContent>
        </Tabs>
    )
}
