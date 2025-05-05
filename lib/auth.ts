import { db } from '@/db'
import { checkRateLimit } from '@/lib/rate-limit'
import { DrizzleAdapter } from '@auth/drizzle-adapter'
import { Resend } from 'resend'

import { NextAuthOptions } from 'next-auth'
import EmailProvider from 'next-auth/providers/email'

const resend = new Resend(process.env.RESEND_API_KEY)

export const authOptions: NextAuthOptions = {
    providers: [
        EmailProvider({
            server: {
                host: process.env.EMAIL_SERVER_HOST || 'https://api.resend.com',
                port: Number(process.env.EMAIL_SERVER_PORT) || 443,
                auth: {
                    user: 'resend',
                    pass: process.env.RESEND_API_KEY || '',
                },
            },
            from: process.env.EMAIL_FROM || 'noreply@example.com',
            sendVerificationRequest: async ({
                identifier: email,
                url,
                provider: { from },
            }) => {
                const rateLimitResult = await checkRateLimit(`email:${email}`)

                if (!rateLimitResult.success) {
                    throw new Error(
                        'Zu viele Anfragen. Bitte versuchen Sie es später erneut.'
                    )
                }

                try {
                    const result = await resend.emails.send({
                        from,
                        to: email,
                        subject: `Anmeldung bei Flashcard App`,
                        html: `
              <div style="font-family: sans-serif; padding: 24px;">
                <h1>Flashcard App</h1>
                <p>Klicke auf den folgenden Link, um dich anzumelden:</p>
                <a href="${url}" style="display: inline-block; padding: 12px 24px; background-color: #4F46E5; color: white; text-decoration: none; border-radius: 4px;">
                  Einloggen
                </a>
                <p style="margin-top: 24px; color: #666;">
                  Wenn du diese E-Mail nicht angefordert hast, kannst du sie ignorieren.
                </p>
              </div>
            `,
                        text: `Melde dich bei der Flashcard App an, indem du auf diesen Link klickst: ${url}`,
                    })

                    if (result.error) {
                        throw new Error(result.error.message)
                    }

                    console.log(`Verification email sent to ${email}`)
                } catch (error) {
                    console.error('Error sending verification email', error)
                    throw new Error(
                        `Error sending verification email: ${error}`
                    )
                }
            },
        }),
    ],
    // Den Drizzle-Adapter für Turso verwenden
    adapter: DrizzleAdapter(db),
    // Sitzungseinstellungen
    session: {
        strategy: 'jwt',
    },
    // Anpassbare Seiten
    pages: {
        signIn: '/login',
        verifyRequest: '/verify-request',
        error: '/auth/error',
    },
    // Callbacks für Anpassungen
    callbacks: {
        async session({ session, token }) {
            // User-ID in der Session verfügbar machen
            if (session.user) {
                session.user.id = token.sub || 'this-should-not-happen'
            }
            return session
        },
    },
}
