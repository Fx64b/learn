"use client"

import type React from "react"

import type { DeckType } from "@/types"
import { format } from "date-fns"
import { CalendarIcon, Loader2, Save, X } from "lucide-react"
import { toast } from "sonner"
import { useState } from "react"
import { updateDeck } from "@/app/actions/deck"

import { Button } from "@/components/ui/button"
import { Calendar } from "@/components/ui/calendar"
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover"
import { Textarea } from "@/components/ui/textarea"
import { cn } from "@/lib/utils"

interface DeckDetailsFormProps {
    deck: DeckType
}

export default function DeckDetailsForm({ deck }: DeckDetailsFormProps) {
    const [isSubmitting, setIsSubmitting] = useState(false)
    const [formData, setFormData] = useState({
        id: deck.id,
        titel: deck.titel,
        beschreibung: deck.beschreibung || "",
        kategorie: deck.kategorie,
        aktivBis: deck.aktivBis ? new Date(deck.aktivBis) : (null as Date | null),
    })

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault()
        setIsSubmitting(true)

        const formDataToSend = new FormData()
        formDataToSend.append("id", formData.id)
        formDataToSend.append("titel", formData.titel)
        formDataToSend.append("beschreibung", formData.beschreibung)
        formDataToSend.append("kategorie", formData.kategorie)

        if (formData.aktivBis) {
            formDataToSend.append("aktivBis", formData.aktivBis.toISOString())
        }

        try {
            const result = await updateDeck(formDataToSend)

            if (result.success) {
                toast.success("Deck erfolgreich aktualisiert!")
            } else {
                toast.error("Fehler beim Aktualisieren des Decks")
            }
        } catch (error) {
            toast.error("Ein unerwarteter Fehler ist aufgetreten")
        } finally {
            setIsSubmitting(false)
        }
    }

    return (
        <Card className="w-full max-w-3xl shadow-md">
            <CardHeader className="border-b bg-muted/30">
                <CardTitle className="text-xl md:text-2xl">Deck-Details bearbeiten</CardTitle>
            </CardHeader>
            <form onSubmit={handleSubmit}>
                <CardContent className="p-6 space-y-6">
                    <div className="grid gap-6 md:grid-cols-2">
                        <div className="space-y-2 col-span-2">
                            <Label htmlFor="titel" className="text-sm font-medium">
                                Titel <span className="text-red-500">*</span>
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

                        <div className="space-y-2 col-span-2">
                            <Label htmlFor="beschreibung" className="text-sm font-medium">
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

                        <div className="space-y-2 col-span-2 md:col-span-1">
                            <Label htmlFor="kategorie" className="text-sm font-medium">
                                Kategorie <span className="text-red-500">*</span>
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

                        <div className="space-y-2 col-span-2 md:col-span-1">
                            <Label htmlFor="aktivBis" className="text-sm font-medium">
                                Lernfrist
                            </Label>
                            <div className="flex w-full gap-2">
                                <Popover>
                                    <PopoverTrigger asChild>
                                        <Button
                                            variant="outline"
                                            className={cn(
                                                "w-full flex-1 justify-start text-left font-normal",
                                                !formData.aktivBis && "text-muted-foreground",
                                            )}
                                            id="aktivBis"
                                        >
                                            <CalendarIcon className="mr-2 h-4 w-4" />
                                            {formData.aktivBis ? format(formData.aktivBis, "dd.MM.yyyy") : <span>Kein Datum ausgewählt</span>}
                                        </Button>
                                    </PopoverTrigger>
                                    <PopoverContent className="p-0" align="start">
                                        <Calendar
                                            mode="single"
                                            selected={formData.aktivBis || undefined}
                                            onSelect={(date) =>
                                                setFormData((prev) => ({
                                                    ...prev,
                                                    aktivBis: date || null,
                                                }))
                                            }
                                            initialFocus
                                            disabled={(date) => date < new Date()}
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
                                        className="w-auto flex items-center justify-center gap-1"
                                    >
                                        <X className="h-3.5 w-3.5" />
                                    </Button>
                                )}
                            </div>
                            <p className="text-muted-foreground text-xs">
                                Datum, bis zu dem die Karten gelernt werden sollen (z.B. Prüfungsdatum)
                            </p>
                        </div>
                    </div>
                    <div className="flex flex-col sm:flex-row gap-3 justify-end border-t p-6 bg-muted/20">
                        <Button type="submit" disabled={isSubmitting} className="w-full sm:w-auto">
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
    )
}
