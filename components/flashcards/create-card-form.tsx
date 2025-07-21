'use client'

import { ChevronDown, Copy, Sparkles } from 'lucide-react'
import { toast } from 'sonner'

import type React from 'react'
import { useState } from 'react'

import { useLocale, useTranslations } from 'next-intl'

import {
    createFlashcard,
    createFlashcardsFromJson,
} from '@/app/actions/flashcard'

import { AIFlashcardForm } from '@/components/flashcards/ai-flashcard-form'
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
        front: '',
        back: '',
    })
    const [jsonCards, setJsonCards] = useState('')
    const [isSubmitting, setIsSubmitting] = useState(false)

    const getJsonPlaceholder = () => {
        if (locale === 'de') {
            return `[
  {
    "front": "Was ist ...?",
    "back": "Die Antwort ist ...",
  },
  {
    "front": "Nenne drei ...",
    "back": "1. ... 2. ... 3. ..."
  }
]`
        }
        return `[
  {
    "front": "What is ...?",
    "back": "The answer is ...",
  },
  {
    "front": "Name three ...",
    "back": "1. ... 2. ... 3. ..."
  }
]`
    }

    const getAiPrompt = () => {
        const schema = getJsonPlaceholder()
        if (locale === 'de') {
            return `Bitte erstelle Lernkarten für das gewünschte Thema im folgenden JSON-Format:

${schema}

Wichtige Hinweise:
- "front" ist die Frage oder der Begriff
- "back" ist die Antwort oder Erklärung  
- Verwende \\n für Zeilenumbrüche in längeren Texten
- Erstelle mindestens 5-10 Karten pro Thema
- Variiere die Fragetypen (Definitionen, Aufzählungen, Erklärungen)

Thema für die Lernkarten:`
        }
        return `Please create flashcards for the requested topic in the following JSON format:

${schema}

Important notes:
- "front" is the question or term (front side)
- "back" is the answer or explanation (back side)
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
        formData.append('front', singleCard.front)
        formData.append('back', singleCard.back)
        formData.append('isExamRelevant', 'true')

        const result = await createFlashcard(formData)
        if (result.success) {
            toast.success(t('cardCreated'))
            setSingleCard({ front: '', back: '' })
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
            <TabsList className="grid h-auto w-full grid-cols-3 p-1">
                <TabsTrigger
                    value="single"
                    className="min-w-0 truncate px-2 py-2 text-xs sm:text-sm"
                >
                    <span className="truncate">{t('singleCard')}</span>
                </TabsTrigger>
                <TabsTrigger
                    value="bulk"
                    className="min-w-0 truncate px-2 py-2 text-xs sm:text-sm"
                >
                    <span className="truncate">{t('createMultiple')}</span>
                </TabsTrigger>
                <TabsTrigger
                    value="ai"
                    className="flex min-w-0 items-center justify-center gap-1 px-1 py-2 text-xs sm:px-2 sm:text-sm"
                >
                    <Sparkles className="h-3 w-3 flex-shrink-0" />
                    <span className="hidden truncate sm:inline">
                        {t('aiGenerate')}
                    </span>
                    <span className="truncate sm:hidden">AI</span>
                </TabsTrigger>
            </TabsList>

            <TabsContent value="single" className="mt-4">
                <Card>
                    <CardHeader>
                        <CardTitle className="text-lg sm:text-xl">
                            {t('newCard')}
                        </CardTitle>
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
                                    value={singleCard.front}
                                    onChange={(e) =>
                                        setSingleCard((prev) => ({
                                            ...prev,
                                            front: e.target.value,
                                        }))
                                    }
                                    placeholder={t('frontPlaceholder')}
                                    required
                                    className="w-full"
                                />
                            </div>
                            <div>
                                <label className="mb-1 block text-sm font-medium">
                                    {t('backLabel')}
                                </label>
                                <Textarea
                                    value={singleCard.back}
                                    onChange={(e) =>
                                        setSingleCard((prev) => ({
                                            ...prev,
                                            back: e.target.value,
                                        }))
                                    }
                                    placeholder={t('backPlaceholder')}
                                    className="h-32 w-full resize-none rounded border p-2 sm:h-56"
                                    required
                                />
                            </div>
                            <Button
                                type="submit"
                                disabled={isSubmitting}
                                className="w-full sm:w-auto"
                            >
                                {isSubmitting ? t('creating') : t('createCard')}
                            </Button>
                        </form>
                    </CardContent>
                </Card>
            </TabsContent>

            <TabsContent value="bulk" className="mt-4">
                <Card>
                    <CardHeader>
                        <CardTitle className="text-lg sm:text-xl">
                            {t('createMultiple')}
                        </CardTitle>
                    </CardHeader>
                    <CardContent>
                        <form onSubmit={handleBulkSubmit} className="space-y-4">
                            <div>
                                <div className="mb-2 flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
                                    <label className="block text-sm font-medium">
                                        JSON Array
                                    </label>
                                    <DropdownMenu>
                                        <DropdownMenuTrigger asChild>
                                            <Button
                                                variant="outline"
                                                size="sm"
                                                type="button"
                                                className="w-full gap-1 bg-transparent sm:w-auto"
                                            >
                                                <Copy className="h-3 w-3" />
                                                <span className="truncate">
                                                    {t('copySchema')}
                                                </span>
                                                <ChevronDown className="h-3 w-3 flex-shrink-0" />
                                            </Button>
                                        </DropdownMenuTrigger>
                                        <DropdownMenuContent
                                            align="end"
                                            className="w-56"
                                        >
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
                                    className="h-48 w-full resize-none rounded border p-2 font-mono text-xs sm:h-72 sm:text-sm"
                                    placeholder={getJsonPlaceholder()}
                                    required
                                />
                            </div>
                            <Button
                                type="submit"
                                disabled={isSubmitting}
                                className="w-full sm:w-auto"
                            >
                                {isSubmitting
                                    ? t('creatingMultiple')
                                    : t('createFromJson')}
                            </Button>
                        </form>
                    </CardContent>
                </Card>
            </TabsContent>

            <TabsContent value="ai" className="mt-4">
                <AIFlashcardForm deckId={deckId} />
            </TabsContent>
        </Tabs>
    )
}
