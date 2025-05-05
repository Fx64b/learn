import { Toaster } from 'sonner'

import type { Metadata } from 'next'
import { Inter } from 'next/font/google'

import { Analytics } from '@vercel/analytics/react'

import { AuthProvider } from '@/components/auth-provider'
import { Header } from '@/components/header'
import { RateLimitStatus } from '@/components/rate-limit-status'

import './globals.css'

const inter = Inter({ subsets: ['latin'] })

export const metadata: Metadata = {
    title: 'Allgemeinbildung Lernkarten',
    description: 'Lernkarten-App für die  Allgemeinbildungsprüfung',
}

export default function RootLayout({
    children,
}: {
    children: React.ReactNode
}) {
    return (
        <html lang="de" className="dark">
            <body
                className={`${inter.className} bg-background text-foreground min-h-screen antialiased`}
            >
                <AuthProvider>
                    <Header />
                    {process.env.NODE_ENV === 'development' && (
                        <div className="container mx-auto max-w-5xl px-4 py-2">
                            <RateLimitStatus />
                        </div>
                    )}
                    <main>{children}</main>
                    <Toaster position="top-right" />
                </AuthProvider>
                <Analytics />
            </body>
        </html>
    )
}
