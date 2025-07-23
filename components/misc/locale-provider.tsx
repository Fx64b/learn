'use client'

import { IntlProvider } from 'next-intl'

type Locale = 'en' | 'de'

interface LocaleProviderProps {
    children: React.ReactNode
    initialLocale: Locale
    messages: Record<Locale, Record<string, unknown>>
}

export function LocaleProvider({
    children,
    initialLocale,
    messages,
}: LocaleProviderProps) {
    return (
        <IntlProvider
            locale={initialLocale}
            messages={messages[initialLocale]}
            timeZone="Europe/Zurich"
        >
            {children}
        </IntlProvider>
    )
}
