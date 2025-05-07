import { create } from 'zustand'
import { persist } from 'zustand/middleware'

interface UserPreferencesState {
    animationsEnabled: boolean
    animationSpeed: number
    animationDirection: 'horizontal' | 'vertical'
    theme: 'light' | 'dark' | 'system'
    setAnimationsEnabled: (enabled: boolean) => void
    setAnimationSpeed: (speed: number) => void
    setAnimationDirection: (direction: 'horizontal' | 'vertical') => void
    setTheme: (theme: 'light' | 'dark' | 'system') => void
}

export const useUserPreferences = create<UserPreferencesState>()(
    persist(
        (set) => ({
            animationsEnabled: false,
            animationSpeed: 200,
            animationDirection: 'horizontal',
            theme: 'dark',
            setAnimationsEnabled: (enabled) =>
                set({ animationsEnabled: enabled }),
            setAnimationSpeed: (speed) => set({ animationSpeed: speed }),
            setAnimationDirection: (direction) =>
                set({ animationDirection: direction }),
            setTheme: (theme) => set({ theme }),
        }),
        {
            name: 'user-preferences',
        }
    )
)
