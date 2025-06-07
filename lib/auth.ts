import { db } from '@/db'
import { checkRateLimit } from '@/lib/rate-limit'
import { DrizzleAdapter } from '@auth/drizzle-adapter'
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

                const rateLimitResult = await checkRateLimit(`email:${email}`)

                if (!rateLimitResult.success) {
                    throw new Error(t('ratelimitExceeded'))
                }

                try {
                    const result = await resend.emails.send({
                        from,
                        to: email,
                        subject: t('email.subject'),
                        html: `
              <div style="font-family: sans-serif; padding: 24px;">
                <h1>Flashcard App</h1>
                <h1>${t('email.title')}</h1>
                <p>${t('email.message')}</p>
                <a href="${url}" style="display: inline-block; padding: 12px 24px; background-color: #4F46E5; color: white; text-decoration: none; border-radius: 4px;">
                  ${t('email.button')}
                </a>
                <p style="margin-top: 24px; color: #666;">
                  ${t('email.ignore')}
                </p>
              </div>
            `,
                        text: `${t('email.textVersion', { url: url })}`, // wtf,... FIXME
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
