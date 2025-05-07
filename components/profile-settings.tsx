"use client"

import { useUserPreferences } from "@/store/userPreferences"
import { toast } from "sonner"
import { useEffect, useState } from "react"
import { updateUserPreferences } from "@/app/actions/preferences"
import { Button } from "@/components/ui/button"
import { Card, CardContent } from "@/components/ui/card"
import { Label } from "@/components/ui/label"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Slider } from "@/components/ui/slider"
import { Switch } from "@/components/ui/switch"
import { Separator } from "@/components/ui/separator"
import { Moon, Sun, Monitor, Sparkles, Gauge, ArrowRight, ArrowDown, Save } from "lucide-react"

interface ProfileSettingsProps {
    initialPreferences: {
        userId: string
        animationsEnabled: boolean
        animationSpeed: number
        animationDirection: "horizontal" | "vertical"
        theme: "light" | "dark" | "system"
    }
}

export function ProfileSettings({ initialPreferences }: ProfileSettingsProps) {
    const [isSubmitting, setIsSubmitting] = useState(false)
    const [hasChanges, setHasChanges] = useState(false)
    const userPreferences = useUserPreferences()

    // Initialize from server data
    useEffect(() => {
        // Add a check to prevent unnecessary updates
        if (
            initialPreferences.animationsEnabled !== userPreferences.animationsEnabled ||
            initialPreferences.animationSpeed !== userPreferences.animationSpeed ||
            initialPreferences.animationDirection !== userPreferences.animationDirection ||
            initialPreferences.theme !== userPreferences.theme
        ) {
            userPreferences.setAnimationsEnabled(initialPreferences.animationsEnabled)
            userPreferences.setAnimationSpeed(initialPreferences.animationSpeed)
            userPreferences.setAnimationDirection(initialPreferences.animationDirection)
            userPreferences.setTheme(initialPreferences.theme)
            setHasChanges(false)
        }
    }, [initialPreferences, userPreferences])

    // Track changes
    useEffect(() => {
        if (
            initialPreferences.animationsEnabled !== userPreferences.animationsEnabled ||
            initialPreferences.animationSpeed !== userPreferences.animationSpeed ||
            initialPreferences.animationDirection !== userPreferences.animationDirection ||
            initialPreferences.theme !== userPreferences.theme
        ) {
            setHasChanges(true)
        } else {
            setHasChanges(false)
        }
    }, [
        userPreferences.animationsEnabled,
        userPreferences.animationSpeed,
        userPreferences.animationDirection,
        userPreferences.theme,
        initialPreferences,
    ])

    const handleSubmit = async () => {
        setIsSubmitting(true)

        const result = await updateUserPreferences({
            animationsEnabled: userPreferences.animationsEnabled,
            animationSpeed: userPreferences.animationSpeed,
            animationDirection: userPreferences.animationDirection,
            theme: userPreferences.theme,
        })

        if (result.success) {
            toast.success("Einstellungen gespeichert")
            setHasChanges(false)
        } else {
            toast.error("Fehler beim Speichern der Einstellungen")
        }

        setIsSubmitting(false)
    }

    const getThemeIcon = (theme: string) => {
        switch (theme) {
            case "light":
                return <Sun className="h-4 w-4 mr-2" />
            case "dark":
                return <Moon className="h-4 w-4 mr-2" />
            case "system":
                return <Monitor className="h-4 w-4 mr-2" />
            default:
                return null
        }
    }

    const getDirectionIcon = (direction: string) => {
        return direction === "horizontal" ? <ArrowRight className="h-4 w-4 mr-2" /> : <ArrowDown className="h-4 w-4 mr-2" />
    }

    return (
        <Card className="shadow-sm">
            <CardContent className="p-6">
                <div className="space-y-8">
                    <div className="space-y-4">
                        <div className="flex items-center gap-2">
                            <Sun className="h-5 w-5 text-amber-500" />
                            <h3 className="text-lg font-medium">Darstellung</h3>
                        </div>
                        <Separator />
                        <div className="grid gap-6 sm:grid-cols-2">
                            <div className="space-y-2">
                                <Label htmlFor="theme" className="text-sm font-medium">
                                    Theme
                                </Label>
                                <Select
                                    value={userPreferences.theme}
                                    onValueChange={(value: "light" | "dark" | "system") => {
                                        userPreferences.setTheme(value)
                                    }}
                                >
                                    <SelectTrigger id="theme" className="w-full">
                                        <SelectValue placeholder="Wähle ein Theme">
                                            <div className="flex items-center">
                                                {getThemeIcon(userPreferences.theme)}
                                                <span>
                          {userPreferences.theme === "light" && "Hell"}
                                                    {userPreferences.theme === "dark" && "Dunkel"}
                                                    {userPreferences.theme === "system" && "System"}
                        </span>
                                            </div>
                                        </SelectValue>
                                    </SelectTrigger>
                                    <SelectContent>
                                        <SelectItem value="light" className="flex items-center">
                                            <div className="flex items-center">
                                                <Sun className="h-4 w-4 mr-2" />
                                                <span>Hell</span>
                                            </div>
                                        </SelectItem>
                                        <SelectItem value="dark">
                                            <div className="flex items-center">
                                                <Moon className="h-4 w-4 mr-2" />
                                                <span>Dunkel</span>
                                            </div>
                                        </SelectItem>
                                        <SelectItem value="system">
                                            <div className="flex items-center">
                                                <Monitor className="h-4 w-4 mr-2" />
                                                <span>System</span>
                                            </div>
                                        </SelectItem>
                                    </SelectContent>
                                </Select>
                                <p className="text-xs text-muted-foreground mt-1">Wähle zwischen hellem, dunklem oder System-Theme.</p>
                            </div>
                        </div>
                    </div>

                    <div className="space-y-4">
                        <div className="flex items-center gap-2">
                            <Sparkles className="h-5 w-5 text-purple-500" />
                            <h3 className="text-lg font-medium">Animations-Einstellungen</h3>
                        </div>
                        <Separator />
                        <div className="space-y-6">
                            <div className="flex items-center justify-between">
                                <div className="space-y-0.5">
                                    <Label htmlFor="animations-enabled" className="text-sm font-medium">
                                        Animationen aktivieren
                                    </Label>
                                    <p className="text-xs text-muted-foreground">Aktiviere oder deaktiviere alle Animationen.</p>
                                </div>
                                <Switch
                                    id="animations-enabled"
                                    checked={userPreferences.animationsEnabled}
                                    onCheckedChange={userPreferences.setAnimationsEnabled}
                                />
                            </div>

                            {userPreferences.animationsEnabled && (
                                <div className="space-y-6 rounded-lg bg-muted/50 p-4 mt-2">
                                    <div className="space-y-2">
                                        <div className="flex items-center gap-2">
                                            <Gauge className="h-4 w-4 text-muted-foreground" />
                                            <Label htmlFor="animation-speed" className="text-sm font-medium">
                                                Geschwindigkeit
                                            </Label>
                                        </div>
                                        <div className="flex items-center gap-4">
                                            <Slider
                                                id="animation-speed"
                                                value={[userPreferences.animationSpeed]}
                                                onValueChange={(values) => userPreferences.setAnimationSpeed(values[0])}
                                                max={500}
                                                min={100}
                                                step={50}
                                                className="flex-1"
                                            />
                                            <span className="text-muted-foreground w-16 text-right text-sm font-mono">
                        {userPreferences.animationSpeed}ms
                      </span>
                                        </div>
                                        <p className="text-xs text-muted-foreground mt-1">Niedrigere Werte = schnellere Animationen.</p>
                                    </div>

                                    <div className="space-y-2">
                                        <div className="flex items-center gap-2">
                                            {getDirectionIcon(userPreferences.animationDirection)}
                                            <Label htmlFor="animation-direction" className="text-sm font-medium">
                                                Richtung
                                            </Label>
                                        </div>
                                        <Select
                                            value={userPreferences.animationDirection}
                                            onValueChange={(value: "horizontal" | "vertical") => userPreferences.setAnimationDirection(value)}
                                        >
                                            <SelectTrigger id="animation-direction" className="w-full">
                                                <SelectValue placeholder="Richtung">
                                                    <div className="flex items-center">
                                                        {getDirectionIcon(userPreferences.animationDirection)}
                                                        <span>
                              {userPreferences.animationDirection === "horizontal" && "Horizontal"}
                                                            {userPreferences.animationDirection === "vertical" && "Vertikal"}
                            </span>
                                                    </div>
                                                </SelectValue>
                                            </SelectTrigger>
                                            <SelectContent>
                                                <SelectItem value="horizontal">
                                                    <div className="flex items-center">
                                                        <ArrowRight className="h-4 w-4 mr-2" />
                                                        <span>Horizontal</span>
                                                    </div>
                                                </SelectItem>
                                                <SelectItem value="vertical">
                                                    <div className="flex items-center">
                                                        <ArrowDown className="h-4 w-4 mr-2" />
                                                        <span>Vertikal</span>
                                                    </div>
                                                </SelectItem>
                                            </SelectContent>
                                        </Select>
                                        <p className="text-xs text-muted-foreground mt-1">Bestimmt die Hauptrichtung der Animationen.</p>
                                    </div>
                                </div>
                            )}
                        </div>
                    </div>

                    <div className="flex justify-end pt-2">
                        <Button onClick={handleSubmit} disabled={isSubmitting || !hasChanges} className="gap-2">
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
                </div>
            </CardContent>
        </Card>
    )
}
