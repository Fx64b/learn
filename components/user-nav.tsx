'use client'

import { User } from 'lucide-react'

import { signOut, useSession } from 'next-auth/react'
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
    const { data: session, status } = useSession()
    const loading = status === 'loading'

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
                    Sign In
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
                <DropdownMenuLabel>
                    {session.user?.email || 'Mein Konto'}
                </DropdownMenuLabel>
                <DropdownMenuSeparator />
                <DropdownMenuItem asChild>
                    <Link href="/profile">Profil</Link>
                </DropdownMenuItem>
                <DropdownMenuSeparator />
                <DropdownMenuItem
                    onClick={() => signOut({ callbackUrl: '/' })}
                    className="text-red-500 focus:text-red-500"
                >
                    Abmelden
                </DropdownMenuItem>
            </DropdownMenuContent>
        </DropdownMenu>
    )
}
