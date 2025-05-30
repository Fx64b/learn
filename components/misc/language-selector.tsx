'use client'

import { Globe } from 'lucide-react'
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from '@/components/ui/select'
import { useLocale } from '@/components/misc/locale-provider'

export function LanguageSelector() {
    const { locale, setLocale } = useLocale()

    return (
        <Select value={locale} onValueChange={(value) => setLocale(value as 'en' | 'de')}>
            <SelectTrigger className="w-[110px]">
                <Globe className="mr-2 h-4 w-4" />
                <SelectValue />
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
    )
}