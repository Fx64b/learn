import { type ClassValue, clsx } from 'clsx'
import { twMerge } from 'tailwind-merge'

export function cn(...inputs: ClassValue[]) {
    return twMerge(clsx(inputs))
}

export function absoluteUrl(path: string) {
    return `${process.env.NEXT_PUBLIC_SITE_URL || 'http://localhost'}${path}`
}
