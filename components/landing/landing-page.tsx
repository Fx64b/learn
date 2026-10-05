import { ACHIEVEMENTS } from '@/lib/gamification'
import { ITEM_TYPES, type ItemType } from '@/lib/items'
import { cn } from '@/lib/utils'
import {
    ArrowRight,
    BrainCircuit,
    Check,
    CheckCircle2,
    ChevronDown,
    Clock,
    FileText,
    Flame,
    GraduationCap,
    Layers,
    Medal,
    Play,
    Repeat,
    Shapes,
    Shuffle,
    Sparkles,
    Target,
    Trophy,
    Zap,
} from 'lucide-react'

import type * as React from 'react'

import { getTranslations } from 'next-intl/server'
import Link from 'next/link'

import { AchievementBadge } from '@/components/gamification/achievement-badge'
import { GoalRing } from '@/components/gamification/goal-ring'
import { MASTERY_COLORS } from '@/components/gamification/mastery-bar'
import { ITEM_TYPE_ICONS } from '@/components/items/item-type-badge'

import { ExerciseShowcase } from './exercise-showcase'
import { HeroDemo } from './hero-demo'

/** Exercise kinds each item type turns into (see lib/learn/planner.ts). */
const ITEM_EXERCISES: Record<ItemType, string[]> = {
    basic: ['multipleChoice', 'matchPairs', 'typeAnswer', 'flashcard'],
    choice: ['multipleChoice'],
    cloze: ['fillBlank', 'typeAnswer'],
    passage: ['buildSentence', 'firstLetter'],
    list: ['listRecall'],
    sequence: ['orderSequence'],
    number: ['multipleChoice', 'numberAnswer'],
    pairs: ['matchPairs'],
    diagram: ['labelDiagram', 'locateOnImage'],
}

const TYPE_TONES = [
    'bg-emerald-100 text-emerald-700 dark:bg-emerald-950 dark:text-emerald-300',
    'bg-sky-100 text-sky-700 dark:bg-sky-950 dark:text-sky-300',
    'bg-amber-100 text-amber-700 dark:bg-amber-950 dark:text-amber-300',
    'bg-violet-100 text-violet-700 dark:bg-violet-950 dark:text-violet-300',
    'bg-rose-100 text-rose-700 dark:bg-rose-950 dark:text-rose-300',
]

const chunky = 'rounded-2xl border-2 border-b-4 bg-card text-card-foreground'

function PrimaryCta({
    href,
    children,
}: {
    href: string
    children: React.ReactNode
}) {
    return (
        <Link
            href={href}
            className="focus-visible:ring-ring/50 inline-flex h-13 items-center justify-center gap-2 rounded-2xl border-2 border-b-4 border-emerald-700 bg-emerald-500 px-6 text-[15px] font-extrabold tracking-wide whitespace-nowrap text-white uppercase transition-transform outline-none hover:bg-emerald-500/90 focus-visible:ring-[3px] active:translate-y-0.5 active:border-b-2"
        >
            {children}
        </Link>
    )
}

function SecondaryCta({
    href,
    children,
}: {
    href: string
    children: React.ReactNode
}) {
    return (
        <Link
            href={href}
            className="bg-card hover:bg-accent focus-visible:ring-ring/50 inline-flex h-13 items-center justify-center gap-2 rounded-2xl border-2 border-b-4 px-6 text-[15px] font-extrabold tracking-wide whitespace-nowrap uppercase transition-transform outline-none focus-visible:ring-[3px] active:translate-y-0.5 active:border-b-2"
        >
            {children}
        </Link>
    )
}

function SectionHeading({
    eyebrow,
    title,
    description,
    tone = 'text-emerald-600 dark:text-emerald-400',
    align = 'center',
}: {
    eyebrow: string
    title: string
    description?: string
    tone?: string
    align?: 'center' | 'left'
}) {
    return (
        <div
            className={cn(
                'mb-10 space-y-3',
                align === 'center' && 'mx-auto max-w-2xl text-center'
            )}
        >
            <p
                className={cn(
                    'text-sm font-extrabold tracking-widest uppercase',
                    tone
                )}
            >
                {eyebrow}
            </p>
            <h2 className="text-3xl font-extrabold tracking-tight text-balance md:text-4xl">
                {title}
            </h2>
            {description && (
                <p className="text-muted-foreground text-lg text-pretty">
                    {description}
                </p>
            )}
        </div>
    )
}

function FloatingChip({
    className,
    children,
}: {
    className?: string
    children: React.ReactNode
}) {
    return (
        <div
            aria-hidden
            className={cn(
                'bg-card animate-float absolute z-10 hidden items-center gap-2 rounded-2xl border-2 border-b-4 px-3 py-2 text-sm font-bold shadow-lg sm:flex',
                className
            )}
        >
            {children}
        </div>
    )
}

/** Deterministic fake activity for the heatmap mock-up. */
const HEATMAP = Array.from({ length: 7 * 18 }, (_, i) => {
    const v = (i * 37 + (i % 7) * 11) % 10
    if (i > 7 * 18 - 4) return 0
    return v < 2 ? 0 : v < 4 ? 1 : v < 7 ? 2 : v < 9 ? 3 : 4
})
const HEAT = [
    'bg-muted',
    'bg-emerald-200 dark:bg-emerald-900',
    'bg-emerald-300 dark:bg-emerald-700',
    'bg-emerald-400 dark:bg-emerald-600',
    'bg-emerald-500 dark:bg-emerald-400',
]

export default async function LandingPage() {
    const t = await getTranslations('landing')
    const tTypes = await getTranslations('items.types')
    const tDesc = await getTranslations('items.descriptions')
    const tDeck = await getTranslations('deckPage.modes')
    const tMastery = await getTranslations('mastery')

    const trust = t.raw('hero.trust') as string[]
    const faq = t.raw('faq.items') as { q: string; a: string }[]
    const showcaseName = (kind: string) => t(`showcase.kinds.${kind}.name`)
    const achievements = ['streak-7', 'perfect-session', 'speed-matcher']
        .map((id) => ACHIEVEMENTS.find((a) => a.id === id)!)
        .map(({ id, icon, tier }) => ({ id, icon, tier }))

    return (
        <div className="overflow-x-clip">
            {/* Hero */}
            <section className="relative">
                <div
                    aria-hidden
                    className="pointer-events-none absolute inset-x-0 -top-24 -z-10 h-[36rem] bg-[radial-gradient(ellipse_at_top,rgb(16_185_129/0.18),transparent_60%)]"
                />
                <div className="mx-auto grid max-w-6xl items-center gap-12 px-4 py-14 md:py-20 lg:grid-cols-[1.05fr_1fr]">
                    <div className="space-y-7 text-center lg:text-left">
                        <span className="inline-flex items-center gap-2 rounded-full border-2 border-emerald-500/40 bg-emerald-50 px-3 py-1 text-sm font-semibold text-emerald-700 dark:bg-emerald-950/60 dark:text-emerald-300">
                            <Sparkles className="size-4" aria-hidden />
                            {t('hero.badge')}
                        </span>
                        <h1 className="text-4xl leading-[1.05] font-extrabold tracking-tight text-balance sm:text-5xl lg:text-6xl">
                            {t('hero.titleStart')}{' '}
                            <span className="relative whitespace-nowrap text-emerald-500">
                                {t('hero.titleHighlight')}
                                <svg
                                    aria-hidden
                                    viewBox="0 0 300 12"
                                    preserveAspectRatio="none"
                                    className="absolute -bottom-2 left-0 h-3 w-full text-emerald-400/70"
                                >
                                    <path
                                        d="M2 9 C 60 2, 120 2, 160 6 S 260 11, 298 4"
                                        fill="none"
                                        stroke="currentColor"
                                        strokeWidth="4"
                                        strokeLinecap="round"
                                    />
                                </svg>
                            </span>
                        </h1>
                        <p className="text-muted-foreground mx-auto max-w-xl text-lg text-pretty lg:mx-0">
                            {t('hero.description')}
                        </p>
                        <div className="flex flex-col justify-center gap-3 sm:flex-row lg:justify-start">
                            <PrimaryCta href="/login">
                                {t('hero.startLearning')}
                                <ArrowRight className="size-5" aria-hidden />
                            </PrimaryCta>
                            <SecondaryCta href="#try">
                                <Play
                                    className="size-4 fill-current"
                                    aria-hidden
                                />
                                {t('hero.tryIt')}
                            </SecondaryCta>
                        </div>
                        <ul className="text-muted-foreground flex flex-wrap justify-center gap-x-5 gap-y-2 text-sm lg:justify-start">
                            {trust.map((item) => (
                                <li
                                    key={item}
                                    className="flex items-center gap-1.5"
                                >
                                    <Check
                                        className="size-4 text-emerald-500"
                                        aria-hidden
                                    />
                                    {item}
                                </li>
                            ))}
                        </ul>
                    </div>

                    <div className="relative mx-auto w-full max-w-md lg:max-w-none">
                        <FloatingChip className="-top-5 -left-6 text-orange-500">
                            <Flame className="size-5 fill-orange-400" />
                            {t('hero.chips.streak')}
                        </FloatingChip>
                        <FloatingChip className="-right-6 -bottom-5 text-emerald-600 [animation-delay:-2s] dark:text-emerald-400">
                            <CheckCircle2 className="size-5" />
                            {t('hero.chips.goal')}
                        </FloatingChip>
                        <FloatingChip className="-top-5 -right-4 text-amber-600 [animation-delay:-4s] dark:text-amber-400">
                            <Medal className="size-5" />
                            {t('hero.chips.achievement')}
                        </FloatingChip>
                        <HeroDemo />
                    </div>
                </div>
            </section>

            {/* Stats */}
            <section className="bg-muted/30 border-y-2">
                <dl className="mx-auto grid max-w-5xl grid-cols-2 gap-6 px-4 py-8 md:grid-cols-4">
                    {(['types', 'exercises', 'srs', 'languages'] as const).map(
                        (key) => (
                            <div key={key} className="text-center">
                                <dt className="sr-only">
                                    {t(`stats.${key}.label`)}
                                </dt>
                                <dd className="text-3xl font-extrabold tracking-tight text-emerald-500">
                                    {t(`stats.${key}.value`)}
                                </dd>
                                <dd className="text-muted-foreground text-sm font-semibold">
                                    {t(`stats.${key}.label`)}
                                </dd>
                            </div>
                        )
                    )}
                </dl>
            </section>

            {/* Showcase */}
            <section
                id="try"
                className="mx-auto max-w-5xl scroll-mt-20 px-4 py-20"
            >
                <SectionHeading
                    eyebrow={t('showcase.eyebrow')}
                    title={t('showcase.title')}
                    description={t('showcase.description')}
                    tone="text-sky-600 dark:text-sky-400"
                />
                <ExerciseShowcase />
            </section>

            {/* Item types */}
            <section id="features" className="bg-muted/30 scroll-mt-20 py-20">
                <div className="mx-auto max-w-5xl px-4">
                    <SectionHeading
                        eyebrow={t('itemTypes.eyebrow')}
                        title={t('itemTypes.title')}
                        description={t('itemTypes.description')}
                    />
                    <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
                        {ITEM_TYPES.map((type, i) => {
                            const Icon = ITEM_TYPE_ICONS[type]
                            return (
                                <div
                                    key={type}
                                    className={cn(
                                        chunky,
                                        'flex flex-col gap-3 p-5'
                                    )}
                                >
                                    <div className="flex items-center gap-3">
                                        <span
                                            className={cn(
                                                'flex size-10 items-center justify-center rounded-xl',
                                                TYPE_TONES[
                                                    i % TYPE_TONES.length
                                                ]
                                            )}
                                        >
                                            <Icon
                                                className="size-5"
                                                aria-hidden
                                            />
                                        </span>
                                        <h3 className="text-lg font-bold">
                                            {tTypes(type)}
                                        </h3>
                                    </div>
                                    <p className="text-muted-foreground text-sm">
                                        {tDesc(type)}
                                    </p>
                                    <div className="mt-auto flex flex-wrap items-center gap-1.5 pt-1 text-xs">
                                        <span className="text-muted-foreground font-semibold">
                                            {t('itemTypes.becomes')}
                                        </span>
                                        {ITEM_EXERCISES[type].map((kind) => (
                                            <span
                                                key={kind}
                                                className="bg-muted rounded-full px-2 py-0.5 font-medium"
                                            >
                                                {showcaseName(kind)}
                                            </span>
                                        ))}
                                    </div>
                                </div>
                            )
                        })}
                    </div>
                </div>
            </section>

            {/* Mastery path */}
            <section className="mx-auto max-w-5xl px-4 py-20">
                <SectionHeading
                    eyebrow={t('mastery.eyebrow')}
                    title={t('mastery.title')}
                    description={t('mastery.description')}
                    tone="text-violet-600 dark:text-violet-400"
                />
                <ol className="relative grid gap-4 md:grid-cols-4">
                    <div
                        aria-hidden
                        className="bg-muted absolute top-7 right-[12.5%] left-[12.5%] hidden h-1.5 rounded-full md:block"
                    >
                        <div className="h-full w-full rounded-full bg-gradient-to-r from-zinc-400/50 via-amber-400 via-60% to-emerald-500" />
                    </div>
                    {(['new', 'learning', 'familiar', 'mastered'] as const).map(
                        (stage, i) => (
                            <li
                                key={stage}
                                className="relative flex flex-col items-center gap-3 text-center"
                            >
                                <span
                                    className={cn(
                                        'border-background flex size-14 items-center justify-center rounded-full border-4 text-lg font-extrabold text-white shadow-md',
                                        MASTERY_COLORS[stage],
                                        stage === 'new' && 'text-foreground'
                                    )}
                                >
                                    {i + 1}
                                </span>
                                <h3 className="font-bold">{tMastery(stage)}</h3>
                                <p className="text-muted-foreground text-sm">
                                    {t(`mastery.stages.${stage}.text`)}
                                </p>
                            </li>
                        )
                    )}
                </ol>
                <div className="mt-12 grid gap-4 md:grid-cols-3">
                    {(
                        [
                            ['mistakes', Repeat, 'text-rose-500'],
                            ['srs', BrainCircuit, 'text-violet-500'],
                            ['mixed', Shuffle, 'text-sky-500'],
                        ] as const
                    ).map(([key, Icon, tone]) => (
                        <div key={key} className={cn(chunky, 'p-5')}>
                            <Icon
                                className={cn('mb-3 size-7', tone)}
                                aria-hidden
                            />
                            <h3 className="mb-1 font-bold">
                                {t(`mastery.points.${key}.title`)}
                            </h3>
                            <p className="text-muted-foreground text-sm">
                                {t(`mastery.points.${key}.text`)}
                            </p>
                        </div>
                    ))}
                </div>
            </section>

            {/* Motivation */}
            <section className="bg-muted/30 py-20">
                <div className="mx-auto grid max-w-5xl items-center gap-12 px-4 lg:grid-cols-2">
                    <div>
                        <SectionHeading
                            eyebrow={t('motivation.eyebrow')}
                            title={t('motivation.title')}
                            description={t('motivation.description')}
                            tone="text-orange-600 dark:text-orange-400"
                            align="left"
                        />
                        <ul className="grid gap-5 sm:grid-cols-2">
                            {(
                                [
                                    ['xp', Zap, 'text-amber-500'],
                                    ['goal', Target, 'text-emerald-500'],
                                    ['streak', Flame, 'text-orange-500'],
                                    ['achievements', Trophy, 'text-yellow-500'],
                                ] as const
                            ).map(([key, Icon, tone]) => (
                                <li key={key} className="flex gap-3">
                                    <Icon
                                        className={cn(
                                            'mt-0.5 size-5 shrink-0',
                                            tone
                                        )}
                                        aria-hidden
                                    />
                                    <div>
                                        <h3 className="font-bold">
                                            {t(
                                                `motivation.points.${key}.title`
                                            )}
                                        </h3>
                                        <p className="text-muted-foreground text-sm">
                                            {t(`motivation.points.${key}.text`)}
                                        </p>
                                    </div>
                                </li>
                            ))}
                        </ul>
                    </div>

                    <div
                        aria-hidden
                        className={cn(chunky, 'space-y-4 p-5 shadow-xl')}
                    >
                        <div className="grid grid-cols-3 gap-2">
                            {(
                                [
                                    [
                                        'xp',
                                        '145',
                                        'border-amber-400 text-amber-600 dark:text-amber-400',
                                        Zap,
                                    ],
                                    [
                                        'accuracy',
                                        '92%',
                                        'border-emerald-500 text-emerald-600 dark:text-emerald-400',
                                        Target,
                                    ],
                                    [
                                        'combo',
                                        '11',
                                        'border-orange-400 text-orange-600 dark:text-orange-400',
                                        Flame,
                                    ],
                                ] as const
                            ).map(([key, value, tone, Icon]) => (
                                <div
                                    key={key}
                                    className={cn(
                                        'flex flex-col items-center rounded-xl border-2 border-b-4 p-2',
                                        tone
                                    )}
                                >
                                    <span className="text-[10px] font-bold tracking-wide uppercase">
                                        {t(`motivation.mock.${key}`)}
                                    </span>
                                    <span className="flex items-center gap-1 text-xl font-extrabold">
                                        <Icon className="size-4" />
                                        {value}
                                    </span>
                                </div>
                            ))}
                        </div>
                        <div className="flex flex-wrap items-center justify-around gap-4 rounded-xl border-2 p-3">
                            <div className="flex items-center gap-3">
                                <GoalRing value={30} goal={30} size={44}>
                                    <CheckCircle2 className="size-5 text-emerald-500" />
                                </GoalRing>
                                <div>
                                    <p className="text-sm font-bold">
                                        {t('motivation.mock.goal')}
                                    </p>
                                    <p className="text-muted-foreground text-xs">
                                        {t('motivation.mock.goalValue')}
                                    </p>
                                </div>
                            </div>
                            <div className="flex items-center gap-3">
                                <span className="flex size-11 items-center justify-center rounded-full bg-orange-100 dark:bg-orange-950">
                                    <Flame className="size-6 fill-orange-400 text-orange-500" />
                                </span>
                                <div>
                                    <p className="text-sm font-bold">
                                        {t('motivation.mock.streak')}
                                    </p>
                                    <p className="text-muted-foreground text-xs">
                                        {t('motivation.mock.streakText')}
                                    </p>
                                </div>
                            </div>
                        </div>
                        <div className="space-y-2 rounded-xl border-2 p-3">
                            <p className="text-sm font-bold">
                                {t('motivation.mock.activity')}
                            </p>
                            <div className="grid grid-flow-col grid-rows-7 gap-1">
                                {HEATMAP.map((level, i) => (
                                    <span
                                        key={i}
                                        className={cn(
                                            'aspect-square rounded-[3px]',
                                            HEAT[level]
                                        )}
                                    />
                                ))}
                            </div>
                        </div>
                        <div className="grid gap-2">
                            {achievements.map((a) => (
                                <AchievementBadge
                                    key={a.id}
                                    achievement={a}
                                    unlocked
                                    compact
                                />
                            ))}
                        </div>
                    </div>
                </div>
            </section>

            {/* AI */}
            <section className="mx-auto grid max-w-5xl items-center gap-12 px-4 py-20 lg:grid-cols-2">
                <div aria-hidden className="order-2 space-y-3 lg:order-1">
                    <div className={cn(chunky, 'space-y-3 p-4')}>
                        <div className="bg-muted/60 rounded-xl px-3 py-2 text-sm">
                            <Sparkles className="mr-1.5 inline size-4 text-violet-500" />
                            {t('ai.prompt')}
                        </div>
                        <div className="flex items-center gap-2 rounded-xl border-2 border-dashed px-3 py-2 text-sm">
                            <FileText className="text-muted-foreground size-4" />
                            {t('ai.file')}
                        </div>
                    </div>
                    <div className="flex justify-center">
                        <ChevronDown className="size-6 text-violet-500" />
                    </div>
                    <div className={cn(chunky, 'divide-y overflow-hidden')}>
                        <p className="text-muted-foreground px-4 py-2 text-xs font-bold tracking-wide uppercase">
                            {t('ai.generated')}
                        </p>
                        {(
                            [
                                'basic',
                                'cloze',
                                'sequence',
                                'list',
                                'number',
                            ] as const
                        ).map((type, i) => {
                            const Icon = ITEM_TYPE_ICONS[type]
                            return (
                                <div
                                    key={type}
                                    className="flex items-center gap-3 px-4 py-2.5"
                                >
                                    <span
                                        className={cn(
                                            'flex size-7 shrink-0 items-center justify-center rounded-lg',
                                            TYPE_TONES[i % TYPE_TONES.length]
                                        )}
                                    >
                                        <Icon className="size-4" />
                                    </span>
                                    <span className="min-w-0 flex-1 truncate text-sm">
                                        {t(`ai.items.${type}`)}
                                    </span>
                                    <span className="bg-muted shrink-0 rounded-md px-1.5 py-0.5 text-xs font-medium">
                                        {tTypes(type)}
                                    </span>
                                </div>
                            )
                        })}
                    </div>
                </div>
                <div className="order-1 lg:order-2">
                    <SectionHeading
                        eyebrow={t('ai.eyebrow')}
                        title={t('ai.title')}
                        description={t('ai.description')}
                        tone="text-violet-600 dark:text-violet-400"
                        align="left"
                    />
                    <p className="inline-flex items-center gap-2 rounded-full bg-violet-100 px-3 py-1 text-sm font-semibold text-violet-700 dark:bg-violet-950 dark:text-violet-300">
                        <Sparkles className="size-4" aria-hidden />
                        {t('ai.pro')}
                    </p>
                </div>
            </section>

            {/* Modes */}
            <section className="bg-muted/30 py-20">
                <div className="mx-auto max-w-5xl px-4">
                    <SectionHeading
                        eyebrow={t('modes.eyebrow')}
                        title={t('modes.title')}
                        description={t('modes.description')}
                        tone="text-sky-600 dark:text-sky-400"
                    />
                    <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
                        {(
                            [
                                [
                                    'learn',
                                    Play,
                                    'border-emerald-500 text-emerald-600 dark:text-emerald-400',
                                ],
                                [
                                    'flashcards',
                                    Layers,
                                    'text-sky-600 dark:text-sky-400',
                                ],
                                [
                                    'match',
                                    Shapes,
                                    'text-violet-600 dark:text-violet-400',
                                ],
                                [
                                    'test',
                                    GraduationCap,
                                    'text-amber-600 dark:text-amber-400',
                                ],
                            ] as const
                        ).map(([key, Icon, tone]) => (
                            <div key={key} className={cn(chunky, 'p-5', tone)}>
                                <span className="mb-3 flex size-11 items-center justify-center rounded-xl bg-current/10">
                                    <Icon className="size-6" aria-hidden />
                                </span>
                                <h3 className="mb-1 font-bold">{tDeck(key)}</h3>
                                <p className="text-muted-foreground text-sm">
                                    {tDeck(`${key}Description`)}
                                </p>
                            </div>
                        ))}
                    </div>
                </div>
            </section>

            {/* How it works */}
            <section
                id="how-it-works"
                className="mx-auto max-w-5xl scroll-mt-20 px-4 py-20"
            >
                <SectionHeading
                    eyebrow={t('howItWorks.eyebrow')}
                    title={t('howItWorks.title')}
                />
                <ol className="grid gap-6 md:grid-cols-3">
                    {([1, 2, 3] as const).map((n) => (
                        <li key={n} className="flex gap-4">
                            <span className="flex size-11 shrink-0 items-center justify-center rounded-2xl border-2 border-b-4 border-emerald-700 bg-emerald-500 text-lg font-extrabold text-white">
                                {n}
                            </span>
                            <div>
                                <h3 className="font-bold">
                                    {t(`howItWorks.step${n}.title`)}
                                </h3>
                                <p className="text-muted-foreground text-sm">
                                    {t(`howItWorks.step${n}.description`)}
                                </p>
                            </div>
                        </li>
                    ))}
                </ol>
            </section>

            {/* FAQ */}
            <section className="mx-auto max-w-3xl px-4 pb-20">
                <h2 className="mb-6 text-center text-3xl font-extrabold tracking-tight">
                    {t('faq.title')}
                </h2>
                <div className="space-y-3">
                    {faq.map((item) => (
                        <details
                            key={item.q}
                            className={cn(chunky, 'group px-5 py-4')}
                        >
                            <summary className="flex cursor-pointer list-none items-center justify-between gap-4 font-bold [&::-webkit-details-marker]:hidden">
                                {item.q}
                                <ChevronDown
                                    className="text-muted-foreground size-5 shrink-0 transition-transform group-open:rotate-180"
                                    aria-hidden
                                />
                            </summary>
                            <p className="text-muted-foreground mt-3 text-sm">
                                {item.a}
                            </p>
                        </details>
                    ))}
                </div>
            </section>

            {/* Final CTA */}
            <section className="px-4 pb-20">
                <div className="relative mx-auto max-w-5xl overflow-hidden rounded-3xl border-2 border-b-[6px] border-emerald-700 bg-emerald-500 px-6 py-14 text-center text-white">
                    <div
                        aria-hidden
                        className="pointer-events-none absolute inset-0 bg-[radial-gradient(circle_at_20%_20%,rgb(255_255_255/0.18),transparent_40%),radial-gradient(circle_at_80%_80%,rgb(255_255_255/0.12),transparent_40%)]"
                    />
                    <Clock
                        className="mx-auto mb-4 size-10 opacity-90"
                        aria-hidden
                    />
                    <h2 className="relative mx-auto mb-3 max-w-2xl text-3xl font-extrabold tracking-tight text-balance md:text-4xl">
                        {t('cta.title')}
                    </h2>
                    <p className="relative mx-auto mb-8 max-w-xl text-lg text-white/90">
                        {t('cta.description')}
                    </p>
                    <Link
                        href="/login"
                        className="relative inline-flex h-13 items-center justify-center gap-2 rounded-2xl border-2 border-b-4 border-emerald-900/30 bg-white px-8 text-base font-extrabold tracking-wide text-emerald-700 uppercase transition-transform outline-none hover:bg-white/90 focus-visible:ring-[3px] focus-visible:ring-white/60 active:translate-y-0.5 active:border-b-2"
                    >
                        {t('cta.button')}
                        <ArrowRight className="size-5" aria-hidden />
                    </Link>
                </div>
            </section>
        </div>
    )
}
