import { z } from 'zod'

export const deckFormSchema = z.object({
    titel: z.string().min(1, 'Titel ist erforderlich').max(100),
    beschreibung: z.string().max(500).optional(),
    kategorie: z.string().min(1, 'Kategorie ist erforderlich').max(50),
})

export const flashcardFormSchema = z.object({
    vorderseite: z.string().min(1, 'Vorderseite ist erforderlich').max(1000),
    rückseite: z.string().min(1, 'Rückseite ist erforderlich').max(1000),
    istPrüfungsrelevant: z.boolean().optional(),
})

export const validateDeckForm = (data: unknown) => {
    return deckFormSchema.safeParse(data)
}

export const validateFlashcardForm = (data: unknown) => {
    return flashcardFormSchema.safeParse(data)
}
