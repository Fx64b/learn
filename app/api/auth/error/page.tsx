'use client'

import { AlertCircle } from 'lucide-react'

import Link from 'next/link'
import { useSearchParams } from 'next/navigation'

import { Button } from '@/components/ui/button'
import {
    Card,
    CardContent,
    CardDescription,
    CardFooter,
    CardHeader,
    CardTitle,
} from '@/components/ui/card'

export default function AuthErrorPage() {
    const searchParams = useSearchParams()
    const error = searchParams.get('error')

    const errorMessages: Record<string, string> = {
        Verification: 'Der Verifizierungscode ist ungültig oder abgelaufen.',
        Configuration: 'Es gibt ein Problem mit der Konfiguration.',
        AccessDenied: 'Zugriff verweigert.',
        Default: 'Ein unerwarteter Fehler ist aufgetreten.',
    }

    const message = errorMessages[error || 'Default'] || errorMessages.Default

    return (
        <div className="flex min-h-screen items-center justify-center px-4">
            <Card className="w-full max-w-md">
                <CardHeader>
                    <div className="flex items-center gap-2">
                        <AlertCircle className="h-6 w-6 text-red-500" />
                        <CardTitle className="text-2xl">
                            Authentifizierungsfehler
                        </CardTitle>
                    </div>
                    <CardDescription>{message}</CardDescription>
                </CardHeader>
                <CardContent>
                    <p className="text-muted-foreground text-sm">
                        Bitte versuche es erneut oder fordere einen neuen Code
                        an.
                    </p>
                </CardContent>
                <CardFooter className="flex justify-center">
                    <Link href="/login" className="w-full">
                        <Button className="w-full">Zurück zur Anmeldung</Button>
                    </Link>
                </CardFooter>
            </Card>
        </div>
    )
}
