export interface FlashcardType {
    id: string
    vorderseite: string
    rueckseite: string
    deckId: string
    istPruefungsrelevant: boolean
    schwierigkeitsgrad: number
    erstelltAm: Date
    nextReview?: Date
}

export interface ProgressData {
    date: string
    cardsReviewed: number
    correctPercentage: number
}

export interface DeckType {
    id: string
    userId: string
    titel: string
    beschreibung: string | null
    kategorie: string
    aktivBis: Date | null
    erstelltAm: Date
}
