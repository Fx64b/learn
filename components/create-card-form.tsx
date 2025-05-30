'use client'

import { toast } from 'sonner'

import { useState } from 'react'

import { useTranslations } from 'next-intl'

import {
    createFlashcard,
    createFlashcardsFromJson,
} from '@/app/actions/flashcard'

import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { Textarea } from '@/components/ui/textarea'

export function CreateCardForm({ deckId }: { deckId: string }) {
    const t = useTranslations('deck.cards')
    const [singleCard, setSingleCard] = useState({
        vorderseite: '',
        rueckseite: '',
    })
    const [jsonCards, setJsonCards] = useState('')
    const [isSubmitting, setIsSubmitting] = useState(false)

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
                                <label className="mb-2 block text-sm font-medium">
                                    JSON Array
                                </label>
                                <Textarea
                                    value={jsonCards}
                                    onChange={(e) =>
                                        setJsonCards(e.target.value)
                                    }
                                    className="h-72 w-full rounded border p-2"
                                    placeholder={t('jsonPlaceholder')}
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
