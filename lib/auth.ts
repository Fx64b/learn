import { db } from '@/db'
import { users } from '@/db/auth-schema'
import { generateLoginEmail, generateWelcomeEmail } from '@/lib/email-templates'
import { checkRateLimit } from '@/lib/rate-limit/rate-limit'
import { DrizzleAdapter } from '@auth/drizzle-adapter'
import { eq } from 'drizzle-orm'
import { Resend } from 'resend'

import { NextAuthOptions } from 'next-auth'
import EmailProvider from 'next-auth/providers/email'
import { getTranslations } from 'next-intl/server'

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
            from: process.env.EMAIL_FROM || '',
            sendVerificationRequest: async ({
                identifier: email,
                url,
                provider: { from },
            }) => {
                const t = await getTranslations('auth')

                const rateLimitResult = await checkRateLimit(
                    `email:${email}`,
                    'email'
                )

                if (!rateLimitResult.success) {
                    throw new Error(t('ratelimitExceeded'))
                }

                try {
                    // Check if user exists to determine if this is a signup or login
                    const existingUser = await db
                        .select()
                        .from(users)
                        .where(eq(users.email, email))
                        .limit(1)

                    const isNewUser = existingUser.length === 0
                    const logoUrl = 'https://learn.fx64b.dev/logo-dark.png'
                    const siteName = 'Learn'

                    let htmlContent: string
                    let subject: string

                    if (isNewUser) {
                        // Welcome email for new users
                        subject = t('email.welcome.subject')
                        htmlContent = generateWelcomeEmail({
                            url,
                            siteName,
                            logoUrl,
                            title: subject,
                            heading: t('email.welcome.heading'),
                            message: t('email.welcome.message'),
                            buttonText: t('email.welcome.button'),
                            footerText: t('email.welcome.footer'),
                        })
                    } else {
                        // Login email for returning users
                        subject = t('email.login.subject')
                        htmlContent = generateLoginEmail({
                            url,
                            siteName,
                            logoUrl,
                            title: subject,
                            heading: t('email.login.heading'),
                            message: t('email.login.message'),
                            buttonText: t('email.login.button'),
                            footerText: t('email.login.footer'),
                        })
                    }

                    const result = await resend.emails.send({
                        from,
                        to: email,
                        subject,
                        html: htmlContent,
                        text: `${t('email.textVersion', { url })}`,
                    })

                    if (result.error) {
                        throw new Error(result.error.message)
                    }

                    console.log(
                        `${isNewUser ? 'Welcome' : 'Login'} email sent to ${email}`
                    )
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
    },
}
