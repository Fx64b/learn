import { create } from 'zustand'
import { createJSONStorage, persist } from 'zustand/middleware'

const initialState = {
    animationsEnabled: false,
    animationSpeed: 200,
    animationDirection: 'horizontal' as const,
    theme: 'dark' as const,
}

interface UserPreferencesState {
    animationsEnabled: boolean
    animationSpeed: number
    animationDirection: 'horizontal' | 'vertical'
    theme: 'light' | 'dark' | 'system'
    setAnimationsEnabled: (enabled: boolean) => void
    setAnimationSpeed: (speed: number) => void
    setAnimationDirection: (direction: 'horizontal' | 'vertical') => void
    setTheme: (theme: 'system' | 'light' | 'dark') => void
}

export const useUserPreferences = create<UserPreferencesState>()(
    persist(
        (set) => ({
            ...initialState,
            setAnimationsEnabled: (enabled) => {
                set((state) => ({
                    ...state,
                    animationsEnabled: enabled,
                }))
            },
            setAnimationSpeed: (speed) =>
                set((state) => ({ ...state, animationSpeed: speed })),
            setAnimationDirection: (direction) =>
                set((state) => ({ ...state, animationDirection: direction })),
            setTheme: (theme) => set((state) => ({ ...state, theme })),
        }),
        {
            name: 'user-preferences',
            version: 1,
            storage: createJSONStorage(() => localStorage),
        }
    )
)
