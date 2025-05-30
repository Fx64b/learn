import { getRequestConfig } from 'next-intl/server'
import { getLocale } from '@/lib/locale'

export default getRequestConfig(async () => {
    const locale = await getLocale()

    try {
        const messages = (await import(`../messages/${locale}.json`)).default

        return {
            locale,
            messages
        }
    } catch (error) {
        console.warn(`Failed to load messages for locale "${locale}", falling back to English.`, error)
        const messages = (await import('../messages/en.json')).default

        return {
            locale: 'en',
            messages
        }
    }
})