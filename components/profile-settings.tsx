'use client'

import { useUserPreferences } from '@/store/userPreferences'
import {
    ArrowDown,
    ArrowRight,
    Gauge,
    Globe,
    Monitor,
    Moon,
    Save,
    Sparkles,
    Sun,
} from 'lucide-react'
import { toast } from 'sonner'

import { useState } from 'react'

import { useTranslations } from 'next-intl'

import { updateLocale as updateLocaleAction } from '@/app/actions/locale'
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
        locale: string
    }
}

export function ProfileSettings({ initialPreferences }: ProfileSettingsProps) {
    const [isSubmitting, setIsSubmitting] = useState(false)
    const userPreferences = useUserPreferences()
    const t = useTranslations('profile.settings')
    const common = useTranslations('common')

    const [localPrefs, setLocalPrefs] = useState({
        animationsEnabled: initialPreferences.animationsEnabled,
        animationSpeed: initialPreferences.animationSpeed,
        animationDirection: initialPreferences.animationDirection,
        theme: initialPreferences.theme,
        locale: initialPreferences.locale,
    })

    const hasChanges =
        localPrefs.animationsEnabled !== initialPreferences.animationsEnabled ||
        localPrefs.animationSpeed !== initialPreferences.animationSpeed ||
        localPrefs.animationDirection !==
            initialPreferences.animationDirection ||
        localPrefs.theme !== initialPreferences.theme ||
        localPrefs.locale !== initialPreferences.locale

    const updateLocale = async (value: string) => {
        const locale = value as 'en' | 'de'
        setLocalPrefs((prev) => ({ ...prev, locale }))
        await updateLocaleAction(locale)
    }
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
            locale: localPrefs.locale,
        })

        if (result.success) {
            toast.success(t('saved'))
        } else {
            toast.error(t('saveError'))
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
                            <h3 className="text-lg font-medium">
                                {t('appearance.title')}
                            </h3>
                        </div>
                        <Separator />
                        <div className="grid gap-6 sm:grid-cols-2">
                            <div className="space-y-2">
                                <Label
                                    htmlFor="theme"
                                    className="text-sm font-medium"
                                >
                                    {t('appearance.theme.label')}
                                </Label>
                                <Select
                                    value={localPrefs.theme}
                                    onValueChange={updateTheme}
                                >
                                    <SelectTrigger
                                        id="theme"
                                        className="w-full"
                                    >
                                        <SelectValue>
                                            <div className="flex items-center">
                                                {getThemeIcon(localPrefs.theme)}
                                                <span>
                                                    {localPrefs.theme ===
                                                        'light' &&
                                                        t(
                                                            'appearance.theme.light'
                                                        )}
                                                    {localPrefs.theme ===
                                                        'dark' &&
                                                        t(
                                                            'appearance.theme.dark'
                                                        )}
                                                    {localPrefs.theme ===
                                                        'system' &&
                                                        t(
                                                            'appearance.theme.system'
                                                        )}
                                                </span>
                                            </div>
                                        </SelectValue>
                                    </SelectTrigger>
                                    <SelectContent>
                                        <SelectItem value="light">
                                            <div className="flex items-center">
                                                <Sun className="mr-2 h-4 w-4" />
                                                <span>
                                                    {t(
                                                        'appearance.theme.light'
                                                    )}
                                                </span>
                                            </div>
                                        </SelectItem>
                                        <SelectItem value="dark">
                                            <div className="flex items-center">
                                                <Moon className="mr-2 h-4 w-4" />
                                                <span>
                                                    {t('appearance.theme.dark')}
                                                </span>
                                            </div>
                                        </SelectItem>
                                        <SelectItem value="system">
                                            <div className="flex items-center">
                                                <Monitor className="mr-2 h-4 w-4" />
                                                <span>
                                                    {t(
                                                        'appearance.theme.system'
                                                    )}
                                                </span>
                                            </div>
                                        </SelectItem>
                                    </SelectContent>
                                </Select>
                                <p className="text-muted-foreground mt-1 text-xs">
                                    {t('appearance.theme.description')}
                                </p>
                            </div>

                            {/* Add language selector */}
                            <div className="space-y-2">
                                <Label
                                    htmlFor="language"
                                    className="text-sm font-medium"
                                >
                                    {t('language.label')}
                                </Label>
                                <Select
                                    value={localPrefs.locale}
                                    onValueChange={updateLocale}
                                >
                                    <SelectTrigger
                                        id="language"
                                        className="w-full"
                                    >
                                        <SelectValue>
                                            <div className="flex items-center">
                                                <Globe className="mr-2 h-4 w-4" />
                                                <span>
                                                    {localPrefs.locale === 'en'
                                                        ? 'English'
                                                        : 'Deutsch'}
                                                </span>
                                            </div>
                                        </SelectValue>
                                    </SelectTrigger>
                                    <SelectContent>
                                        <SelectItem value="en">
                                            <div className="flex items-center">
                                                <span className="mr-2">🇬🇧</span>
                                                <span>English</span>
                                            </div>
                                        </SelectItem>
                                        <SelectItem value="de">
                                            <div className="flex items-center">
                                                <span className="mr-2">🇩🇪</span>
                                                <span>Deutsch</span>
                                            </div>
                                        </SelectItem>
                                    </SelectContent>
                                </Select>
                            </div>
                        </div>
                    </div>

                    <div className="w-full space-y-4">
                        <div className="flex items-center gap-2">
                            <Sparkles className="h-5 w-5 text-purple-500" />
                            <h3 className="text-lg font-medium">
                                {t('animations.title')}
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
                                        {t('animations.enable.label')}
                                    </Label>
                                    <p className="text-muted-foreground text-xs">
                                        {t('animations.enable.description')}
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
                                                {t('animations.speed.label')}
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
                                            {t('animations.speed.description')}
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
                                                {t(
                                                    'animations.direction.label'
                                                )}
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
                                                <SelectValue>
                                                    <div className="flex items-center">
                                                        {getDirectionIcon(
                                                            localPrefs.animationDirection
                                                        )}
                                                        <span>
                                                            {localPrefs.animationDirection ===
                                                            'horizontal'
                                                                ? t(
                                                                      'animations.direction.horizontal'
                                                                  )
                                                                : t(
                                                                      'animations.direction.vertical'
                                                                  )}
                                                        </span>
                                                    </div>
                                                </SelectValue>
                                            </SelectTrigger>
                                            <SelectContent>
                                                <SelectItem value="horizontal">
                                                    <div className="flex items-center">
                                                        <ArrowRight className="mr-2 h-4 w-4" />
                                                        <span>
                                                            {t(
                                                                'animations.direction.horizontal'
                                                            )}
                                                        </span>
                                                    </div>
                                                </SelectItem>
                                                <SelectItem value="vertical">
                                                    <div className="flex items-center">
                                                        <ArrowDown className="mr-2 h-4 w-4" />
                                                        <span>
                                                            {t(
                                                                'animations.direction.vertical'
                                                            )}
                                                        </span>
                                                    </div>
                                                </SelectItem>
                                            </SelectContent>
                                        </Select>
                                        <p className="text-muted-foreground mt-1 text-xs">
                                            {t(
                                                'animations.direction.description'
                                            )}
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
                            <>{t('saving')}</>
                        ) : (
                            <>
                                <Save className="h-4 w-4" />
                                <span>{t('save')}</span>
                            </>
                        )}
                    </Button>
                </div>
            </CardContent>
        </Card>
    )
}
