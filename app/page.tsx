import { authOptions } from '@/lib/auth'

import { getServerSession } from 'next-auth'

import Landing from '@/components/landing/landing-page'
import Dashboard from '@/components/pages/dashboard'

export default async function Home() {
    const session = await getServerSession(authOptions)

    return session?.user ? (
        <div className="container mx-auto max-w-5xl">
            <Dashboard session={session} />
        </div>
    ) : (
        <Landing />
    )
}
