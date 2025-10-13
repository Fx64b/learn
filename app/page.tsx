'use server'

import { authOptions } from '@/lib/auth'

import { getServerSession } from 'next-auth'

import Dashboard from '@/components/pages/dashboard'
import Landing from '@/components/pages/landing'

export default async function Home() {
    const session = await getServerSession(authOptions)

    return (
        <main className="container mx-auto max-w-5xl">
            {session?.user ? <Dashboard session={session} /> : <Landing />}
        </main>
    )
}
