import { CheckCircle } from 'lucide-react'

import { getTranslations } from 'next-intl/server'
import Link from 'next/link'

import { Button } from '@/components/ui/button'
import {
    Card,
    CardContent,
    CardDescription,
    CardFooter,
    CardHeader,
    CardTitle,
} from '@/components/ui/card'

export default async function VerifyRequestPage() {
    const t = await getTranslations('auth.verifyRequest')

    return (
        <div className="flex min-h-[calc(100vh-8rem)] items-center justify-center px-4">
            <Card className="w-full max-w-md">
                <CardHeader className="text-center">
                    <div className="mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-full bg-green-100">
                        <CheckCircle className="h-8 w-8 text-green-600" />
                    </div>
                    <CardTitle className="text-2xl">{t('title')}</CardTitle>
                    <CardDescription>{t('subtitle')}</CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                    <p className="text-muted-foreground bg-muted rounded-lg p-4 text-center text-sm">
                        {t('description')}
                    </p>
                    <p className="text-sm">{t('note')}</p>
                </CardContent>
                <CardFooter className="flex flex-col gap-2">
                    <Button asChild variant="outline" className="w-full">
                        <Link href="/login">{t('backToLogin')}</Link>
                    </Button>
                    <p className="text-muted-foreground text-center text-xs">
                        {t('trouble')}{' '}
                        <Link
                            href="/todo"
                            className="text-primary hover:underline"
                        >
                            {t('contactSupport')}
                        </Link>
                        {t('orWriteAnEmail')}{' '}
                        <Link
                            href="mailto:learn@fx64b.dev"
                            className="text-primary hover:underline"
                        >
                            learn@fx64b.dev
                        </Link>
                    </p>
                </CardFooter>
            </Card>
        </div>
    )
}
