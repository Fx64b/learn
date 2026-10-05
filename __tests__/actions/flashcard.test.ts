import * as dbUtils from '@/db/utils'
import { beforeEach, describe, expect, it, vi } from 'vitest'

import { getServerSession } from 'next-auth'

import {
    createItem,
    createItemsFromJson,
    deleteFlashcard,
    updateItem,
} from '@/app/actions/flashcard'

vi.mock('@/db/utils', () => ({
    getDeckById: vi.fn(),
    getFlashcardById: vi.fn(),
    getFlashcardsByDeckId: vi.fn(),
    createItems: vi.fn(),
    updateItem: vi.fn(),
    deleteItem: vi.fn(),
}))

const db = vi.mocked(dbUtils)
const deck = {
    id: 'd1',
    userId: 'u1',
    title: 'Deck',
    description: null,
    category: '[]',
    activeUntil: null,
    createdAt: new Date(),
}
const card = {
    id: 'c1',
    deckId: 'd1',
    type: 'basic',
    content: null,
    front: 'Q',
    back: 'A',
    isExamRelevant: true,
    difficultyLevel: 0,
    createdAt: new Date(),
}

describe('item actions', () => {
    beforeEach(() => {
        vi.clearAllMocks()
        vi.mocked(getServerSession).mockResolvedValue({
            user: { id: 'u1' },
        } as never)
        db.getDeckById.mockImplementation(async (id, userId) =>
            id === 'd1' && userId === 'u1' ? deck : undefined
        )
        db.getFlashcardById.mockResolvedValue(card)
        db.createItems.mockResolvedValue(['new-id'])
    })

    it('creates a valid item in an own deck', async () => {
        const res = await createItem({
            deckId: 'd1',
            item: { type: 'basic', front: 'Q', back: 'A' },
        })
        expect(res).toEqual({ success: true, id: 'new-id' })
        expect(db.createItems).toHaveBeenCalledWith('d1', [
            { type: 'basic', front: 'Q', back: 'A', content: null },
        ])
    })

    it('refuses to create items in decks of other users', async () => {
        const res = await createItem({
            deckId: 'other',
            item: { type: 'basic', front: 'Q', back: 'A' },
        })
        expect(res.success).toBe(false)
        expect(db.createItems).not.toHaveBeenCalled()
    })

    it('refuses invalid items', async () => {
        const res = await createItem({
            deckId: 'd1',
            item: { type: 'choice', front: 'Q', content: { options: ['a'] } },
        })
        expect(res.success).toBe(false)
        expect(db.createItems).not.toHaveBeenCalled()
    })

    it('refuses bulk imports into foreign decks', async () => {
        const res = await createItemsFromJson({
            deckId: 'other',
            json: '[{"front":"Q","back":"A"}]',
        })
        expect(res.success).toBe(false)
        expect(db.createItems).not.toHaveBeenCalled()
    })

    it('refuses to update or delete items of other users', async () => {
        db.getFlashcardById.mockResolvedValue({ ...card, deckId: 'other' })
        expect((await deleteFlashcard('c1')).success).toBe(false)
        expect(
            (
                await updateItem({
                    id: 'c1',
                    item: { type: 'basic', front: 'Q', back: 'B' },
                })
            ).success
        ).toBe(false)
        expect(db.deleteItem).not.toHaveBeenCalled()
        expect(db.updateItem).not.toHaveBeenCalled()
    })

    it('deletes own items with their reviews', async () => {
        expect((await deleteFlashcard('c1')).success).toBe(true)
        expect(db.deleteItem).toHaveBeenCalledWith('c1')
    })
})
