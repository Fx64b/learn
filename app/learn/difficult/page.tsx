import { getDifficultCards } from '@/db/utils'
import { authOptions } from '@/lib/auth'
import { ArrowLeft } from 'lucide-react'

import { getServerSession } from 'next-auth'
import { getTranslations } from 'next-intl/server'
import Link from 'next/link'

import LearnModeClient from '@/app/learn/[category]/learn-mode-client'

import { Button } from '@/components/ui/button'

export default async function DifficultCardsPage() {
    const session = await getServerSession(authOptions)
    const t = await getTranslations('learn')

    if (!session?.user?.id) {
        return <div>{t('loginRequired')}</div>
    }

    const difficultCards = await getDifficultCards(session.user.id)

    return (
        <div className="container mx-auto flex min-h-screen max-w-4xl flex-col px-4 py-6 sm:py-8">
            <header className="mb-6">
                <div className="mb-4 flex items-center gap-4">
                    <Button variant="ghost" size="icon" asChild>
                        <Link href="/">
                            <ArrowLeft className="h-5 w-5" />
                        </Link>
                    </Button>
                    <h1 className="text-xl font-bold sm:text-2xl">
                        {t('difficultCards')}{' '}
                    </h1>
                </div>
            </header>

            <main className="flex flex-1 flex-col">
                <LearnModeClient
                    deckId="difficult"
                    flashcards={difficultCards}
                />
            </main>
        </div>
    )
}
