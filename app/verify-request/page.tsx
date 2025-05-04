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

export default function VerifyRequestPage() {
    return (
        <div className="flex min-h-screen items-center justify-center px-4">
            <Card className="w-full max-w-md">
                <CardHeader>
                    <CardTitle className="text-2xl">Link gesendet</CardTitle>
                    <CardDescription>Überprüfe deine E-Mail</CardDescription>
                </CardHeader>
                <CardContent>
                    <div className="space-y-4">
                        <p>
                            Wir haben dir einen Anmeldelink an deine
                            E-Mail-Adresse gesendet. Bitte überprüfe deinen
                            Posteingang und klicke auf den Link, um
                            fortzufahren.
                        </p>
                        <p>
                            Wenn du keine E-Mail erhältst, überprüfe bitte auch
                            deinen Spam-Ordner.
                        </p>
                    </div>
                </CardContent>
                <CardFooter>
                    <Link href="/login" className="w-full">
                        <Button variant="outline" className="w-full">
                            Zurück zur Anmeldung
                        </Button>
                    </Link>
                </CardFooter>
            </Card>
        </div>
    )
}
