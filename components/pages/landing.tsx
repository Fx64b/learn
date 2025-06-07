import {
    ArrowRight,
    BarChart3,
    Brain,
    Clock,
    Smartphone,
    Users,
    Zap,
} from 'lucide-react'

import { getTranslations } from 'next-intl/server'
import Link from 'next/link'

import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import {
    Card,
    CardDescription,
    CardHeader,
    CardTitle,
} from '@/components/ui/card'

export default async function LandingPage() {
    const t = await getTranslations('landing')

    return (
        <div className="bg-background min-h-screen">
            {/* Hero Section */}
            <section className="py-20 md:py-32">
                <div className="container mx-auto px-4 text-center">
                    <Badge variant="secondary" className="mb-4">
                        {t('hero.badge')}
                    </Badge>
                    <h1 className="mb-6 text-4xl font-bold tracking-tight md:text-6xl">
                        {t('hero.title')}
                        <span className="text-primary block">
                            {t('hero.titleHighlight')}
                        </span>
                    </h1>
                    <p className="text-muted-foreground mx-auto mb-8 max-w-2xl text-xl">
                        {t('hero.description')}
                    </p>
                    <div className="flex flex-col justify-center gap-4 sm:flex-row">
                        <Button size="lg" className="px-8 text-lg" asChild>
                            <Link href="/login">
                                {t('hero.startLearning')}
                                <ArrowRight className="ml-2 h-5 w-5" />
                            </Link>
                        </Button>

                        {/* TODO */}
                        {/*                        <Button
                            variant="outline"
                            size="lg"
                            className="px-8 text-lg"
                        >
                            {t('hero.viewDemo')}
                        </Button>*/}
                    </div>
                </div>
            </section>

            {/* Features Section */}
            <section id="features" className="bg-muted/30 py-20">
                <div className="container mx-auto px-4">
                    <div className="mb-16 text-center">
                        <h2 className="mb-4 text-3xl font-bold md:text-4xl">
                            {t('features.title')}
                        </h2>
                        <p className="text-muted-foreground mx-auto max-w-2xl text-xl">
                            {t('features.description')}
                        </p>
                    </div>

                    <div className="grid gap-8 md:grid-cols-2 lg:grid-cols-3">
                        <Card className="border-0 shadow-sm">
                            <CardHeader>
                                <Brain className="text-primary mb-2 h-10 w-10" />
                                <CardTitle>
                                    {t('features.spacedRepetition.title')}
                                </CardTitle>
                                <CardDescription>
                                    {t('features.spacedRepetition.description')}
                                </CardDescription>
                            </CardHeader>
                        </Card>

                        <Card className="border-0 shadow-sm">
                            <CardHeader>
                                <BarChart3 className="text-primary mb-2 h-10 w-10" />
                                <CardTitle>
                                    {t('features.progressTracking.title')}
                                </CardTitle>
                                <CardDescription>
                                    {t('features.progressTracking.description')}
                                </CardDescription>
                            </CardHeader>
                        </Card>

                        <Card className="border-0 shadow-sm">
                            <CardHeader>
                                <Smartphone className="text-primary mb-2 h-10 w-10" />
                                <CardTitle>
                                    {t('features.responsiveDesign.title')}
                                </CardTitle>
                                <CardDescription>
                                    {t('features.responsiveDesign.description')}
                                </CardDescription>
                            </CardHeader>
                        </Card>

                        <Card className="border-0 shadow-sm">
                            <CardHeader>
                                <Zap className="text-primary mb-2 h-10 w-10" />
                                <CardTitle>
                                    {t('features.keyboardShortcuts.title')}
                                </CardTitle>
                                <CardDescription>
                                    {t(
                                        'features.keyboardShortcuts.description'
                                    )}
                                </CardDescription>
                            </CardHeader>
                        </Card>

                        <Card className="border-0 shadow-sm">
                            <CardHeader>
                                <Users className="text-primary mb-2 h-10 w-10" />
                                <CardTitle>
                                    {t('features.deckManagement.title')}
                                </CardTitle>
                                <CardDescription>
                                    {t('features.deckManagement.description')}
                                </CardDescription>
                            </CardHeader>
                        </Card>

                        <Card className="border-0 shadow-sm">
                            <CardHeader>
                                <Clock className="text-primary mb-2 h-10 w-10" />
                                <CardTitle>
                                    {t('features.studySessions.title')}
                                </CardTitle>
                                <CardDescription>
                                    {t('features.studySessions.description')}
                                </CardDescription>
                            </CardHeader>
                        </Card>
                    </div>
                </div>
            </section>

            {/* How it Works */}
            <section id="how-it-works" className="py-20">
                <div className="container mx-auto px-4">
                    <div className="mb-16 text-center">
                        <h2 className="mb-4 text-3xl font-bold md:text-4xl">
                            {t('howItWorks.title')}
                        </h2>
                        <p className="text-muted-foreground mx-auto max-w-2xl text-xl">
                            {t('howItWorks.description')}
                        </p>
                    </div>

                    <div className="grid gap-8 md:grid-cols-3">
                        <div className="text-center">
                            <div className="bg-primary/10 mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-full">
                                <span className="text-primary text-2xl font-bold">
                                    1
                                </span>
                            </div>
                            <h3 className="mb-2 text-xl font-semibold">
                                {t('howItWorks.step1.title')}
                            </h3>
                            <p className="text-muted-foreground">
                                {t('howItWorks.step1.description')}
                            </p>
                        </div>

                        <div className="text-center">
                            <div className="bg-primary/10 mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-full">
                                <span className="text-primary text-2xl font-bold">
                                    2
                                </span>
                            </div>
                            <h3 className="mb-2 text-xl font-semibold">
                                {t('howItWorks.step2.title')}
                            </h3>
                            <p className="text-muted-foreground">
                                {t('howItWorks.step2.description')}
                            </p>
                        </div>

                        <div className="text-center">
                            <div className="bg-primary/10 mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-full">
                                <span className="text-primary text-2xl font-bold">
                                    3
                                </span>
                            </div>
                            <h3 className="mb-2 text-xl font-semibold">
                                {t('howItWorks.step3.title')}
                            </h3>
                            <p className="text-muted-foreground">
                                {t('howItWorks.step3.description')}
                            </p>
                        </div>
                    </div>
                </div>
            </section>

            {/* CTA Section */}
            <section className="bg-muted/30 py-20">
                <div className="container mx-auto px-4 text-center">
                    <h2 className="mb-4 text-3xl font-bold md:text-4xl">
                        {t('cta.title')}
                    </h2>
                    <p className="text-muted-foreground mx-auto mb-8 max-w-2xl text-xl">
                        {t('cta.description')}
                    </p>
                    <div className="flex flex-col justify-center gap-4 sm:flex-row">
                        <Button size="lg" className="px-8 text-lg" asChild>
                            <Link href="/login">
                                {t('cta.startToday')}
                                <ArrowRight className="ml-2 h-5 w-5" />
                            </Link>
                        </Button>
                        {/*TODO*/}
                        {/*                       <Button
                            variant="outline"
                            size="lg"
                            className="px-8 text-lg"
                        >
                            {t('cta.learnMore')}
                        </Button>*/}
                    </div>
                </div>
            </section>
        </div>
    )
}
