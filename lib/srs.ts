type ReviewGrade = 1 | 2 | 3 | 4 // 1=Again, 2=Hard, 3=Good, 4=Easy

interface FlashcardType {
    id: string
    vorderseite: string
    rückseite: string
    deckId: string
    istPrüfungsrelevant: boolean
    schwierigkeitsgrad: number
    erstelltAm: Date
    nextReview?: Date
}

// Basierend auf dem SuperMemo-2-Algorithmus
export function calculateNextReview(
    grade: ReviewGrade,
    previousInterval: number = 0,
    easeFactor: number = 2.5
): { nextInterval: number; newEaseFactor: number } {
    // previousInterval ist in Tagen
    // Wenn es die erste Bewertung ist oder "wieder"
    if (previousInterval === 0 || grade === 1) {
        return {
            nextInterval: 1,
            newEaseFactor: Math.max(1.3, easeFactor - 0.2),
        }
    }

    let newEaseFactor = easeFactor
    let nextInterval = 0

    switch (grade) {
        case 1:
            nextInterval = 1
            newEaseFactor = Math.max(1.3, easeFactor - 0.2)
            break
        case 2: // Hard
            nextInterval = Math.max(1, Math.ceil(previousInterval * 1.2))
            newEaseFactor = Math.max(1.3, easeFactor - 0.15)
            break
        case 3: // Good
            nextInterval = Math.ceil(previousInterval * easeFactor)
            break
        case 4: // Easy
            nextInterval = Math.ceil(previousInterval * easeFactor * 1.3)
            newEaseFactor = easeFactor + 0.15
            break
        default:
            nextInterval = Math.ceil(previousInterval * easeFactor)
    }

    // Kappen bei 365 Tagen
    nextInterval = Math.min(nextInterval, 365)

    return { nextInterval, newEaseFactor }
}

// Berechne Karten, die heute für die Wiederholung fällig sind
export function getDueCards(cards: FlashcardType[]): FlashcardType[] {
    const today = new Date()
    today.setHours(0, 0, 0, 0)

    return cards.filter((card) => {
        // Wenn die Karte noch nie wiederholt wurde oder für heute oder früher geplant ist
        if (!card.nextReview) return true

        const nextReviewDate = new Date(card.nextReview)
        nextReviewDate.setHours(0, 0, 0, 0)
        return nextReviewDate <= today
    })
}
