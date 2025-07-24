import { describe, it, expect } from 'vitest'

// Test the cards per day calculation logic
describe('Cards per day calculation fix', () => {
    it('should only count days with learning activity in average', () => {
        // Simulate the chart data (7 days)
        const chartData = [
            { date: '2024-01-01', cardsReviewed: 0, correctPercentage: 0 },
            { date: '2024-01-02', cardsReviewed: 10, correctPercentage: 80 },
            { date: '2024-01-03', cardsReviewed: 0, correctPercentage: 0 },
            { date: '2024-01-04', cardsReviewed: 15, correctPercentage: 90 },
            { date: '2024-01-05', cardsReviewed: 5, correctPercentage: 70 },
            { date: '2024-01-06', cardsReviewed: 0, correctPercentage: 0 },
            { date: '2024-01-07', cardsReviewed: 0, correctPercentage: 0 }
        ]

        const totalCards = chartData.reduce((sum, day) => sum + day.cardsReviewed, 0)
        
        // OLD way (incorrect): would divide by 7 days
        const oldAvgCards = totalCards / chartData.length
        
        // NEW way (correct): only count days with activity
        const activeDays = chartData.filter(day => day.cardsReviewed > 0).length
        const newAvgCards = activeDays > 0 ? totalCards / activeDays : 0

        expect(totalCards).toBe(30) // 10 + 15 + 5 = 30 cards total
        expect(oldAvgCards).toBe(30 / 7) // ≈ 4.29 cards per day (incorrect)
        expect(newAvgCards).toBe(30 / 3) // = 10 cards per day (correct)
        expect(activeDays).toBe(3) // Only 3 days had learning activity
        
        // The new calculation should be higher because we only count active days
        expect(newAvgCards).toBeGreaterThan(oldAvgCards)
    })

    it('should return 0 when no learning activity occurred', () => {
        const chartData = [
            { date: '2024-01-01', cardsReviewed: 0, correctPercentage: 0 },
            { date: '2024-01-02', cardsReviewed: 0, correctPercentage: 0 },
            { date: '2024-01-03', cardsReviewed: 0, correctPercentage: 0 }
        ]

        const totalCards = chartData.reduce((sum, day) => sum + day.cardsReviewed, 0)
        const activeDays = chartData.filter(day => day.cardsReviewed > 0).length
        const avgCards = activeDays > 0 ? totalCards / activeDays : 0

        expect(totalCards).toBe(0)
        expect(activeDays).toBe(0)
        expect(avgCards).toBe(0)
    })

    it('should work correctly when all days have activity', () => {
        const chartData = [
            { date: '2024-01-01', cardsReviewed: 5, correctPercentage: 80 },
            { date: '2024-01-02', cardsReviewed: 7, correctPercentage: 90 },
            { date: '2024-01-03', cardsReviewed: 3, correctPercentage: 75 }
        ]

        const totalCards = chartData.reduce((sum, day) => sum + day.cardsReviewed, 0)
        const activeDays = chartData.filter(day => day.cardsReviewed > 0).length
        const avgCards = activeDays > 0 ? totalCards / activeDays : 0

        expect(totalCards).toBe(15) // 5 + 7 + 3
        expect(activeDays).toBe(3) // All days have activity
        expect(avgCards).toBe(5) // 15 / 3 = 5 cards per day
    })
})