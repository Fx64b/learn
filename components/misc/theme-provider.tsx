'use client'

import { useUserPreferences } from '@/store/userPreferences'

import { createContext, useEffect } from 'react'

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
    const theme = useUserPreferences((s) => s.theme) as Theme
    const setTheme = useUserPreferences((s) => s.setTheme)

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
