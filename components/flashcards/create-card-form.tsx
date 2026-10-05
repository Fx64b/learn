'use client'

import { ChevronDown, Copy, Sparkles } from 'lucide-react'
import { toast } from 'sonner'

import type React from 'react'
import { useState } from 'react'

import { useLocale, useTranslations } from 'next-intl'

import { createItem, createItemsFromJson } from '@/app/actions/flashcard'

import { AIFlashcardForm } from '@/components/flashcards/ai-flashcard-form'
import { ItemEditor } from '@/components/items/item-editor'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import {
    DropdownMenu,
    DropdownMenuContent,
    DropdownMenuItem,
    DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { Textarea } from '@/components/ui/textarea'

export function CreateCardForm({ deckId }: { deckId: string }) {
    const t = useTranslations('deck.cards')
    const locale = useLocale()
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
  },
  {
    "type": "list",
    "front": "Nenne alle ...",
    "content": { "items": ["...", "...", "..."] }
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
  },
  {
    "type": "list",
    "front": "Name all ...",
    "content": { "items": ["...", "...", "..."] }
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
- Ohne "type" ist ein Eintrag eine Frage-Antwort-Karte
- Weitere Typen (nur wenn passend):
  {"type":"choice","front":"Frage","content":{"options":["A","B","C"],"answer":["B"]}}
  {"type":"cloze","content":{"text":"Wasser kocht bei ___ °C","answers":["100"]}}
  {"type":"list","front":"Nenne alle ...","content":{"items":["A","B",["C","Alias"]]}}
  {"type":"sequence","front":"Ordne ...","content":{"items":[{"label":"Erstes"},{"label":"Zweites"},{"label":"Drittes"}]}}
  {"type":"number","front":"Wie hoch ...?","content":{"value":8849,"unit":"m","tolerance":50}}
  {"type":"pairs","content":{"pairs":[{"left":"A","right":"1"},{"left":"B","right":"2"}]}}
  {"type":"passage","front":"Zitiere ...","content":{"text":"Wortwörtlicher Text"}}

Thema für die Lernkarten:`
        }
        return `Please create flashcards for the requested topic in the following JSON format:

${schema}

Important notes:
- "front" is the question or term (front side)
- "back" is the answer or explanation (back side)
- Use \\n for line breaks in longer texts
- Create at least 5-10 cards per topic
- An entry without "type" is a question/answer card
- Other types (only where they fit):
  {"type":"choice","front":"Question","content":{"options":["A","B","C"],"answer":["B"]}}
  {"type":"cloze","content":{"text":"Water boils at ___ °C","answers":["100"]}}
  {"type":"list","front":"Name all ...","content":{"items":["A","B",["C","Alias"]]}}
  {"type":"sequence","front":"Order ...","content":{"items":[{"label":"First"},{"label":"Second"},{"label":"Third"}]}}
  {"type":"number","front":"How tall ...?","content":{"value":8849,"unit":"m","tolerance":50}}
  {"type":"pairs","content":{"pairs":[{"left":"A","right":"1"},{"left":"B","right":"2"}]}}
  {"type":"passage","front":"Recite ...","content":{"text":"Verbatim text"}}

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

    const handleBulkSubmit = async (e: React.FormEvent) => {
        e.preventDefault()
        setIsSubmitting(true)

        const result = await createItemsFromJson({
            deckId,
            json: jsonCards,
        })

        if (result.success) {
            const successCount = result.created ?? 0
            const errorCount = result.errors?.length ?? 0
            const message =
                errorCount > 0
                    ? t('cardsCreated', {
                          success: successCount,
                          errors: t('withErrors', { count: errorCount }),
                      })
                    : t('cardsCreated', { success: successCount, errors: '' })
            toast.success(message)
            if (errorCount > 0 && result.errors) {
                toast.warning(
                    result.errors
                        .slice(0, 3)
                        .map((e) => `#${e.index + 1}: ${e.error}`)
                        .join('\n')
                )
            }
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
                        <ItemEditor
                            submitLabel={t('createCard')}
                            onSubmit={async (item) => {
                                const result = await createItem({
                                    deckId,
                                    item,
                                })
                                if (result.success) {
                                    toast.success(t('cardCreated'))
                                    return true
                                }
                                toast.error(result.error || t('createError'))
                                return false
                            }}
                        />
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
