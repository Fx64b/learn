'use client'

import { cn } from '@/lib/utils'
import {
    ChevronDown,
    Flame,
    GraduationCap,
    LifeBuoy,
    type LucideIcon,
    Rocket,
    Search,
    UserRound,
} from 'lucide-react'

import { useState } from 'react'

import { chunkyCard } from './styles'

export interface HelpCategory {
    key: string
    title: string
    items: { q: string; a: string }[]
}

const ICONS: Record<string, LucideIcon> = {
    start: Rocket,
    learning: GraduationCap,
    motivation: Flame,
    account: UserRound,
    trouble: LifeBuoy,
}

/** Searchable FAQ grouped by category. */
export function HelpCenter({
    categories,
    searchLabel,
    noResults,
}: {
    categories: HelpCategory[]
    searchLabel: string
    noResults: string
}) {
    const [query, setQuery] = useState('')
    const needle = query.trim().toLowerCase()
    const filtered = categories
        .map((c) => ({
            ...c,
            items: c.items.filter(
                (i) =>
                    !needle ||
                    i.q.toLowerCase().includes(needle) ||
                    i.a.toLowerCase().includes(needle)
            ),
        }))
        .filter((c) => c.items.length > 0)

    return (
        <div className="space-y-10">
            <div className="relative mx-auto max-w-xl">
                <Search
                    className="text-muted-foreground pointer-events-none absolute top-1/2 left-4 size-5 -translate-y-1/2"
                    aria-hidden
                />
                <input
                    type="search"
                    value={query}
                    onChange={(e) => setQuery(e.target.value)}
                    placeholder={searchLabel}
                    aria-label={searchLabel}
                    className="bg-card focus-visible:ring-ring/50 h-14 w-full rounded-2xl border-2 border-b-4 pr-4 pl-12 text-base outline-none focus-visible:ring-[3px]"
                />
            </div>

            {!needle && (
                <nav className="flex flex-wrap justify-center gap-2">
                    {categories.map((c) => {
                        const Icon = ICONS[c.key] ?? LifeBuoy
                        return (
                            <a
                                key={c.key}
                                href={`#${c.key}`}
                                className="hover:bg-accent inline-flex items-center gap-2 rounded-full border-2 px-4 py-1.5 text-sm font-semibold"
                            >
                                <Icon className="size-4" aria-hidden />
                                {c.title}
                            </a>
                        )
                    })}
                </nav>
            )}

            {filtered.length === 0 ? (
                <p className="text-muted-foreground text-center">{noResults}</p>
            ) : (
                filtered.map((c) => {
                    const Icon = ICONS[c.key] ?? LifeBuoy
                    return (
                        <section
                            key={c.key}
                            id={c.key}
                            className="scroll-mt-24 space-y-3"
                        >
                            <h2 className="flex items-center gap-2 text-xl font-extrabold tracking-tight">
                                <Icon
                                    className="size-5 text-emerald-500"
                                    aria-hidden
                                />
                                {c.title}
                            </h2>
                            {c.items.map((item) => (
                                <details
                                    key={item.q}
                                    open={Boolean(needle)}
                                    className={cn(
                                        chunkyCard,
                                        'group px-5 py-4'
                                    )}
                                >
                                    <summary className="flex cursor-pointer list-none items-center justify-between gap-4 font-bold [&::-webkit-details-marker]:hidden">
                                        {item.q}
                                        <ChevronDown
                                            className="text-muted-foreground size-5 shrink-0 transition-transform group-open:rotate-180"
                                            aria-hidden
                                        />
                                    </summary>
                                    <p className="text-muted-foreground mt-3 leading-relaxed">
                                        {item.a}
                                    </p>
                                </details>
                            ))}
                        </section>
                    )
                })
            )}
        </div>
    )
}
