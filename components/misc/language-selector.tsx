'use client'

import { useTransition } from 'react'

import { useLocale, useTranslations } from 'next-intl'
import { useRouter } from 'next/navigation'

import { updateLocale } from '@/app/actions/locale'

import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from '@/components/ui/select'

export function LanguageSelector() {
    const t = useTranslations('common')
    const locale = useLocale()
    const router = useRouter()
    const [isPending, startTransition] = useTransition()

    const handleLocaleChange = (newLocale: string) => {
        startTransition(async () => {
            await updateLocale(newLocale as 'en' | 'de')
            router.refresh()
        })
    }

    return (
        <Select
            value={locale}
            onValueChange={handleLocaleChange}
            disabled={isPending}
        >
            <SelectTrigger className="w-[70px]" aria-label={t('language')}>
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
