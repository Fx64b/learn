type ReviewGrade = 1 | 2 | 3 | 4 // 1=Again, 2=Hard, 3=Good, 4=Easy

// Basierend auf dem SuperMemo-2-Algorithmus
export function calculateNextReview(
    grade: ReviewGrade,
    previousInterval: number = 0,
    easeFactor: number = 2.5
): { nextInterval: number; newEaseFactor: number } {
    let newEaseFactor = easeFactor
    let nextInterval = 0

    // previousInterval ist in Tagen
    // Wenn es die erste Bewertung ist oder "wieder"
    if (previousInterval === 0 || grade === 1) {
        return {
            nextInterval: 1,
            newEaseFactor: Math.max(1.3, easeFactor - 0.2),
        }
    }

    if (grade === 2) {
        // Hard
        nextInterval = Math.max(1, Math.ceil(previousInterval * 1.2))
        newEaseFactor = Math.max(1.3, easeFactor - 0.15)
    } else if (grade === 3) {
        // Good
        nextInterval = Math.ceil(previousInterval * easeFactor)
    } else if (grade === 4) {
        // Easy
        nextInterval = Math.ceil(previousInterval * easeFactor * 1.3)
        newEaseFactor = easeFactor + 0.15
    }

    // Kappen bei 365 Tagen
    nextInterval = Math.min(nextInterval, 365)

    return { nextInterval, newEaseFactor }
}

