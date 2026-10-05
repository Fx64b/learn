import type { ItemType } from '@/lib/items'
import { cn } from '@/lib/utils'
import {
    ArrowDownUp,
    Hash,
    Image,
    Link2,
    List,
    ListChecks,
    type LucideIcon,
    Quote,
    SquareDashed,
    StickyNote,
} from 'lucide-react'

export const ITEM_TYPE_ICONS: Record<ItemType, LucideIcon> = {
    basic: StickyNote,
    choice: ListChecks,
    cloze: SquareDashed,
    passage: Quote,
    list: List,
    sequence: ArrowDownUp,
    number: Hash,
    pairs: Link2,
    diagram: Image,
}

/** Small icon + label chip for an item type. Pass the translated label. */
export function ItemTypeBadge({
    type,
    label,
    className,
}: {
    type: ItemType
    label: string
    className?: string
}) {
    const Icon = ITEM_TYPE_ICONS[type]
    return (
        <span
            className={cn(
                'bg-muted text-muted-foreground inline-flex shrink-0 items-center gap-1 rounded-md px-1.5 py-0.5 text-xs font-medium',
                className
            )}
        >
            <Icon className="size-3.5" aria-hidden />
            {label}
        </span>
    )
}
