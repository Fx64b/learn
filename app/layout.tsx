import { Toaster } from 'sonner'

import type { Metadata } from 'next'
import { Inter } from 'next/font/google'

import { Analytics } from '@vercel/analytics/react'

import { AuthProvider } from '@/components/auth-provider'
import { Footer } from '@/components/footer'
import { Header } from '@/components/header'
import { RateLimitStatus } from '@/components/rate-limit-status'
import { ThemeProvider } from '@/components/theme-provider'

import './globals.css'

const inter = Inter({ subsets: ['latin'] })

export const metadata: Metadata = {
    title: 'Flashcard App',
    description: 'A simple flashcard app with spaced repetition.',
}

export default function RootLayout({
    children,
}: {
    children: React.ReactNode
}) {
    return (
        <html lang="de" suppressHydrationWarning>
            <body
                className={`${inter.className} bg-background text-foreground antialiased`}
            >
                <AuthProvider>
                    <ThemeProvider>
                        <Header />
                        {process.env.NODE_ENV === 'development' && (
                            <div className="container mx-auto max-w-5xl px-4 py-2">
                                <RateLimitStatus />
                            </div>
                        )}
                        <main className="min-h-screen">{children}</main>
                        <Footer />
                        <Toaster position="top-right" />
                    </ThemeProvider>
                </AuthProvider>
                <Analytics />
            </body>
        </html>
    )
}
