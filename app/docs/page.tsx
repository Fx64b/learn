import { ACHIEVEMENTS } from '@/lib/gamification'
import { ITEM_TYPES } from '@/lib/items'
import { cn } from '@/lib/utils'
import {
    BrainCircuit,
    FileJson,
    Flame,
    GraduationCap,
    Keyboard,
    Layers,
    type LucideIcon,
    Rocket,
    Shapes,
    Sparkles,
    UserRound,
} from 'lucide-react'

import type * as React from 'react'

import { getTranslations } from 'next-intl/server'

import { MASTERY_COLORS } from '@/components/gamification/mastery-bar'
import { ITEM_TYPE_ICONS } from '@/components/items/item-type-badge'
import { DOCS_EXAMPLES } from '@/components/site/docs-examples'
import { PageHero } from '@/components/site/page-hero'
import { chunkyCard } from '@/components/site/styles'

export async function generateMetadata() {
    const t = await getTranslations('docs')
    return { title: t('metaTitle'), description: t('description') }
}

const SECTIONS: { id: string; icon: LucideIcon; tone: string }[] = [
    { id: 'start', icon: Rocket, tone: 'text-emerald-500' },
    { id: 'items', icon: Shapes, tone: 'text-sky-500' },
    { id: 'modes', icon: Layers, tone: 'text-violet-500' },
    { id: 'mastery', icon: GraduationCap, tone: 'text-amber-500' },
    { id: 'scheduling', icon: BrainCircuit, tone: 'text-rose-500' },
    { id: 'motivation', icon: Flame, tone: 'text-orange-500' },
    { id: 'import', icon: FileJson, tone: 'text-sky-500' },
    { id: 'ai', icon: Sparkles, tone: 'text-violet-500' },
    { id: 'shortcuts', icon: Keyboard, tone: 'text-emerald-500' },
    { id: 'account', icon: UserRound, tone: 'text-amber-500' },
]

function Section({
    id,
    icon: Icon,
    tone,
    title,
    children,
}: {
    id: string
    icon: LucideIcon
    tone: string
    title: string
    children: React.ReactNode
}) {
    return (
        <section
            id={id}
            className={cn(chunkyCard, 'scroll-mt-24 space-y-4 p-6 sm:p-8')}
        >
            <h2 className="flex items-center gap-3 text-2xl font-extrabold tracking-tight">
                <Icon className={cn('size-6 shrink-0', tone)} aria-hidden />
                {title}
            </h2>
            {children}
        </section>
    )
}

function Code({ value }: { value: unknown }) {
    return (
        <pre className="bg-muted overflow-x-auto rounded-xl p-4 text-xs leading-relaxed sm:text-sm">
            <code>{JSON.stringify(value, null, 2)}</code>
        </pre>
    )
}

function Steps({ steps }: { steps: string[] }) {
    return (
        <ol className="space-y-3">
            {steps.map((step, i) => (
                <li key={step} className="flex gap-3">
                    <span className="flex size-7 shrink-0 items-center justify-center rounded-lg border-2 border-b-4 border-emerald-700 bg-emerald-500 text-sm font-extrabold text-white">
                        {i + 1}
                    </span>
                    <span className="text-muted-foreground pt-0.5">{step}</span>
                </li>
            ))}
        </ol>
    )
}

function Bullets({ items }: { items: string[] }) {
    return (
        <ul className="text-muted-foreground list-disc space-y-1.5 pl-5 marker:text-emerald-500">
            {items.map((item) => (
                <li key={item}>{item}</li>
            ))}
        </ul>
    )
}

export default async function DocsPage() {
    const [t, tTypes, tDesc, tModes, tMastery, tLanding, tAch] =
        await Promise.all([
            getTranslations('docs'),
            getTranslations('items.types'),
            getTranslations('items.descriptions'),
            getTranslations('deckPage.modes'),
            getTranslations('mastery'),
            getTranslations('landing.mastery.stages'),
            getTranslations('achievements'),
        ])
    const s = (key: string) => `sections.${key}`
    const raw = (key: string) => t.raw(key) as string[]

    return (
        <div className="pb-20">
            <PageHero
                eyebrow={t('eyebrow')}
                title={t('title')}
                description={t('description')}
                tone="text-sky-600 dark:text-sky-400"
            />
            <div className="mx-auto grid max-w-6xl gap-8 px-4 lg:grid-cols-[14rem_1fr]">
                <nav aria-label={t('toc')} className="hidden lg:block">
                    <div className="sticky top-6 space-y-1">
                        <p className="text-muted-foreground mb-2 text-xs font-bold tracking-widest uppercase">
                            {t('toc')}
                        </p>
                        {SECTIONS.map(({ id, icon: Icon, tone }) => (
                            <a
                                key={id}
                                href={`#${id}`}
                                className="hover:bg-accent flex items-center gap-2 rounded-lg px-2 py-1.5 text-sm font-semibold"
                            >
                                <Icon
                                    className={cn('size-4', tone)}
                                    aria-hidden
                                />
                                {t(`${s(id)}.title`)}
                            </a>
                        ))}
                    </div>
                </nav>

                <div className="min-w-0 space-y-6">
                    <Section {...SECTIONS[0]} title={t(`${s('start')}.title`)}>
                        <p className="text-muted-foreground">
                            {t(`${s('start')}.intro`)}
                        </p>
                        <Steps steps={raw(`${s('start')}.steps`)} />
                    </Section>

                    <Section {...SECTIONS[1]} title={t(`${s('items')}.title`)}>
                        <p className="text-muted-foreground">
                            {t(`${s('items')}.intro`)}
                        </p>
                        <div className="space-y-3">
                            {ITEM_TYPES.map((type) => {
                                const Icon = ITEM_TYPE_ICONS[type]
                                return (
                                    <details
                                        key={type}
                                        className="group rounded-xl border-2 px-4 py-3"
                                    >
                                        <summary className="flex cursor-pointer list-none items-center gap-3 font-bold [&::-webkit-details-marker]:hidden">
                                            <Icon
                                                className="size-5 text-sky-500"
                                                aria-hidden
                                            />
                                            <span className="flex-1">
                                                {tTypes(type)}
                                            </span>
                                            <span className="text-muted-foreground hidden text-sm font-normal sm:inline">
                                                {tDesc(type)}
                                            </span>
                                        </summary>
                                        <div className="mt-3 space-y-3">
                                            <p className="text-muted-foreground sm:hidden">
                                                {tDesc(type)}
                                            </p>
                                            <p className="text-muted-foreground">
                                                {t(
                                                    `${s('items')}.write.${type}`
                                                )}
                                            </p>
                                            <p className="text-xs font-bold tracking-wide uppercase">
                                                {t('example')}
                                            </p>
                                            <Code value={DOCS_EXAMPLES[type]} />
                                        </div>
                                    </details>
                                )
                            })}
                        </div>
                    </Section>

                    <Section {...SECTIONS[2]} title={t(`${s('modes')}.title`)}>
                        <p className="text-muted-foreground">
                            {t(`${s('modes')}.intro`)}
                        </p>
                        <div className="grid gap-3 sm:grid-cols-2">
                            {(
                                [
                                    'learn',
                                    'flashcards',
                                    'match',
                                    'test',
                                ] as const
                            ).map((mode) => (
                                <div
                                    key={mode}
                                    className="rounded-xl border-2 p-4"
                                >
                                    <p className="font-bold">{tModes(mode)}</p>
                                    <p className="text-muted-foreground text-sm">
                                        {tModes(`${mode}Description`)}
                                    </p>
                                </div>
                            ))}
                        </div>
                        <p className="text-muted-foreground">
                            {t(`${s('modes')}.dashboard`)}
                        </p>
                    </Section>

                    <Section
                        {...SECTIONS[3]}
                        title={t(`${s('mastery')}.title`)}
                    >
                        <p className="text-muted-foreground">
                            {t(`${s('mastery')}.intro`)}
                        </p>
                        <div className="grid gap-3 sm:grid-cols-2">
                            {(
                                [
                                    'new',
                                    'learning',
                                    'familiar',
                                    'mastered',
                                ] as const
                            ).map((stage) => (
                                <div
                                    key={stage}
                                    className="flex gap-3 rounded-xl border-2 p-4"
                                >
                                    <span
                                        className={cn(
                                            'mt-1 size-3 shrink-0 rounded-full',
                                            MASTERY_COLORS[stage]
                                        )}
                                    />
                                    <div>
                                        <p className="font-bold">
                                            {tMastery(stage)}
                                        </p>
                                        <p className="text-muted-foreground text-sm">
                                            {tLanding(`${stage}.text`)}
                                        </p>
                                    </div>
                                </div>
                            ))}
                        </div>
                        <p className="text-muted-foreground">
                            {t(`${s('mastery')}.session`)}
                        </p>
                        <p className="text-muted-foreground">
                            {t(`${s('mastery')}.retries`)}
                        </p>
                        <p className="text-muted-foreground">
                            {t(`${s('mastery')}.ahead`)}
                        </p>
                    </Section>

                    <Section
                        {...SECTIONS[4]}
                        title={t(`${s('scheduling')}.title`)}
                    >
                        <p className="text-muted-foreground">
                            {t(`${s('scheduling')}.intro`)}
                        </p>
                        <Bullets items={raw(`${s('scheduling')}.grades`)} />
                    </Section>

                    <Section
                        {...SECTIONS[5]}
                        title={t(`${s('motivation')}.title`)}
                    >
                        <p className="text-muted-foreground">
                            {t(`${s('motivation')}.intro`)}
                        </p>
                        <Bullets items={raw(`${s('motivation')}.xp`)} />
                        <p className="text-muted-foreground">
                            {t(`${s('motivation')}.goal`)}
                        </p>
                        <p className="text-muted-foreground">
                            {t(`${s('motivation')}.streak`)}
                        </p>
                        <h3 className="pt-2 text-lg font-bold">
                            {t(`${s('motivation')}.achievementsTitle`)}
                        </h3>
                        <ul className="grid gap-2 sm:grid-cols-2">
                            {ACHIEVEMENTS.map((a) => (
                                <li
                                    key={a.id}
                                    className="rounded-xl border-2 px-3 py-2"
                                >
                                    <p className="text-sm font-bold">
                                        {tAch(`${a.id}.title`)}
                                    </p>
                                    <p className="text-muted-foreground text-xs">
                                        {tAch(`${a.id}.description`)}
                                    </p>
                                </li>
                            ))}
                        </ul>
                    </Section>

                    <Section {...SECTIONS[6]} title={t(`${s('import')}.title`)}>
                        <p className="text-muted-foreground">
                            {t(`${s('import')}.intro`)}
                        </p>
                        <Bullets items={raw(`${s('import')}.rules`)} />
                        <Code
                            value={[
                                DOCS_EXAMPLES.basic,
                                DOCS_EXAMPLES.list,
                                DOCS_EXAMPLES.number,
                            ]}
                        />
                    </Section>

                    <Section {...SECTIONS[7]} title={t(`${s('ai')}.title`)}>
                        <p className="text-muted-foreground">
                            {t(`${s('ai')}.intro`)}
                        </p>
                        <Steps steps={raw(`${s('ai')}.steps`)} />
                        <p className="text-muted-foreground">
                            {t(`${s('ai')}.plans`)}
                        </p>
                    </Section>

                    <Section
                        {...SECTIONS[8]}
                        title={t(`${s('shortcuts')}.title`)}
                    >
                        <div className="overflow-hidden rounded-xl border-2">
                            <table className="w-full text-sm">
                                <thead className="bg-muted/60 text-left">
                                    <tr>
                                        <th className="px-4 py-2 font-bold">
                                            {t(`${s('shortcuts')}.key`)}
                                        </th>
                                        <th className="px-4 py-2 font-bold">
                                            {t(`${s('shortcuts')}.action`)}
                                        </th>
                                    </tr>
                                </thead>
                                <tbody className="divide-y">
                                    {(
                                        t.raw(`${s('shortcuts')}.rows`) as [
                                            string,
                                            string,
                                        ][]
                                    ).map(([key, action]) => (
                                        <tr key={key + action}>
                                            <td className="px-4 py-2 whitespace-nowrap">
                                                <kbd className="bg-muted rounded-md border border-b-2 px-2 py-0.5 font-mono text-xs">
                                                    {key}
                                                </kbd>
                                            </td>
                                            <td className="text-muted-foreground px-4 py-2">
                                                {action}
                                            </td>
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
                        </div>
                    </Section>

                    <Section
                        {...SECTIONS[9]}
                        title={t(`${s('account')}.title`)}
                    >
                        <p className="text-muted-foreground">
                            {t(`${s('account')}.intro`)}
                        </p>
                        <Bullets items={raw(`${s('account')}.items`)} />
                        <p className="text-muted-foreground">
                            {t(`${s('account')}.data`)}
                        </p>
                    </Section>
                </div>
            </div>
        </div>
    )
}
