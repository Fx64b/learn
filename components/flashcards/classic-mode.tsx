'use client'

import { exerciseXp } from '@/lib/learn'
import { playSound } from '@/lib/learn/sound'
import { useUserPreferences } from '@/store/userPreferences'
import { Shuffle } from 'lucide-react'
import { nanoid } from 'nanoid'
import { toast } from 'sonner'

import { useCallback, useRef, useState } from 'react'

import { useTranslations } from 'next-intl'
import { useRouter } from 'next/navigation'

import { completeSession, submitExerciseResult } from '@/app/actions/learn'

import { Flashcard } from '@/components/flashcards/flashcard'
import {
    SessionSummary,
    type SummaryData,
} from '@/components/learn/session/session-summary'
import { SessionTopBar } from '@/components/learn/session/session-top-bar'
import { useResultQueue } from '@/components/learn/session/use-result-queue'
import { Button } from '@/components/ui/button'

interface ClassicCard {
    id: string
    front: string
    back: string
}

interface ClassicModeProps {
    deckId: string
    cards: ClassicCard[]
    backHref: string
}

const timezone = () => Intl.DateTimeFormat().resolvedOptions().timeZone

function shuffled<T>(items: T[]) {
    const out = [...items]
    for (let i = out.length - 1; i > 0; i--) {
        const j = Math.floor(Math.random() * (i + 1))
        ;[out[i], out[j]] = [out[j], out[i]]
    }
    return out
}

/** Classic flip cards with Again / Hard / Good / Easy, now with XP. */
export function ClassicMode({ deckId, cards, backHref }: ClassicModeProps) {
    const t = useTranslations('learn')
    const ts = useTranslations('session')
    const router = useRouter()
    const soundEnabled = useUserPreferences((s) => s.soundEnabled)
    const [order, setOrder] = useState(() => shuffled(cards))
    const [index, setIndex] = useState(0)
    const [combo, setCombo] = useState(0)
    const [xp, setXp] = useState(0)
    const [summary, setSummary] = useState<SummaryData | null>(null)
    const session = useRef({
        id: nanoid(),
        startedAt: Date.now(),
        cardStart: Date.now(),
        correct: 0,
        bestCombo: 0,
        missed: [] as string[],
    })
    const onError = useCallback(
        (error: string) => toast.error(error || ts('errors.save')),
        [ts]
    )
    const { enqueue, flush } = useResultQueue(onError)

    function restart() {
        session.current = {
            id: nanoid(),
            startedAt: Date.now(),
            cardStart: Date.now(),
            correct: 0,
            bestCombo: 0,
            missed: [],
        }
        setOrder(shuffled(cards))
        setIndex(0)
        setCombo(0)
        setXp(0)
        setSummary(null)
    }

    async function finish(finalXp: number) {
        const s = session.current
        const base: SummaryData = {
            mode: 'learn',
            xp: finalXp,
            exercises: order.length,
            correct: s.correct,
            durationMs: Date.now() - s.startedAt,
            bestCombo: s.bestCombo,
            missed: s.missed,
            streakExtended: false,
            reward: null,
            loading: true,
        }
        setSummary(base)
        if (soundEnabled) playSound('complete')
        await flush()
        const reward = await enqueue(() =>
            completeSession({
                sessionId: s.id,
                scope: deckId,
                startedAt: s.startedAt,
                exercises: order.length,
                mistakes: order.length - s.correct,
                completed: true,
                timezone: timezone(),
            })
        )
        setSummary({
            ...base,
            xp: finalXp + (reward?.bonusXp ?? 0),
            reward,
            streak: reward?.streak,
            loading: false,
        })
    }

    function handleRating(rating: number) {
        const card = order[index]
        if (!card || summary) return
        const s = session.current
        const correct = rating > 1
        const nextCombo = correct ? combo + 1 : 0
        s.bestCombo = Math.max(s.bestCombo, nextCombo)
        if (correct) s.correct++
        else s.missed.push(card.front)
        const durationMs = Date.now() - s.cardStart
        s.cardStart = Date.now()

        void enqueue(() =>
            submitExerciseResult({
                kind: 'flashcard',
                itemIds: [card.id],
                practice: false,
                retry: false,
                correct,
                grades: { [card.id]: rating },
                combo: nextCombo,
                durationMs,
                timezone: timezone(),
            })
        )

        const nextXp =
            xp + exerciseXp({ kind: 'flashcard', correct, combo: nextCombo })
        setCombo(nextCombo)
        setXp(nextXp)
        if (index + 1 >= order.length) void finish(nextXp)
        else setIndex(index + 1)
    }

    if (summary) {
        return (
            <SessionSummary
                data={summary}
                backHref={backHref}
                onRestart={async () => restart()}
            />
        )
    }

    const card = order[index]
    if (!card) return null

    return (
        <div className="flex flex-col gap-6">
            <SessionTopBar
                progress={index / order.length}
                combo={combo}
                xp={xp}
                onClose={() => router.push(backHref)}
            />
            <div className="text-muted-foreground flex items-center justify-between text-sm">
                <span className="tabular-nums">
                    {t('card')} {index + 1} {t('of')} {order.length}
                </span>
                <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => {
                        restart()
                        toast.success(t('cardsShuffled'))
                    }}
                >
                    <Shuffle className="size-4" />
                    {t('shuffle')}
                </Button>
            </div>
            <Flashcard
                key={`${session.current.id}-${card.id}`}
                front={card.front}
                back={card.back}
                onRating={handleRating}
                className="w-full"
            />
            <div className="text-muted-foreground hidden text-center text-sm md:block">
                <p>{t('keyboardHint')}</p>
                <p className="mt-1">{t('ratingHint')}</p>
            </div>
        </div>
    )
}
