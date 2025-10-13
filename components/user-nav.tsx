'use client'

import { Sparkles, User } from 'lucide-react'

import { useEffect, useState } from 'react'

import { signOut, useSession } from 'next-auth/react'
import { useTranslations } from 'next-intl'
import Link from 'next/link'

import { Button } from '@/components/ui/button'
import {
    DropdownMenu,
    DropdownMenuContent,
    DropdownMenuItem,
    DropdownMenuLabel,
    DropdownMenuSeparator,
    DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu'

export function UserNav() {
    const t = useTranslations()
    const { data: session, status } = useSession()
    const loading = status === 'loading'
    const [isPro, setIsPro] = useState(false)

    useEffect(() => {
        if (session?.user?.id) {
            fetch('/api/user/subscription-status')
                .then((res) => res.json())
                .then((data) => setIsPro(data.isPro))
                .catch((err) =>
                    console.error('Failed to fetch subscription status:', err)
                )
        }
    }, [session])

    if (loading) {
        return (
            <Button variant="ghost" size="icon" disabled>
                <User className="h-5 w-5" />
            </Button>
        )
    }

    if (!session) {
        return (
            <Button size="sm" asChild>
                <Link href="/login" className="flex items-center space-x-3">
                    {t('auth.signIn')}
                </Link>
            </Button>
        )
    }

    return (
        <DropdownMenu>
            <DropdownMenuTrigger asChild>
                <Button variant="ghost" size="icon">
                    <User className="h-5 w-5" />
                </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end">
                <DropdownMenuLabel className={'flex gap-1'}>
                    {session.user?.email || t('auth.myAccount')}
                    {isPro && <Sparkles className="h-3 w-3 text-purple-600" />}
                </DropdownMenuLabel>
                <DropdownMenuSeparator />
                <DropdownMenuItem asChild>
                    <Link href="/profile">{t('common.profile')}</Link>
                </DropdownMenuItem>
                <DropdownMenuSeparator />
                <DropdownMenuItem
                    onClick={() => signOut({ callbackUrl: '/' })}
                    className="text-red-500 focus:text-red-500"
                >
                    {t('auth.signOut')}
                </DropdownMenuItem>
            </DropdownMenuContent>
        </DropdownMenu>
    )
}
