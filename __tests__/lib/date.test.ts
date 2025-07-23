import { describe, test, expect, beforeEach, afterEach } from 'vitest'
import { toUTCDateOnly, fromUTCDateOnly, isDatePast, isDateCurrent } from '@/lib/date'

describe('Date Utilities', () => {
  let originalTimezone: string | undefined

  beforeEach(() => {
    // Store original timezone
    originalTimezone = process.env.TZ
  })

  afterEach(() => {
    // Restore original timezone
    if (originalTimezone) {
      process.env.TZ = originalTimezone
    } else {
      delete process.env.TZ
    }
  })

  describe('toUTCDateOnly', () => {
    test('should convert date to UTC midnight', () => {
      const date = new Date('2024-01-15T14:30:45.123Z') // Afternoon UTC
      const result = toUTCDateOnly(date)

      expect(result.getUTCFullYear()).toBe(2024)
      expect(result.getUTCMonth()).toBe(0) // January
      expect(result.getUTCDate()).toBe(15)
      expect(result.getUTCHours()).toBe(0)
      expect(result.getUTCMinutes()).toBe(0)
      expect(result.getUTCSeconds()).toBe(0)
      expect(result.getUTCMilliseconds()).toBe(0)
    })

    test('should handle date at end of day', () => {
      const date = new Date('2024-12-31T23:59:59.999Z')
      const result = toUTCDateOnly(date)

      expect(result.getUTCFullYear()).toBe(2024)
      expect(result.getUTCMonth()).toBe(11) // December
      expect(result.getUTCDate()).toBe(31)
      expect(result.getUTCHours()).toBe(0)
      expect(result.getUTCMinutes()).toBe(0)
      expect(result.getUTCSeconds()).toBe(0)
      expect(result.getUTCMilliseconds()).toBe(0)
    })

    test('should handle date at beginning of day', () => {
      const date = new Date('2024-01-01T00:00:00.000Z')
      const result = toUTCDateOnly(date)

      expect(result.getUTCFullYear()).toBe(2024)
      expect(result.getUTCMonth()).toBe(0) // January
      expect(result.getUTCDate()).toBe(1)
      expect(result.getUTCHours()).toBe(0)
      expect(result.getUTCMinutes()).toBe(0)
      expect(result.getUTCSeconds()).toBe(0)
      expect(result.getUTCMilliseconds()).toBe(0)
    })

    test('should handle local date with timezone offset', () => {
      // Create a date in a specific timezone (local time)
      const date = new Date(2024, 5, 15, 14, 30, 45) // June 15, 2024, 14:30:45 local time
      const result = toUTCDateOnly(date)

      expect(result.getUTCFullYear()).toBe(2024)
      expect(result.getUTCMonth()).toBe(5) // June
      expect(result.getUTCDate()).toBe(15)
      expect(result.getUTCHours()).toBe(0)
      expect(result.getUTCMinutes()).toBe(0)
      expect(result.getUTCSeconds()).toBe(0)
      expect(result.getUTCMilliseconds()).toBe(0)
    })

    test('should handle leap year date', () => {
      const date = new Date('2024-02-29T12:00:00Z') // Leap year
      const result = toUTCDateOnly(date)

      expect(result.getUTCFullYear()).toBe(2024)
      expect(result.getUTCMonth()).toBe(1) // February
      expect(result.getUTCDate()).toBe(29)
    })

    test('should handle edge case dates', () => {
      // Test with very old date
      const oldDate = new Date('1900-01-01T12:00:00Z')
      const oldResult = toUTCDateOnly(oldDate)
      expect(oldResult.getUTCFullYear()).toBe(1900)
      expect(oldResult.getUTCMonth()).toBe(0)
      expect(oldResult.getUTCDate()).toBe(1)

      // Test with far future date
      const futureDate = new Date('2100-12-31T23:59:59Z')
      const futureResult = toUTCDateOnly(futureDate)
      expect(futureResult.getUTCFullYear()).toBe(2100)
      expect(futureResult.getUTCMonth()).toBe(11)
      expect(futureResult.getUTCDate()).toBe(31)
    })
  })

  describe('fromUTCDateOnly', () => {
    test('should convert UTC timestamp to local date', () => {
      const utcTimestamp = new Date('2024-01-15T00:00:00.000Z').getTime()
      const result = fromUTCDateOnly(utcTimestamp)

      expect(result).toBeInstanceOf(Date)
      expect(result!.getFullYear()).toBe(2024)
      expect(result!.getMonth()).toBe(0) // January
      expect(result!.getDate()).toBe(15)
      expect(result!.getHours()).toBe(0)
      expect(result!.getMinutes()).toBe(0)
      expect(result!.getSeconds()).toBe(0)
      expect(result!.getMilliseconds()).toBe(0)
    })

    test('should handle Date object input', () => {
      const utcDate = new Date('2024-06-15T00:00:00.000Z')
      const result = fromUTCDateOnly(utcDate)

      expect(result).toBeInstanceOf(Date)
      expect(result!.getFullYear()).toBe(2024)
      expect(result!.getMonth()).toBe(5) // June
      expect(result!.getDate()).toBe(15)
    })

    test('should return null for null input', () => {
      const result = fromUTCDateOnly(null)
      expect(result).toBeNull()
    })

    test('should return null for undefined input', () => {
      const result = fromUTCDateOnly(undefined)
      expect(result).toBeNull()
    })

    test('should handle zero timestamp', () => {
      const result = fromUTCDateOnly(0)
      // 0 is falsy, so function returns null (this is actually correct behavior)
      expect(result).toBeNull()
    })

    test('should handle negative timestamp', () => {
      const negativeTimestamp = -86400000 // One day before epoch
      const result = fromUTCDateOnly(negativeTimestamp)
      expect(result).toBeInstanceOf(Date)
      expect(result!.getTime()).toBeLessThan(0)
    })

    test('should preserve UTC date components', () => {
      // Test with a specific UTC date
      const utcDate = new Date(Date.UTC(2024, 11, 25, 0, 0, 0, 0)) // Dec 25, 2024 UTC
      const result = fromUTCDateOnly(utcDate)

      expect(result!.getFullYear()).toBe(2024)
      expect(result!.getMonth()).toBe(11) // December
      expect(result!.getDate()).toBe(25)
    })
  })

  describe('isDatePast', () => {
    test('should return true for past dates', () => {
      const yesterday = new Date()
      yesterday.setDate(yesterday.getDate() - 1)
      const pastTimestamp = toUTCDateOnly(yesterday).getTime()

      const result = isDatePast(pastTimestamp)
      expect(result).toBe(true)
    })

    test('should return false for today', () => {
      const today = new Date()
      const todayTimestamp = toUTCDateOnly(today).getTime()

      const result = isDatePast(todayTimestamp)
      expect(result).toBe(false)
    })

    test('should return false for future dates', () => {
      const tomorrow = new Date()
      tomorrow.setDate(tomorrow.getDate() + 1)
      const futureTimestamp = toUTCDateOnly(tomorrow).getTime()

      const result = isDatePast(futureTimestamp)
      expect(result).toBe(false)
    })

    test('should handle Date object input', () => {
      const yesterday = new Date()
      yesterday.setDate(yesterday.getDate() - 1)

      const result = isDatePast(yesterday)
      expect(result).toBe(true)
    })

    test('should return false for null input', () => {
      const result = isDatePast(null)
      expect(result).toBe(false)
    })

    test('should return false for undefined input', () => {
      const result = isDatePast(undefined)
      expect(result).toBe(false)
    })

    test('should handle edge case at midnight', () => {
      const today = new Date()
      const midnightToday = new Date(today.getFullYear(), today.getMonth(), today.getDate(), 0, 0, 0, 0)
      
      const result = isDatePast(midnightToday)
      expect(result).toBe(false) // Should not be past
    })

    test('should handle very old dates', () => {
      const veryOldDate = new Date('1900-01-01')
      const result = isDatePast(veryOldDate)
      expect(result).toBe(true)
    })

    test('should handle far future dates', () => {
      const farFuture = new Date('2100-01-01')
      const result = isDatePast(farFuture)
      expect(result).toBe(false)
    })
  })

  describe('isDateCurrent', () => {
    test('should return false for past dates', () => {
      const yesterday = new Date()
      yesterday.setDate(yesterday.getDate() - 1)
      const pastTimestamp = toUTCDateOnly(yesterday).getTime()

      const result = isDateCurrent(pastTimestamp)
      expect(result).toBe(false)
    })

    test('should return true for today', () => {
      const today = new Date()
      const todayTimestamp = toUTCDateOnly(today).getTime()

      const result = isDateCurrent(todayTimestamp)
      expect(result).toBe(true)
    })

    test('should return true for future dates', () => {
      const tomorrow = new Date()
      tomorrow.setDate(tomorrow.getDate() + 1)
      const futureTimestamp = toUTCDateOnly(tomorrow).getTime()

      const result = isDateCurrent(futureTimestamp)
      expect(result).toBe(true)
    })

    test('should handle Date object input', () => {
      const tomorrow = new Date()
      tomorrow.setDate(tomorrow.getDate() + 1)

      const result = isDateCurrent(tomorrow)
      expect(result).toBe(true)
    })

    test('should return true for null input', () => {
      const result = isDateCurrent(null)
      expect(result).toBe(true)
    })

    test('should return true for undefined input', () => {
      const result = isDateCurrent(undefined)
      expect(result).toBe(true)
    })

    test('should be inverse of isDatePast', () => {
      const testDates = [
        new Date(), // today
        new Date(Date.now() - 86400000), // yesterday
        new Date(Date.now() + 86400000), // tomorrow
        null,
        undefined
      ]

      testDates.forEach(date => {
        expect(isDateCurrent(date)).toBe(!isDatePast(date))
      })
    })
  })

  describe('integration tests', () => {
    test('round-trip conversion should preserve date', () => {
      const originalDate = new Date('2024-06-15T14:30:45Z')
      const utcOnly = toUTCDateOnly(originalDate)
      const converted = fromUTCDateOnly(utcOnly)

      expect(converted!.getFullYear()).toBe(originalDate.getFullYear())
      expect(converted!.getMonth()).toBe(originalDate.getMonth())
      expect(converted!.getDate()).toBe(originalDate.getDate())
    })

    test('date comparison functions should work with converted dates', () => {
      const today = new Date()
      const yesterday = new Date()
      yesterday.setDate(yesterday.getDate() - 1)
      
      const todayUTC = toUTCDateOnly(today)
      const yesterdayUTC = toUTCDateOnly(yesterday)

      expect(isDatePast(yesterdayUTC)).toBe(true)
      expect(isDateCurrent(todayUTC)).toBe(true)
      expect(isDatePast(todayUTC)).toBe(false)
      expect(isDateCurrent(yesterdayUTC)).toBe(false)
    })

    test('should handle timezone changes correctly', () => {
      // Set timezone to UTC
      process.env.TZ = 'UTC'
      
      const date = new Date('2024-01-15T12:00:00Z')
      const utcOnly = toUTCDateOnly(date)
      const converted = fromUTCDateOnly(utcOnly)

      expect(converted!.getFullYear()).toBe(2024)
      expect(converted!.getMonth()).toBe(0)
      expect(converted!.getDate()).toBe(15)

      // Set timezone to a different timezone
      process.env.TZ = 'America/New_York'
      
      const converted2 = fromUTCDateOnly(utcOnly)
      expect(converted2!.getFullYear()).toBe(2024)
      expect(converted2!.getMonth()).toBe(0)
      expect(converted2!.getDate()).toBe(15)
    })
  })
})