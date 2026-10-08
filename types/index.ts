export interface FlashcardType {
    id: string
    /** Item type, see lib/items/schema.ts */
    type?: string
    /** Type-specific JSON content */
    content?: string | null
    front: string
    back: string
    deckId: string
    isExamRelevant: boolean
    difficultyLevel: number
    createdAt: Date
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
    title: string
    description: string | null
    category: string
    activeUntil: Date | null
    createdAt: Date
}
