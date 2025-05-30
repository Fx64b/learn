import { getLocale } from '@/lib/locale'
import deMessages from '@/messages/de.json'
import enMessages from '@/messages/en.json'
import { Toaster } from 'sonner'

import type { Metadata } from 'next'
import { Inter } from 'next/font/google'

import { Analytics } from '@vercel/analytics/react'

import { Footer } from '@/components/footer'
import { Header } from '@/components/header'
import { AuthProvider } from '@/components/misc/auth-provider'
import { LocaleProvider } from '@/components/misc/locale-provider'
import { ThemeProvider } from '@/components/misc/theme-provider'

import './globals.css'

const inter = Inter({ subsets: ['latin'] })

export const metadata: Metadata = {
    title: 'Flashcard App',
    description: 'A simple flashcard app with spaced repetition.',
}

const messages = {
    en: enMessages,
    de: deMessages,
}

export default async function RootLayout({
    children,
}: {
    children: React.ReactNode
}) {
    const locale = await getLocale()

    return (
        <html lang={locale} suppressHydrationWarning>
            <body
                className={`${inter.className} bg-background text-foreground antialiased`}
            >
                <AuthProvider>
                    <LocaleProvider initialLocale={locale} messages={messages}>
                        <ThemeProvider>
                            <Header />
                            <main className="min-h-screen">{children}</main>
                            <Footer />
                            <Toaster position="top-right" />
                        </ThemeProvider>
                    </LocaleProvider>
                </AuthProvider>
                <Analytics />
            </body>
        </html>
    )
}
