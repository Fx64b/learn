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

export interface ProgressData {
    date: string
    cardsReviewed: number
    correctPercentage: number
}

export interface CardsByDifficulty {
    difficultyCategory: number
    count: number
}
