import { db } from '@/db'
import { verificationTokens } from '@/db/auth-schema'
import { checkRateLimit } from '@/lib/rate-limit'
import { DrizzleAdapter } from '@auth/drizzle-adapter'
import { eq } from 'drizzle-orm'
import { nanoid } from 'nanoid'
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
            from: process.env.EMAIL_FROM || 'webmaster@localhost',
            maxAge: 24 * 60 * 60, // 24 hours for magic links
            generateVerificationToken: async () => {
                // Generate a standard token for NextAuth
                return nanoid(32)
            },
            sendVerificationRequest: async (params) => {
                const { identifier, url, provider } = params
                const { from } = provider

                const rateLimitResult = await checkRateLimit(
                    `email:${identifier}`,
                    'email'
                )

                if (!rateLimitResult.success) {
                    throw new Error(
                        'Zu viele Anfragen. Bitte versuchen Sie es später erneut.'
                    )
                }

                try {
                    // Check if user wants code-based verification
                    const urlObj = new URL(url)
                    const callbackUrl =
                        urlObj.searchParams.get('callbackUrl') || ''
                    const useCode = callbackUrl.includes('useCode=true')

                    if (useCode) {
                        // Generate a 6-digit numeric code
                        const code = Math.floor(
                            100000 + Math.random() * 900000
                        ).toString()

                        // Store the code in the database with the same token
                        // We need to extract the token from the URL
                        const token = urlObj.searchParams.get('token')
                        if (token) {
                            // Update the existing token with our code
                            await db
                                .update(verificationTokens)
                                .set({
                                    token: code,
                                    expires: new Date(
                                        Date.now() + 5 * 60 * 1000
                                    ), // 5 minutes
                                })
                                .where(eq(verificationTokens.token, token))
                        }

                        // Send code email
                        const result = await resend.emails.send({
                            from,
                            to: identifier,
                            subject: `Dein Anmeldecode für Flashcard App`,
                            html: `
                                <div style="font-family: sans-serif; padding: 24px; max-width: 600px;">
                                    <h1 style="color: #333; margin-bottom: 24px;">Flashcard App</h1>
                                    <p style="font-size: 16px; line-height: 1.5; margin-bottom: 24px;">
                                        Hier ist dein Anmeldecode:
                                    </p>
                                    <div style="background-color: #f8f9fa; border: 2px dashed #e9ecef; border-radius: 8px; padding: 24px; text-align: center; margin: 24px 0;">
                                        <span style="font-size: 32px; font-weight: bold; font-family: 'Courier New', monospace; letter-spacing: 8px; color: #495057;">
                                            ${code}
                                        </span>
                                    </div>
                                    <p style="font-size: 14px; color: #666; margin-bottom: 16px;">
                                        Dieser Code ist 5 Minuten gültig und kann nur einmal verwendet werden.
                                    </p>
                                    <p style="font-size: 14px; color: #666;">
                                        Wenn du diese E-Mail nicht angefordert hast, kannst du sie ignorieren.
                                    </p>
                                </div>
                            `,
                            text: `Dein Anmeldecode für die Flashcard App: ${code}\n\nDieser Code ist 5 Minuten gültig.`,
                        })

                        if (result.error) {
                            throw new Error(result.error.message)
                        }

                        console.log(`Verification code sent to ${identifier}`)
                    } else {
                        // Send standard magic link
                        const result = await resend.emails.send({
                            from,
                            to: identifier,
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

                        console.log(`Verification email sent to ${identifier}`)
                    }
                } catch (error) {
                    console.error('Error sending verification email', error)
                    throw new Error(
                        `Error sending verification email: ${error}`
                    )
                }
            },
        }),
    ],
    adapter: DrizzleAdapter(db),
    session: {
        strategy: 'jwt',
    },
    pages: {
        signIn: '/login',
        verifyRequest: '/verify-request',
        error: '/auth/error',
    },
    callbacks: {
        async session({ session, token }) {
            if (session.user) {
                session.user.id = token.sub || 'this-should-not-happen'
            }
            return session
        },
        async signIn() {
            return true
        },
    },
}
