'use client'

import { ChevronDown, Copy, Sparkles } from 'lucide-react'
import { toast } from 'sonner'

import { useState } from 'react'

import { useLocale, useTranslations } from 'next-intl'

import {
    createFlashcard,
    createFlashcardsFromJson,
} from '@/app/actions/flashcard'

import { AIFlashcardForm } from '@/components/ai-flashcard-form'
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
            <TabsList className="grid h-full w-full grid-cols-3">
                <TabsTrigger value="single">{t('singleCard')}</TabsTrigger>
                <TabsTrigger value="bulk">{t('createMultiple')}</TabsTrigger>
                <TabsTrigger value="ai" className="flex items-center gap-1">
                    <Sparkles className="h-3 w-3" />
                    {t('aiGenerate')}
                </TabsTrigger>
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
                                    value={singleCard.front}
                                    onChange={(e) =>
                                        setSingleCard((prev) => ({
                                            ...prev,
                                            front: e.target.value,
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
                                    value={singleCard.back}
                                    onChange={(e) =>
                                        setSingleCard((prev) => ({
                                            ...prev,
                                            back: e.target.value,
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

            <TabsContent value="ai">
                <AIFlashcardForm deckId={deckId} />
            </TabsContent>
        </Tabs>
    )
}
