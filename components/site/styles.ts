/** Shared class names for the chunky, Duolingo-like look of the site. */

export const chunkyCard =
    'rounded-2xl border-2 border-b-4 bg-card text-card-foreground'

const buttonBase =
    'focus-visible:ring-ring/50 inline-flex h-13 items-center justify-center gap-2 rounded-2xl border-2 border-b-4 px-6 text-[15px] font-extrabold tracking-wide whitespace-nowrap uppercase transition-transform outline-none focus-visible:ring-[3px] active:translate-y-0.5 active:border-b-2'

export const primaryButton = `${buttonBase} border-emerald-700 bg-emerald-500 text-white hover:bg-emerald-500/90`

export const secondaryButton = `${buttonBase} bg-card hover:bg-accent`
