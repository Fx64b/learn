import { MetadataRoute } from 'next'

export default function sitemap(): MetadataRoute.Sitemap {
    const baseUrl = process.env.NEXT_PUBLIC_SITE_URL || 'https://learn.fx64b.dev'
    
    // Define static routes that should be included in the sitemap
    // Excluding deck routes and auth-required pages as requested
    const staticRoutes = [
        {
            url: baseUrl,
            lastModified: new Date(),
            changeFrequency: 'daily' as const,
            priority: 1,
        },
        {
            url: `${baseUrl}/pricing`,
            lastModified: new Date(),
            changeFrequency: 'weekly' as const,
            priority: 0.8,
        },
        {
            url: `${baseUrl}/terms`,
            lastModified: new Date(),
            changeFrequency: 'monthly' as const,
            priority: 0.3,
        },
        {
            url: `${baseUrl}/privacy`,
            lastModified: new Date(),
            changeFrequency: 'monthly' as const,
            priority: 0.3,
        },
        {
            url: `${baseUrl}/imprint`,
            lastModified: new Date(),
            changeFrequency: 'monthly' as const,
            priority: 0.3,
        },
    ]

    return staticRoutes
}