'use client'

import { useLocale } from '@/components/misc/locale-provider'
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from '@/components/ui/select'

export function LanguageSelector() {
    const { locale, setLocale } = useLocale()

    return (
        <Select
            value={locale}
            onValueChange={(value) => setLocale(value as 'en' | 'de')}
        >
            <SelectTrigger className="w-[70px]">
                <SelectValue />
            </SelectTrigger>
            <SelectContent className="w-[70px]!">
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
    )
}
