'use client'

import { ACHIEVEMENTS } from '@/lib/gamification'
import { playSound } from '@/lib/learn/sound'
import { cn } from '@/lib/utils'
import { useUserPreferences } from '@/store/userPreferences'
import { Timer, Trophy, Zap } from 'lucide-react'
import { toast } from 'sonner'

import { useEffect, useRef, useState } from 'react'

import { useTranslations } from 'next-intl'
import Link from 'next/link'

import { completeMatchGame, loadMatchGame } from '@/app/actions/learn'

import { AchievementBadge } from '@/components/gamification/achievement-badge'
import { ActionButton, Tile, type TileState, shuffle } from '@/components/learn'

/** Seconds added for every wrong pairing. */
const PENALTY_MS = 1000

interface Card {
    id: number
    pair: number
    text: string
}

function deal(pairs: { left: string; right: string }[]): Card[] {
    return shuffle(
        pairs.flatMap((p, i) => [
            { id: i * 2, pair: i, text: p.left },
            { id: i * 2 + 1, pair: i, text: p.right },
        ])
    )
}

function formatTime(ms: number) {
    return (ms / 1000).toFixed(1)
}

interface MatchGameProps {
    deckId: string
    initialPairs: { left: string; right: string }[]
    initialBestMs: number | null
    backHref: string
}

/** Quizlet-style timed match: clear the board as fast as possible. */
export function MatchGame({
    deckId,
    initialPairs,
    initialBestMs,
    backHref,
}: MatchGameProps) {
    const t = useTranslations('match')
    const soundEnabled = useUserPreferences((s) => s.soundEnabled)
    const [pairs, setPairs] = useState(initialPairs)
    const [cards, setCards] = useState(() => deal(initialPairs))
    const [selected, setSelected] = useState<number | null>(null)
    const [cleared, setCleared] = useState<Set<number>>(new Set())
    const [wrong, setWrong] = useState<[number, number] | null>(null)
    const [startedAt, setStartedAt] = useState<number | null>(null)
    const [penalty, setPenalty] = useState(0)
    const [now, setNow] = useState(0)
    const [finalMs, setFinalMs] = useState<number | null>(null)
    const [bestMs, setBestMs] = useState(initialBestMs)
    const [result, setResult] = useState<{
        xp: number
        newBest: boolean
        achievements: string[]
    } | null>(null)
    const wrongTimer = useRef<ReturnType<typeof setTimeout>>(undefined)

    useEffect(() => {
        if (startedAt === null || finalMs !== null) return
        const id = setInterval(() => setNow(Date.now()), 100)
        return () => clearInterval(id)
    }, [startedAt, finalMs])

    useEffect(() => () => clearTimeout(wrongTimer.current), [])

    const elapsed =
        finalMs ?? (startedAt === null ? 0 : now - startedAt + penalty)

    async function finish(totalMs: number) {
        setFinalMs(totalMs)
        if (soundEnabled) playSound('complete')
        const res = await completeMatchGame({
            deckId,
            pairs: pairs.length,
            timeMs: Math.max(1000, Math.round(totalMs)),
            timezone: Intl.DateTimeFormat().resolvedOptions().timeZone,
        })
        if (!res.success) {
            toast.error(res.error)
            return
        }
        if (res.newBest) setBestMs(totalMs)
        setResult({
            xp: res.bonusXp,
            newBest: res.newBest,
            achievements: res.newAchievements,
        })
    }

    function pick(card: Card) {
        if (finalMs !== null || cleared.has(card.id)) return
        const start = startedAt ?? Date.now()
        if (startedAt === null) {
            setStartedAt(start)
            setNow(start)
        }
        if (selected === null) {
            setSelected(card.id)
            return
        }
        if (selected === card.id) {
            setSelected(null)
            return
        }
        const other = cards.find((c) => c.id === selected)!
        setSelected(null)
        if (other.pair === card.pair) {
            const next = new Set(cleared).add(card.id).add(other.id)
            setCleared(next)
            if (soundEnabled) playSound('correct')
            if (next.size === cards.length) {
                void finish(Date.now() - start + penalty)
            }
        } else {
            setPenalty((p) => p + PENALTY_MS)
            setWrong([card.id, other.id])
            if (soundEnabled) playSound('incorrect')
            clearTimeout(wrongTimer.current)
            wrongTimer.current = setTimeout(() => setWrong(null), 500)
        }
    }

    async function playAgain() {
        const res = await loadMatchGame(deckId)
        if (!res.success) {
            toast.error(res.error)
            return
        }
        setPairs(res.pairs)
        setCards(deal(res.pairs))
        setCleared(new Set())
        setSelected(null)
        setStartedAt(null)
        setPenalty(0)
        setFinalMs(null)
        setResult(null)
    }

    function state(card: Card): TileState {
        if (wrong?.includes(card.id)) return 'incorrect'
        if (selected === card.id) return 'selected'
        return 'default'
    }

    if (finalMs !== null) {
        const achievements = (result?.achievements ?? [])
            .map((id) => ACHIEVEMENTS.find((a) => a.id === id))
            .filter((a) => a !== undefined)
        return (
            <div className="flex flex-col items-center gap-6 py-6 text-center">
                <span className="animate-pop flex size-20 items-center justify-center rounded-full bg-amber-100 text-amber-500 dark:bg-amber-950">
                    <Trophy className="size-10" />
                </span>
                <h1 className="text-3xl font-extrabold">
                    {t('finished', { time: formatTime(finalMs) })}
                </h1>
                {result?.newBest && (
                    <p className="font-semibold text-emerald-600 dark:text-emerald-400">
                        {t('newBest')}
                    </p>
                )}
                <div className="flex gap-6 text-sm">
                    {bestMs !== null && (
                        <span className="flex items-center gap-1">
                            <Timer className="size-4" />
                            {t('best', { time: formatTime(bestMs) })}
                        </span>
                    )}
                    {result && (
                        <span className="flex items-center gap-1 font-bold text-amber-500">
                            <Zap className="size-4 fill-amber-400" />+
                            {result.xp} XP
                        </span>
                    )}
                </div>
                {achievements.map((a) => (
                    <div key={a.id} className="animate-pop w-full max-w-sm">
                        <AchievementBadge achievement={a} unlocked />
                    </div>
                ))}
                <div className="flex w-full flex-col-reverse gap-3 sm:flex-row sm:justify-center">
                    <ActionButton tone="neutral" asChild>
                        <Link href={backHref}>{t('done')}</Link>
                    </ActionButton>
                    <ActionButton tone="primary" onClick={playAgain} autoFocus>
                        {t('playAgain')}
                    </ActionButton>
                </div>
            </div>
        )
    }

    return (
        <div className="flex flex-col gap-6">
            <div className="flex items-center justify-between">
                <p className="text-muted-foreground text-sm">
                    {startedAt === null ? t('hint') : t('penalty')}
                </p>
                <div className="flex items-center gap-4 text-sm tabular-nums">
                    {bestMs !== null && (
                        <span className="text-muted-foreground">
                            {t('best', { time: formatTime(bestMs) })}
                        </span>
                    )}
                    <span className="flex items-center gap-1 text-xl font-bold">
                        <Timer className="size-5" />
                        {formatTime(elapsed)}
                    </span>
                </div>
            </div>
            <div className="grid grid-cols-2 gap-3 sm:grid-cols-3">
                {cards.map((card) => (
                    <Tile
                        key={card.id}
                        state={state(card)}
                        disabled={cleared.has(card.id)}
                        onClick={() => pick(card)}
                        className={cn(
                            'min-h-20 text-sm break-words transition-[opacity,transform] duration-300 sm:text-base',
                            cleared.has(card.id) && 'scale-90 opacity-0'
                        )}
                    >
                        {card.text}
                    </Tile>
                ))}
            </div>
        </div>
    )
}
