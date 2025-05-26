import {
    ArrowRight,
    BarChart3,
    Brain,
    Clock,
    Smartphone,
    Users,
    Zap,
} from 'lucide-react'

import Link from 'next/link'

import { Logo } from '@/components/misc/logo'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import {
    Card,
    CardDescription,
    CardHeader,
    CardTitle,
} from '@/components/ui/card'

export default function LandingPage() {
    return (
        <div className="bg-background min-h-screen">
            {/* Hero Section */}
            <section className="py-20 md:py-32">
                <div className="container mx-auto px-4 text-center">
                    <Badge variant="secondary" className="mb-4">
                        Now in Early Development
                    </Badge>
                    <h1 className="mb-6 text-4xl font-bold tracking-tight md:text-6xl">
                        Master Any Subject with
                        <span className="text-primary block">
                            Smart Flashcards
                        </span>
                    </h1>
                    <p className="text-muted-foreground mx-auto mb-8 max-w-2xl text-xl">
                        Learn faster and remember longer with our intelligent
                        spaced repetition system. Create, study, and track your
                        progress with beautifully designed flashcards.
                    </p>
                    <div className="flex flex-col justify-center gap-4 sm:flex-row">
                        <Button size="lg" className="px-8 text-lg" asChild>
                            <Link href="/login">
                                Start Learning Free
                                <ArrowRight className="ml-2 h-5 w-5" />
                            </Link>
                        </Button>

                        {/* TODO */}
                        {/*                        <Button
                            variant="outline"
                            size="lg"
                            className="px-8 text-lg"
                        >
                            View Demo
                        </Button>*/}
                    </div>
                </div>
            </section>

            {/* Features Section */}
            <section id="features" className="bg-muted/30 py-20">
                <div className="container mx-auto px-4">
                    <div className="mb-16 text-center">
                        <h2 className="mb-4 text-3xl font-bold md:text-4xl">
                            Everything you need to learn effectively
                        </h2>
                        <p className="text-muted-foreground mx-auto max-w-2xl text-xl">
                            Our app combines proven learning techniques with
                            modern technology to help you achieve your learning
                            goals.
                        </p>
                    </div>

                    <div className="grid gap-8 md:grid-cols-2 lg:grid-cols-3">
                        <Card className="border-0 shadow-sm">
                            <CardHeader>
                                <Brain className="text-primary mb-2 h-10 w-10" />
                                <CardTitle>Spaced Repetition</CardTitle>
                                <CardDescription>
                                    Intelligent algorithm that shows you cards
                                    just before you forget them, maximizing
                                    retention and minimizing study time.
                                </CardDescription>
                            </CardHeader>
                        </Card>

                        <Card className="border-0 shadow-sm">
                            <CardHeader>
                                <BarChart3 className="text-primary mb-2 h-10 w-10" />
                                <CardTitle>Progress Tracking</CardTitle>
                                <CardDescription>
                                    Monitor your learning streaks, success
                                    rates, and daily progress with detailed
                                    analytics and insights.
                                </CardDescription>
                            </CardHeader>
                        </Card>

                        <Card className="border-0 shadow-sm">
                            <CardHeader>
                                <Smartphone className="text-primary mb-2 h-10 w-10" />
                                <CardTitle>Responsive Design</CardTitle>
                                <CardDescription>
                                    Study anywhere, anytime. Our app works
                                    perfectly on desktop, tablet, and mobile
                                    devices.
                                </CardDescription>
                            </CardHeader>
                        </Card>

                        <Card className="border-0 shadow-sm">
                            <CardHeader>
                                <Zap className="text-primary mb-2 h-10 w-10" />
                                <CardTitle>Keyboard Shortcuts</CardTitle>
                                <CardDescription>
                                    Learn faster with intuitive keyboard
                                    navigation. Flip cards and rate them without
                                    touching your mouse.
                                </CardDescription>
                            </CardHeader>
                        </Card>

                        <Card className="border-0 shadow-sm">
                            <CardHeader>
                                <Users className="text-primary mb-2 h-10 w-10" />
                                <CardTitle>Deck Management</CardTitle>
                                <CardDescription>
                                    Organize your flashcards into decks by
                                    category. Import cards in bulk or create
                                    them one by one.
                                </CardDescription>
                            </CardHeader>
                        </Card>

                        <Card className="border-0 shadow-sm">
                            <CardHeader>
                                <Clock className="text-primary mb-2 h-10 w-10" />
                                <CardTitle>Study Sessions</CardTitle>
                                <CardDescription>
                                    Track your study time and analyze your most
                                    productive hours to optimize your learning
                                    schedule.
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
                            Simple, yet powerful
                        </h2>
                        <p className="text-muted-foreground mx-auto max-w-2xl text-xl">
                            Get started in minutes and see results in days
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
                                Create Your Decks
                            </h3>
                            <p className="text-muted-foreground">
                                Organize your learning material into themed
                                decks. Add cards manually or import them in
                                bulk.
                            </p>
                        </div>

                        <div className="text-center">
                            <div className="bg-primary/10 mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-full">
                                <span className="text-primary text-2xl font-bold">
                                    2
                                </span>
                            </div>
                            <h3 className="mb-2 text-xl font-semibold">
                                Study Smart
                            </h3>
                            <p className="text-muted-foreground">
                                Review cards using our spaced repetition
                                algorithm. Rate your confidence and let the
                                system optimize your schedule.
                            </p>
                        </div>

                        <div className="text-center">
                            <div className="bg-primary/10 mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-full">
                                <span className="text-primary text-2xl font-bold">
                                    3
                                </span>
                            </div>
                            <h3 className="mb-2 text-xl font-semibold">
                                Track Progress
                            </h3>
                            <p className="text-muted-foreground">
                                Monitor your learning journey with detailed
                                analytics and maintain your study streaks.
                            </p>
                        </div>
                    </div>
                </div>
            </section>

            {/* CTA Section */}
            <section className="bg-muted/30 py-20">
                <div className="container mx-auto px-4 text-center">
                    <h2 className="mb-4 text-3xl font-bold md:text-4xl">
                        Ready to supercharge your learning?
                    </h2>
                    <p className="text-muted-foreground mx-auto mb-8 max-w-2xl text-xl">
                        Join our early group of learners who are already using
                        our platform to master new skills and knowledge.
                    </p>
                    <div className="flex flex-col justify-center gap-4 sm:flex-row">
                        <Button size="lg" className="px-8 text-lg" asChild>
                            <Link href="/login">
                                Start Learning Today
                                <ArrowRight className="ml-2 h-5 w-5" />
                            </Link>
                        </Button>
                        {/*TODO*/}
                        {/*                       <Button
                            variant="outline"
                            size="lg"
                            className="px-8 text-lg"
                        >
                            Learn More
                        </Button>*/}
                    </div>
                </div>
            </section>
        </div>
    )
}
