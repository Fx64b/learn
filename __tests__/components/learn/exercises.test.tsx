import { fireEvent, screen } from '@testing-library/react'
import { describe, expect, it, vi } from 'vitest'

import {
    FillBlank,
    MatchPairs,
    MultipleChoice,
    OrderSequence,
    TypeAnswer,
} from '@/components/learn'

import { renderWithIntl } from './render'

describe('MultipleChoice', () => {
    it('reports a correct pick', () => {
        const onResult = vi.fn()
        renderWithIntl(
            <MultipleChoice
                question="Q"
                options={['A', 'B', 'C']}
                answer="B"
                onResult={onResult}
            />
        )
        fireEvent.click(screen.getByRole('radio', { name: /B/ }))
        fireEvent.click(screen.getByRole('button', { name: 'Check' }))
        expect(onResult).toHaveBeenCalledWith({
            correct: true,
            response: ['B'],
        })
        expect(screen.getByText('Nicely done!')).toBeInTheDocument()
    })

    it('reports a wrong pick and shows the solution', () => {
        const onResult = vi.fn()
        renderWithIntl(
            <MultipleChoice
                question="Q"
                options={['A', 'B']}
                answer="B"
                onResult={onResult}
                onContinue={() => {}}
            />
        )
        fireEvent.click(screen.getByRole('radio', { name: /A/ }))
        fireEvent.click(screen.getByRole('button', { name: 'Check' }))
        expect(onResult.mock.calls[0][0].correct).toBe(false)
        expect(screen.getByRole('button', { name: 'Continue' })).toBeVisible()
    })
})

describe('TypeAnswer', () => {
    function type(value: string) {
        fireEvent.change(screen.getByPlaceholderText('Type your answer'), {
            target: { value },
        })
        fireEvent.click(screen.getByRole('button', { name: 'Check' }))
    }

    it('accepts aliases case-insensitively', () => {
        const onResult = vi.fn()
        renderWithIntl(
            <TypeAnswer
                question="Q"
                answer={['Canberra', 'Canberra City']}
                onResult={onResult}
            />
        )
        type('canberra city')
        expect(onResult.mock.calls[0][0]).toMatchObject({
            correct: true,
            response: { typo: false },
        })
    })

    it('accepts small typos and flags them', () => {
        const onResult = vi.fn()
        renderWithIntl(
            <TypeAnswer question="Q" answer="Canberra" onResult={onResult} />
        )
        type('Canbera')
        expect(onResult.mock.calls[0][0]).toMatchObject({
            correct: true,
            response: { typo: true },
        })
        expect(screen.getByText(/Watch the spelling/)).toBeInTheDocument()
    })

    it('lets the user override a wrong answer', () => {
        const onResult = vi.fn()
        renderWithIntl(
            <TypeAnswer
                question="Q"
                answer="Au"
                allowOverride
                onResult={onResult}
                onContinue={() => {}}
            />
        )
        type('Ag')
        expect(onResult.mock.calls[0][0].correct).toBe(false)
        fireEvent.click(screen.getByRole('button', { name: 'I was right' }))
        expect(onResult.mock.calls[1][0]).toMatchObject({
            correct: true,
            response: { overridden: true },
        })
    })
})

describe('MatchPairs', () => {
    it('completes when every pair is matched', () => {
        const onResult = vi.fn()
        renderWithIntl(
            <MatchPairs
                answer={[
                    { left: 'Canada', right: 'Ottawa' },
                    { left: 'Japan', right: 'Tokyo' },
                ]}
                onResult={onResult}
            />
        )
        fireEvent.click(screen.getByRole('button', { name: 'Canada' }))
        fireEvent.click(screen.getByRole('button', { name: 'Tokyo' }))
        fireEvent.click(screen.getByRole('button', { name: 'Canada' }))
        fireEvent.click(screen.getByRole('button', { name: 'Ottawa' }))
        fireEvent.click(screen.getByRole('button', { name: 'Japan' }))
        fireEvent.click(screen.getByRole('button', { name: 'Tokyo' }))
        expect(onResult).toHaveBeenCalledWith({
            correct: true,
            response: {
                mistakes: 1,
                wrongAttempts: [{ left: 'Canada', right: 'Tokyo' }],
            },
        })
    })
})

describe('FillBlank', () => {
    it('fills blanks from the word bank', () => {
        const onResult = vi.fn()
        renderWithIntl(
            <FillBlank
                question="I ___ a ___"
                answer={['drink', 'tea']}
                onResult={onResult}
            />
        )
        fireEvent.click(screen.getByRole('button', { name: 'drink' }))
        fireEvent.click(screen.getByRole('button', { name: 'tea' }))
        fireEvent.click(screen.getByRole('button', { name: 'Check' }))
        expect(onResult).toHaveBeenCalledWith({
            correct: true,
            response: ['drink', 'tea'],
        })
    })
})

describe('OrderSequence', () => {
    it('reports the submitted order', () => {
        const onResult = vi.fn()
        renderWithIntl(
            <OrderSequence
                question="Order"
                answer={['1', '2', '3']}
                onResult={onResult}
            />
        )
        fireEvent.click(screen.getByRole('button', { name: 'Check' }))
        const result = onResult.mock.calls[0][0]
        expect(result.response).toHaveLength(3)
        expect(result.correct).toBe(
            result.response.join() === ['1', '2', '3'].join()
        )
    })
})
