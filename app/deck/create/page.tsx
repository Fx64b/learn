'use client'

import { cn } from '@/lib/utils'
import { format } from 'date-fns'
import { ArrowLeft, CalendarIcon, X } from 'lucide-react'
import { toast } from 'sonner'

import React, { useState } from 'react'

import { useTranslations } from 'next-intl'
import Link from 'next/link'
import { useRouter } from 'next/navigation'

import { createDeck } from '@/app/actions/deck'

import { Button } from '@/components/ui/button'
import { Calendar } from '@/components/ui/calendar'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import {
    Popover,
    PopoverContent,
    PopoverTrigger,
} from '@/components/ui/popover'

export default function CreateDeckPage() {
    const router = useRouter()
    const t = useTranslations('deck.create')
    const common = useTranslations('common')

    const [isSubmitting, setIsSubmitting] = useState(false)
    const [formData, setFormData] = useState({
        titel: '',
        beschreibung: '',
        kategorie: '',
        aktivBis: null as Date | null,
    })

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault()
        setIsSubmitting(true)

        const formDataToSend = new FormData()
        formDataToSend.append('titel', formData.titel)
        formDataToSend.append('beschreibung', formData.beschreibung)
        formDataToSend.append('kategorie', formData.kategorie)

        if (formData.aktivBis) {
            formDataToSend.append('aktivBis', formData.aktivBis.toISOString())
        }

        const result = await createDeck(formDataToSend)

        if (result.success) {
            toast.success(t('success'))
            router.push(`/deck/${result.id}/edit`)
        } else {
            toast.error(t('error'))
        }

        setIsSubmitting(false)
    }

    return (
        <div className="container mx-auto max-w-2xl px-4 py-8">
            <div className="mb-8 flex items-center gap-4">
                <Button
                    className="h-10 w-10 md:h-5 md:w-5"
                    variant="ghost"
                    size="icon"
                    asChild
                >
                    <Link href="/">
                        <ArrowLeft />
                    </Link>
                </Button>
                <h1 className="text-2xl font-bold">{t('title')}</h1>
            </div>

            <Card>
                <CardHeader>
                    <CardTitle>{t('details')}</CardTitle>
                </CardHeader>
                <CardContent>
                    <form onSubmit={handleSubmit} className="space-y-4">
                        <div className="space-y-2">
                            <Label htmlFor="titel">{t('titleLabel')}</Label>
                            <Input
                                id="titel"
                                value={formData.titel}
                                onChange={(e) =>
                                    setFormData((prev) => ({
                                        ...prev,
                                        titel: e.target.value,
                                    }))
                                }
                                placeholder={t('titlePlaceholder')}
                                required
                            />
                        </div>

                        <div className="space-y-2">
                            <Label htmlFor="beschreibung">
                                {t('descriptionLabel')}
                            </Label>
                            <Input
                                id="beschreibung"
                                value={formData.beschreibung}
                                onChange={(e) =>
                                    setFormData((prev) => ({
                                        ...prev,
                                        beschreibung: e.target.value,
                                    }))
                                }
                                placeholder={t('descriptionPlaceholder')}
                            />
                        </div>

                        <div className="space-y-2">
                            <Label htmlFor="kategorie">
                                {t('categoryLabel')}
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
                            />
                        </div>

                        <div className="space-y-2">
                            <Label htmlFor="aktivBis">
                                {t('dueDateLabel')}
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
                                                    {t('dueDatePlaceholder')}
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
                                                formData.aktivBis || undefined
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
                                {t('dueDateHint')}
                            </p>
                        </div>

                        <div className="flex items-center justify-between gap-2 pt-4 md:justify-end">
                            <Button variant="outline" asChild>
                                <Link href="/">{common('cancel')}</Link>
                            </Button>
                            <Button type="submit" disabled={isSubmitting}>
                                {isSubmitting ? t('creating') : t('createDeck')}
                            </Button>
                        </div>
                    </form>
                </CardContent>
            </Card>
        </div>
    )
}
