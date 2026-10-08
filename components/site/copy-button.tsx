'use client'

import { Check, Copy } from 'lucide-react'

import { useState } from 'react'

import { secondaryButton } from './styles'

export function CopyButton({
    value,
    label,
    copiedLabel,
}: {
    value: string
    label: string
    copiedLabel: string
}) {
    const [copied, setCopied] = useState(false)
    return (
        <button
            type="button"
            className={secondaryButton}
            onClick={async () => {
                try {
                    await navigator.clipboard.writeText(value)
                    setCopied(true)
                    setTimeout(() => setCopied(false), 2000)
                } catch {
                    // Clipboard is not available, but the address is visible anyway.
                }
            }}
        >
            {copied ? (
                <Check className="size-4" />
            ) : (
                <Copy className="size-4" />
            )}
            {copied ? copiedLabel : label}
        </button>
    )
}
