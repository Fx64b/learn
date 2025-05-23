import { Toaster } from 'sonner'

import type { Metadata } from 'next'
import { Inter } from 'next/font/google'

import { Analytics } from '@vercel/analytics/react'

import { Footer } from '@/components/footer'
import { Header } from '@/components/header'
import { AuthProvider } from '@/components/misc/auth-provider'
import { ThemeProvider } from '@/components/misc/theme-provider'

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
