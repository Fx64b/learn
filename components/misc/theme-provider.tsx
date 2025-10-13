'use client'

import { useUserPreferences } from '@/store/userPreferences'

import { createContext, useEffect, useState } from 'react'

type Theme = 'dark' | 'light' | 'system'

interface ThemeProviderProps {
    children: React.ReactNode
}

const ThemeProviderContext = createContext<{
    theme: Theme
    setTheme: (theme: Theme) => void
}>({
    theme: 'system',
    setTheme: () => null,
})

export function ThemeProvider({ children }: ThemeProviderProps) {
    const userPreferences = useUserPreferences()
    const [theme, setTheme] = useState<Theme>('system' as Theme)

    useEffect(() => {
        setTheme(userPreferences.theme as Theme)
    }, [userPreferences.theme])

    useEffect(() => {
        const root = window.document.documentElement

        root.classList.remove('light', 'dark')

        if (theme === 'system') {
            const systemTheme = window.matchMedia(
                '(prefers-color-scheme: dark)'
            ).matches
                ? 'dark'
                : 'light'

            root.classList.add(systemTheme)
            return
        }

        root.classList.add(theme)
    }, [theme])

    return (
        <ThemeProviderContext.Provider value={{ theme, setTheme }}>
            {children}
        </ThemeProviderContext.Provider>
    )
}
