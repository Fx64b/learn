export interface FlashcardType {
    id: string
    vorderseite: string
    rückseite: string
    deckId: string
    istPrüfungsrelevant: boolean
    schwierigkeitsgrad: number
    erstelltAm: Date
    nextReview?: Date
}
