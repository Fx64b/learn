import { describe, test, expect, vi, beforeEach } from 'vitest'
import { saveStudySession, getTimeOfDayAnalysis } from '@/app/actions/study-session'
import { getServerSession } from 'next-auth'
import { getTranslations } from 'next-intl/server'
import { db } from '@/db'
import { studySessions } from '@/db/schema'
import { eq, sql } from 'drizzle-orm'
import { nanoid } from 'nanoid'

// Mock dependencies
vi.mock('next-auth')
vi.mock('next-intl/server')
vi.mock('@/db')
vi.mock('drizzle-orm')
vi.mock('nanoid')

const mockGetServerSession = vi.mocked(getServerSession)
const mockGetTranslations = vi.mocked(getTranslations)
const mockDb = vi.mocked(db)
const mockEq = vi.mocked(eq)
const mockSql = vi.mocked(sql)
const mockNanoid = vi.mocked(nanoid)

describe('Study Session Actions', () => {
  beforeEach(() => {
    vi.clearAllMocks()

    mockEq.mockImplementation((field, value) => ({ field, value, type: 'eq' }) as any)
    mockSql.mockImplementation((template) => ({ 
      template, 
      type: 'sql',
      as: vi.fn().mockReturnValue({ template, type: 'sql', alias: 'test' })
    }) as any)
    mockNanoid.mockReturnValue('test-session-id')

    // Mock translations
    const mockTranslations = {
      'notAuthenticated': 'Not authenticated',
    }
    mockGetTranslations.mockResolvedValue((key: string) => mockTranslations[key as keyof typeof mockTranslations] || key)

    // Mock db operations
    const mockUpdate = vi.fn().mockReturnThis()
    const mockSet = vi.fn().mockReturnThis()
    const mockWhere = vi.fn().mockResolvedValue(undefined)
    const mockInsert = vi.fn().mockReturnThis()
    const mockValues = vi.fn().mockResolvedValue(undefined)
    const mockSelect = vi.fn().mockReturnThis()
    const mockFrom = vi.fn().mockReturnThis()
    const mockGroupBy = vi.fn().mockReturnThis()
    const mockOrderBy = vi.fn().mockResolvedValue([])

    mockDb.update = mockUpdate
    mockDb.insert = mockInsert
    mockDb.select = mockSelect

    mockUpdate.mockImplementation(() => ({
      set: mockSet,
    }))

    mockSet.mockImplementation(() => ({
      where: mockWhere,
    }))

    mockInsert.mockImplementation(() => ({
      values: mockValues,
    }))

    mockSelect.mockImplementation(() => ({
      from: mockFrom,
    }))

    mockFrom.mockImplementation(() => ({
      where: mockWhere,
      groupBy: mockGroupBy,
    }))

    mockGroupBy.mockImplementation(() => ({
      orderBy: mockOrderBy,
    }))

    mockWhere.mockImplementation(() => ({
      groupBy: mockGroupBy,
    }))
  })

  describe('saveStudySession', () => {
    test('should save new study session successfully', async () => {
      const mockSession = {
        user: { id: 'user-1', email: 'test@example.com' }
      }
      mockGetServerSession.mockResolvedValue(mockSession)

      const studyData = {
        deckId: 'deck-1',
        startTime: new Date('2024-01-01T10:00:00Z'),
        endTime: new Date('2024-01-01T10:30:00Z'),
        duration: 1800000, // 30 minutes in ms
        cardsReviewed: 15,
        isCompleted: true
      }

      const result = await saveStudySession(studyData)

      expect(result).toEqual({ success: true, id: 'test-session-id' })
      expect(mockDb.insert).toHaveBeenCalledWith(studySessions)
      expect(mockDb.insert().values).toHaveBeenCalledWith({
        id: 'test-session-id',
        userId: 'user-1',
        deckId: 'deck-1',
        startTime: studyData.startTime,
        endTime: studyData.endTime,
        duration: 1800000,
        cardsReviewed: 15,
        isCompleted: true,
        createdAt: expect.any(Date)
      })
    })

    test('should update existing study session successfully', async () => {
      const mockSession = {
        user: { id: 'user-1', email: 'test@example.com' }
      }
      mockGetServerSession.mockResolvedValue(mockSession)

      const studyData = {
        id: 'existing-session-id',
        deckId: 'deck-1',
        startTime: new Date('2024-01-01T10:00:00Z'),
        endTime: new Date('2024-01-01T10:45:00Z'),
        duration: 2700000, // 45 minutes in ms
        cardsReviewed: 25,
        isCompleted: true
      }

      const result = await saveStudySession(studyData)

      expect(result).toEqual({ success: true, id: 'existing-session-id' })
      expect(mockDb.update).toHaveBeenCalledWith(studySessions)
      expect(mockDb.update().set).toHaveBeenCalledWith({
        endTime: studyData.endTime,
        duration: 2700000,
        cardsReviewed: 25,
        isCompleted: true
      })
    })

    test('should return early when no cards reviewed and no existing ID', async () => {
      const mockSession = {
        user: { id: 'user-1', email: 'test@example.com' }
      }
      mockGetServerSession.mockResolvedValue(mockSession)

      const studyData = {
        deckId: 'deck-1',
        startTime: new Date('2024-01-01T10:00:00Z'),
        endTime: new Date('2024-01-01T10:00:00Z'),
        duration: 0,
        cardsReviewed: 0,
        isCompleted: false
      }

      const result = await saveStudySession(studyData)

      expect(result).toEqual({ success: true })
      expect(mockDb.insert).not.toHaveBeenCalled()
      expect(mockDb.update).not.toHaveBeenCalled()
    })

    test('should save session with zero cards when ID is provided', async () => {
      const mockSession = {
        user: { id: 'user-1', email: 'test@example.com' }
      }
      mockGetServerSession.mockResolvedValue(mockSession)

      const studyData = {
        id: 'existing-session-id',
        deckId: 'deck-1',
        startTime: new Date('2024-01-01T10:00:00Z'),
        endTime: new Date('2024-01-01T10:00:00Z'),
        duration: 0,
        cardsReviewed: 0,
        isCompleted: false
      }

      const result = await saveStudySession(studyData)

      expect(result).toEqual({ success: true, id: 'existing-session-id' })
      expect(mockDb.update).toHaveBeenCalledWith(studySessions)
    })

    test('should return error when user not authenticated', async () => {
      mockGetServerSession.mockResolvedValue(null)

      const studyData = {
        deckId: 'deck-1',
        startTime: new Date(),
        endTime: new Date(),
        duration: 1800000,
        cardsReviewed: 15,
        isCompleted: true
      }

      const result = await saveStudySession(studyData)

      expect(result).toEqual({
        success: false,
        error: 'Not authenticated'
      })
    })

    test('should return error when user has no ID', async () => {
      const mockSession = {
        user: { email: 'test@example.com' } // No ID
      }
      mockGetServerSession.mockResolvedValue(mockSession)

      const studyData = {
        deckId: 'deck-1',
        startTime: new Date(),
        endTime: new Date(),
        duration: 1800000,
        cardsReviewed: 15,
        isCompleted: true
      }

      const result = await saveStudySession(studyData)

      expect(result).toEqual({
        success: false,
        error: 'Not authenticated'
      })
    })

    test('should handle database errors during insert', async () => {
      const mockSession = {
        user: { id: 'user-1', email: 'test@example.com' }
      }
      mockGetServerSession.mockResolvedValue(mockSession)

      const mockValues = vi.fn().mockRejectedValue(new Error('Database error'))
      const mockInsert = vi.fn().mockReturnValue({ values: mockValues })
      mockDb.insert = mockInsert

      const studyData = {
        deckId: 'deck-1',
        startTime: new Date(),
        endTime: new Date(),
        duration: 1800000,
        cardsReviewed: 15,
        isCompleted: true
      }

      const result = await saveStudySession(studyData)

      expect(result).toEqual({
        success: false,
        error: 'Failed to save study session'
      })
    })

    test('should handle database errors during update', async () => {
      const mockSession = {
        user: { id: 'user-1', email: 'test@example.com' }
      }
      mockGetServerSession.mockResolvedValue(mockSession)

      const mockWhere = vi.fn().mockRejectedValue(new Error('Update failed'))
      const mockSet = vi.fn().mockReturnValue({ where: mockWhere })
      const mockUpdate = vi.fn().mockReturnValue({ set: mockSet })
      mockDb.update = mockUpdate

      const studyData = {
        id: 'existing-session-id',
        deckId: 'deck-1',
        startTime: new Date(),
        endTime: new Date(),
        duration: 1800000,
        cardsReviewed: 15,
        isCompleted: true
      }

      const result = await saveStudySession(studyData)

      expect(result).toEqual({
        success: false,
        error: 'Failed to save study session'
      })
    })

    test('should validate required fields', async () => {
      const mockSession = {
        user: { id: 'user-1', email: 'test@example.com' }
      }
      mockGetServerSession.mockResolvedValue(mockSession)

      const studyData = {
        deckId: 'deck-1',
        startTime: new Date(),
        endTime: new Date(),
        duration: -1, // Invalid duration
        cardsReviewed: -5, // Invalid count
        isCompleted: true
      }

      const result = await saveStudySession(studyData)

      // Should still save since the action doesn't validate these fields
      expect(result).toEqual({ success: true, id: 'test-session-id' })
    })
  })

  describe('getTimeOfDayAnalysis', () => {
    test('should return time analysis for authenticated user', async () => {
      const mockSession = {
        user: { id: 'user-1', email: 'test@example.com' }
      }
      mockGetServerSession.mockResolvedValue(mockSession)

      const mockHourlyData = [
        { startTime: 9, sessions: 3, cardsTotal: 45, avgCards: 15 },
        { startTime: 14, sessions: 2, cardsTotal: 30, avgCards: 15 },
        { startTime: 20, sessions: 1, cardsTotal: 10, avgCards: 10 }
      ]

      const mockGroupBy = vi.fn().mockResolvedValue(mockHourlyData)
      const mockWhere = vi.fn().mockReturnValue({ groupBy: mockGroupBy })
      const mockFrom = vi.fn().mockReturnValue({ where: mockWhere })
      const mockSelect = vi.fn().mockReturnValue({ from: mockFrom })

      mockDb.select = mockSelect

      const result = await getTimeOfDayAnalysis()

      expect(result).toEqual({
        success: true,
        rawData: mockHourlyData
      })
      expect(mockDb.select).toHaveBeenCalled()
      expect(mockFrom).toHaveBeenCalledWith(studySessions)
      expect(mockWhere).toHaveBeenCalledWith({ field: studySessions.userId, value: 'user-1', type: 'eq' })
    })

    test('should return empty data when user not authenticated', async () => {
      mockGetServerSession.mockResolvedValue(null)

      const result = await getTimeOfDayAnalysis()

      expect(result).toEqual({
        success: false,
        data: [],
        mostProductiveHour: null
      })
    })

    test('should return empty data when user has no ID', async () => {
      const mockSession = {
        user: { email: 'test@example.com' } // No ID
      }
      mockGetServerSession.mockResolvedValue(mockSession)

      const result = await getTimeOfDayAnalysis()

      expect(result).toEqual({
        success: false,
        data: [],
        mostProductiveHour: null
      })
    })

    test('should handle database errors gracefully', async () => {
      const mockSession = {
        user: { id: 'user-1', email: 'test@example.com' }
      }
      mockGetServerSession.mockResolvedValue(mockSession)

      const mockGroupBy = vi.fn().mockRejectedValue(new Error('Database error'))
      const mockWhere = vi.fn().mockReturnValue({ groupBy: mockGroupBy })
      const mockFrom = vi.fn().mockReturnValue({ where: mockWhere })
      const mockSelect = vi.fn().mockReturnValue({ from: mockFrom })

      mockDb.select = mockSelect

      const result = await getTimeOfDayAnalysis()

      expect(result).toEqual({
        success: false,
        data: [],
        rawData: []
      })
    })

    test('should handle empty study sessions', async () => {
      const mockSession = {
        user: { id: 'user-1', email: 'test@example.com' }
      }
      mockGetServerSession.mockResolvedValue(mockSession)

      const mockGroupBy = vi.fn().mockResolvedValue([])
      const mockWhere = vi.fn().mockReturnValue({ groupBy: mockGroupBy })
      const mockFrom = vi.fn().mockReturnValue({ where: mockWhere })
      const mockSelect = vi.fn().mockReturnValue({ from: mockFrom })

      mockDb.select = mockSelect

      const result = await getTimeOfDayAnalysis()

      expect(result).toEqual({
        success: true,
        rawData: []
      })
    })

    test('should use SQL queries for time grouping', async () => {
      const mockSession = {
        user: { id: 'user-1', email: 'test@example.com' }
      }
      mockGetServerSession.mockResolvedValue(mockSession)

      const mockHourlyData = [
        { startTime: 10, sessions: 1, cardsTotal: 20, avgCards: 20 }
      ]

      const mockGroupBy = vi.fn().mockResolvedValue(mockHourlyData)
      const mockWhere = vi.fn().mockReturnValue({ groupBy: mockGroupBy })
      const mockFrom = vi.fn().mockReturnValue({ where: mockWhere })
      const mockSelect = vi.fn().mockReturnValue({ from: mockFrom })

      mockDb.select = mockSelect

      await getTimeOfDayAnalysis()

      // Verify SQL functions are called for time-based grouping
      expect(mockSql).toHaveBeenCalled()
      expect(mockGroupBy).toHaveBeenCalled()
    })
  })
})