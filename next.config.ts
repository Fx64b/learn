import type { NextConfig } from 'next'

const nextConfig: NextConfig = {
    reactStrictMode: true,
    async redirects() {
        return [
            {
                source: '/login',
                destination: '/auth/login',
                permanent: false,
                has: [
                    {
                        type: 'cookie',
                        key: 'next-auth.session-token',
                    },
                ],
            },
        ]
    },
    async headers() {
        return [
            {
                source: '/(.*)',
                headers: [
                    {
                        key: 'X-Frame-Options',
                        value: 'DENY',
                    },
                    {
                        key: 'X-Content-Type-Options',
                        value: 'nosniff',
                    },
                    {
                        key: 'X-XSS-Protection',
                        value: '1; mode=block',
                    },
                    {
                        key: 'Referrer-Policy',
                        value: 'strict-origin-when-cross-origin',
                    },
                ],
            },
        ]
    },
}

export default nextConfig
