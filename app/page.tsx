'use server'

import { authOptions } from '@/lib/auth'

import { getServerSession } from 'next-auth'

import Dashboard from '@/components/pages/dashboard'
import Landing from '@/components/pages/landing'

export default async function Home() {
    const session = await getServerSession(authOptions)
    
    // For development - show dashboard to test the redesign
    const isDev = process.env.NODE_ENV === 'development'
    const mockSession = isDev && !session ? {
        user: {
            id: 'dev-user',
            email: 'dev@example.com',
            name: 'Dev User'
        }
    } : session

    return (
        <main className="container mx-auto max-w-5xl">
            {mockSession?.user ? <Dashboard session={mockSession} /> : <Landing />}
        </main>
    )
}
