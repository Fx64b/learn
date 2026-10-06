'use client'

import { Wrench } from 'lucide-react'

import { useTranslations } from 'next-intl'

import {
    AlertDialog,
    AlertDialogContent,
    AlertDialogDescription,
    AlertDialogHeader,
    AlertDialogTitle,
} from '@/components/ui/alert-dialog'

/**
 * Banner and blocking popup shown while maintenance mode is on.
 * The popup has no close action, so users cannot use the site behind it.
 */
export function MaintenanceNotice() {
    const t = useTranslations('maintenance')

    return (
        <>
            <div
                role="status"
                className="bg-amber-500 px-4 py-2 text-center text-sm font-medium text-black"
            >
                <Wrench className="mr-2 inline size-4 align-text-bottom" />
                {t('banner')}
            </div>
            <AlertDialog open>
                <AlertDialogContent>
                    <AlertDialogHeader>
                        <AlertDialogTitle>{t('title')}</AlertDialogTitle>
                        <AlertDialogDescription>
                            {t('description')}
                        </AlertDialogDescription>
                    </AlertDialogHeader>
                </AlertDialogContent>
            </AlertDialog>
        </>
    )
}
