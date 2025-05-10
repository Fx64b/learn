'use client'

import { useUserPreferences } from '@/store/userPreferences'
import {
    ArrowDown,
    ArrowRight,
    Gauge,
    Monitor,
    Moon,
    Save,
    Sparkles,
    Sun,
} from 'lucide-react'
import { toast } from 'sonner'

import { useState } from 'react'

import { updateUserPreferences } from '@/app/actions/preferences'

import { Button } from '@/components/ui/button'
import { Card, CardContent } from '@/components/ui/card'
import { Label } from '@/components/ui/label'
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from '@/components/ui/select'
import { Separator } from '@/components/ui/separator'
import { Slider } from '@/components/ui/slider'
import { Switch } from '@/components/ui/switch'

interface ProfileSettingsProps {
    initialPreferences: {
        userId: string
        animationsEnabled: boolean
        animationSpeed: number
        animationDirection: 'horizontal' | 'vertical'
        theme: 'light' | 'dark' | 'system'
    }
}

export function ProfileSettings({ initialPreferences }: ProfileSettingsProps) {
    const [isSubmitting, setIsSubmitting] = useState(false)
    const userPreferences = useUserPreferences()

    const [localPrefs, setLocalPrefs] = useState({
        animationsEnabled: initialPreferences.animationsEnabled,
        animationSpeed: initialPreferences.animationSpeed,
        animationDirection: initialPreferences.animationDirection,
        theme: initialPreferences.theme,
    })

    const hasChanges =
        localPrefs.animationsEnabled !== initialPreferences.animationsEnabled ||
        localPrefs.animationSpeed !== initialPreferences.animationSpeed ||
        localPrefs.animationDirection !==
            initialPreferences.animationDirection ||
        localPrefs.theme !== initialPreferences.theme

    const updateAnimationsEnabled = (value: boolean) => {
        setLocalPrefs((prev) => ({ ...prev, animationsEnabled: value }))
    }

    const updateAnimationSpeed = (value: number) => {
        setLocalPrefs((prev) => ({ ...prev, animationSpeed: value }))
    }

    const updateAnimationDirection = (value: 'horizontal' | 'vertical') => {
        setLocalPrefs((prev) => ({ ...prev, animationDirection: value }))
    }

    const updateTheme = (value: 'light' | 'dark' | 'system') => {
        setLocalPrefs((prev) => ({ ...prev, theme: value }))
        userPreferences.setTheme(value)
    }

    const handleSubmit = async () => {
        setIsSubmitting(true)

        userPreferences.setAnimationsEnabled(localPrefs.animationsEnabled)
        userPreferences.setAnimationSpeed(localPrefs.animationSpeed)
        userPreferences.setAnimationDirection(localPrefs.animationDirection)
        userPreferences.setTheme(localPrefs.theme)

        const result = await updateUserPreferences({
            animationsEnabled: localPrefs.animationsEnabled,
            animationSpeed: localPrefs.animationSpeed,
            animationDirection: localPrefs.animationDirection,
            theme: localPrefs.theme,
        })

        if (result.success) {
            toast.success('Einstellungen gespeichert')
        } else {
            toast.error('Fehler beim Speichern der Einstellungen')
        }

        setIsSubmitting(false)
    }

    const getThemeIcon = (theme: string) => {
        switch (theme) {
            case 'light':
                return <Sun className="mr-2 h-4 w-4" />
            case 'dark':
                return <Moon className="mr-2 h-4 w-4" />
            case 'system':
                return <Monitor className="mr-2 h-4 w-4" />
            default:
                return null
        }
    }

    const getDirectionIcon = (direction: string) => {
        return direction === 'horizontal' ? (
            <ArrowRight className="mr-2 h-4 w-4" />
        ) : (
            <ArrowDown className="mr-2 h-4 w-4" />
        )
    }

    return (
        <Card className="shadow-sm">
            <CardContent className="p-6">
                <div className="grid w-full grid-cols-1 gap-8 md:grid-cols-2">
                    <div className="w-full space-y-4">
                        <div className="flex items-center gap-2">
                            <Sun className="h-5 w-5 text-amber-500" />
                            <h3 className="text-lg font-medium">Darstellung</h3>
                        </div>
                        <Separator />
                        <div className="grid gap-6 sm:grid-cols-2">
                            <div className="space-y-2">
                                <Label
                                    htmlFor="theme"
                                    className="text-sm font-medium"
                                >
                                    Theme
                                </Label>
                                <Select
                                    value={localPrefs.theme}
                                    onValueChange={updateTheme}
                                >
                                    <SelectTrigger
                                        id="theme"
                                        className="w-full"
                                    >
                                        <SelectValue placeholder="Wähle ein Theme">
                                            <div className="flex items-center">
                                                {getThemeIcon(localPrefs.theme)}
                                                <span>
                                                    {localPrefs.theme ===
                                                        'light' && 'Hell'}
                                                    {localPrefs.theme ===
                                                        'dark' && 'Dunkel'}
                                                    {localPrefs.theme ===
                                                        'system' && 'System'}
                                                </span>
                                            </div>
                                        </SelectValue>
                                    </SelectTrigger>
                                    <SelectContent>
                                        <SelectItem value="light">
                                            <div className="flex items-center">
                                                <Sun className="mr-2 h-4 w-4" />
                                                <span>Hell</span>
                                            </div>
                                        </SelectItem>
                                        <SelectItem value="dark">
                                            <div className="flex items-center">
                                                <Moon className="mr-2 h-4 w-4" />
                                                <span>Dunkel</span>
                                            </div>
                                        </SelectItem>
                                        <SelectItem value="system">
                                            <div className="flex items-center">
                                                <Monitor className="mr-2 h-4 w-4" />
                                                <span>System</span>
                                            </div>
                                        </SelectItem>
                                    </SelectContent>
                                </Select>
                                <p className="text-muted-foreground mt-1 text-xs">
                                    Wähle zwischen hellem, dunklem oder
                                    System-Theme.
                                </p>
                            </div>
                        </div>
                    </div>

                    <div className="w-full space-y-4">
                        <div className="flex items-center gap-2">
                            <Sparkles className="h-5 w-5 text-purple-500" />
                            <h3 className="text-lg font-medium">
                                Animations-Einstellungen
                            </h3>
                        </div>
                        <Separator />
                        <div className="space-y-6">
                            <div className="flex items-center justify-between">
                                <div className="space-y-0.5">
                                    <Label
                                        htmlFor="animations-enabled"
                                        className="text-sm font-medium"
                                    >
                                        Animationen aktivieren
                                    </Label>
                                    <p className="text-muted-foreground text-xs">
                                        Aktiviere oder deaktiviere alle
                                        Animationen.
                                    </p>
                                </div>
                                <Switch
                                    id="animations-enabled"
                                    checked={localPrefs.animationsEnabled}
                                    onCheckedChange={updateAnimationsEnabled}
                                />
                            </div>

                            {localPrefs.animationsEnabled && (
                                <div className="bg-muted/50 mt-2 space-y-6 rounded-lg p-4">
                                    <div className="space-y-2">
                                        <div className="flex items-center gap-2">
                                            <Gauge className="text-muted-foreground h-4 w-4" />
                                            <Label
                                                htmlFor="animation-speed"
                                                className="text-sm font-medium"
                                            >
                                                Geschwindigkeit
                                            </Label>
                                        </div>
                                        <div className="flex items-center gap-4">
                                            <Slider
                                                id="animation-speed"
                                                value={[
                                                    localPrefs.animationSpeed,
                                                ]}
                                                onValueChange={(values) =>
                                                    updateAnimationSpeed(
                                                        values[0]
                                                    )
                                                }
                                                max={500}
                                                min={100}
                                                step={50}
                                                className="flex-1"
                                            />
                                            <span className="text-muted-foreground w-16 text-right font-mono text-sm">
                                                {localPrefs.animationSpeed}
                                                ms
                                            </span>
                                        </div>
                                        <p className="text-muted-foreground mt-1 text-xs">
                                            Niedrigere Werte = schnellere
                                            Animationen.
                                        </p>
                                    </div>

                                    <div className="space-y-2">
                                        <div className="flex items-center gap-2">
                                            {getDirectionIcon(
                                                localPrefs.animationDirection
                                            )}
                                            <Label
                                                htmlFor="animation-direction"
                                                className="text-sm font-medium"
                                            >
                                                Richtung
                                            </Label>
                                        </div>
                                        <Select
                                            value={
                                                localPrefs.animationDirection
                                            }
                                            onValueChange={
                                                updateAnimationDirection
                                            }
                                        >
                                            <SelectTrigger
                                                id="animation-direction"
                                                className="w-full"
                                            >
                                                <SelectValue placeholder="Richtung">
                                                    <div className="flex items-center">
                                                        {getDirectionIcon(
                                                            localPrefs.animationDirection
                                                        )}
                                                        <span>
                                                            {localPrefs.animationDirection ===
                                                                'horizontal' &&
                                                                'Horizontal'}
                                                            {localPrefs.animationDirection ===
                                                                'vertical' &&
                                                                'Vertikal'}
                                                        </span>
                                                    </div>
                                                </SelectValue>
                                            </SelectTrigger>
                                            <SelectContent>
                                                <SelectItem value="horizontal">
                                                    <div className="flex items-center">
                                                        <ArrowRight className="mr-2 h-4 w-4" />
                                                        <span>Horizontal</span>
                                                    </div>
                                                </SelectItem>
                                                <SelectItem value="vertical">
                                                    <div className="flex items-center">
                                                        <ArrowDown className="mr-2 h-4 w-4" />
                                                        <span>Vertikal</span>
                                                    </div>
                                                </SelectItem>
                                            </SelectContent>
                                        </Select>
                                        <p className="text-muted-foreground mt-1 text-xs">
                                            Bestimmt die Hauptrichtung der
                                            Animationen.
                                        </p>
                                    </div>
                                </div>
                            )}
                        </div>
                    </div>
                </div>
                <div className="mt-4 flex w-full justify-end border-t pt-4">
                    <Button
                        onClick={handleSubmit}
                        disabled={isSubmitting || !hasChanges}
                        className="gap-2"
                    >
                        {isSubmitting ? (
                            <>Wird gespeichert...</>
                        ) : (
                            <>
                                <Save className="h-4 w-4" />
                                <span>Einstellungen speichern</span>
                            </>
                        )}
                    </Button>
                </div>
            </CardContent>
        </Card>
    )
}
