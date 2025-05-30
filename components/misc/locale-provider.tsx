'use client'

import { createContext, useContext, useEffect, useState } from 'react'

import { IntlProvider } from 'next-intl'

type Locale = 'en' | 'de'

interface LocaleContextType {
    locale: Locale
    setLocale: (locale: Locale) => void
}

const LocaleContext = createContext<LocaleContextType>({
    locale: 'en',
    setLocale: () => {},
})

export function useLocale() {
    return useContext(LocaleContext)
}

interface LocaleProviderProps {
    children: React.ReactNode
    initialLocale?: Locale
    messages: Record<Locale, Record<string, unknown>>
}

export function LocaleProvider({
    children,
    initialLocale = 'en',
    messages,
}: LocaleProviderProps) {
    const [locale, setLocaleState] = useState<Locale>(initialLocale)
    const [isClient, setIsClient] = useState(false)

    useEffect(() => {
        setIsClient(true)
        // Check localStorage on client side
        const savedLocale = localStorage.getItem('preferred-locale') as Locale
        if (savedLocale && (['en', 'de'] as const).includes(savedLocale)) {
            // Fix: use const assertion
            setLocaleState(savedLocale)
        }
    }, [])

    const setLocale = (newLocale: Locale) => {
        setLocaleState(newLocale)
        localStorage.setItem('preferred-locale', newLocale)
    }

    // Prevent hydration mismatch by using initialLocale during SSR
    const currentLocale = isClient ? locale : initialLocale

    return (
        <LocaleContext.Provider value={{ locale: currentLocale, setLocale }}>
            <IntlProvider
                locale={currentLocale}
                messages={messages[currentLocale]}
            >
                {children}
            </IntlProvider>
        </LocaleContext.Provider>
    )
}
