import { readFileSync } from 'fs'
import { Github, Heart } from 'lucide-react'
import { join } from 'path'

import Link from 'next/link'

import { Logo } from '@/components/misc/logo'
import { Separator } from '@/components/ui/separator'

let cachedVersion: string | null = null
try {
    const packageJsonPath = join(process.cwd(), 'package.json')
    const packageJson = JSON.parse(readFileSync(packageJsonPath, 'utf8'))
    cachedVersion = packageJson.version
} catch (error) {
    console.error('Error reading version:', error)
    cachedVersion = null
}

export function Footer() {
    const version = cachedVersion
    const currentYear = new Date().getFullYear()

    return (
        <footer className="mt-8 py-6">
            <div className="border-border container mx-auto max-w-5xl border-t px-4">
                <div className="mt-8 grid gap-8 md:grid-cols-4">
                    <div>
                        <div className="mb-4 flex items-center space-x-2">
                            <Logo />
                        </div>
                        <p className="text-muted-foreground">
                            The modern flashcard app for effective learning
                            using spaced repetition.
                        </p>
                    </div>

                    <div>
                        <h4 className="mb-4 font-semibold">Product</h4>
                        <ul className="text-muted-foreground space-y-2">
                            <li>
                                <Link
                                    href="/todo"
                                    className="hover:text-foreground transition-colors"
                                >
                                    Features
                                </Link>
                            </li>
                            <li>
                                <Link
                                    href="/todo"
                                    className="hover:text-foreground transition-colors"
                                >
                                    Pricing
                                </Link>
                            </li>
                            <li>
                                <Link
                                    href="/todo"
                                    className="hover:text-foreground transition-colors"
                                >
                                    Roadmap
                                </Link>
                            </li>
                        </ul>
                    </div>

                    <div>
                        <h4 className="mb-4 font-semibold">Support</h4>
                        <ul className="text-muted-foreground space-y-2">
                            <li>
                                <Link
                                    href="/todo"
                                    className="hover:text-foreground transition-colors"
                                >
                                    Documentation
                                </Link>
                            </li>
                            <li>
                                <Link
                                    href="/todo"
                                    className="hover:text-foreground transition-colors"
                                >
                                    Help Center
                                </Link>
                            </li>
                            <li>
                                <Link
                                    href="/todo"
                                    className="hover:text-foreground transition-colors"
                                >
                                    Contact
                                </Link>
                            </li>
                        </ul>
                    </div>

                    <div>
                        <h4 className="mb-4 font-semibold">Legal</h4>
                        <ul className="text-muted-foreground space-y-2">
                            <li>
                                <Link
                                    href="/todo"
                                    className="hover:text-foreground transition-colors"
                                >
                                    Privacy Policy
                                </Link>
                            </li>
                            <li>
                                <Link
                                    href="/todo"
                                    className="hover:text-foreground transition-colors"
                                >
                                    Terms of Service
                                </Link>
                            </li>
                            <li>
                                <Link
                                    href="https://github.com/Fx64b/learn/blob/main/LICENSE"
                                    className="hover:text-foreground transition-colors"
                                >
                                    License
                                </Link>
                            </li>
                        </ul>
                    </div>
                </div>
            </div>

            <div className="text-muted-foreground border-border container mx-auto mt-8 flex max-w-5xl flex-col items-center justify-between gap-4 border-t px-4 text-sm md:flex-row">
                <div className="mt-8 flex items-center gap-2">
                    <span>© {currentYear}</span>
                    <span className="flex items-center">
                        Made with{' '}
                        <Heart className="mx-1 h-3 w-3 fill-red-500 text-red-500" />{' '}
                        by
                        <Link
                            href="https://fx64b.dev"
                            target="_blank"
                            rel="noopener noreferrer"
                            className="text-foreground ml-1 font-medium hover:underline"
                        >
                            Fx64b
                        </Link>
                    </span>
                </div>

                <div className="flex items-center gap-4">
                    {version && (
                        <>
                            <Link
                                href={
                                    'https://github.com/Fx64b/learn/releases/tag/v' +
                                    version
                                }
                                className="hover:text-foreground hover:underline"
                            >
                                v{version}
                            </Link>
                            <Separator orientation="vertical" className="h-4" />
                        </>
                    )}
                    <span>
                        <Link
                            href="https://github.com/Fx64b/learn/blob/main/LICENSE"
                            className="hover:text-foreground hover:underline"
                        >
                            MIT License
                        </Link>
                    </span>
                    <Separator orientation="vertical" className="h-4" />
                    <span>
                        <Link
                            href="https://github.com/Fx64b/learn/blob/main/CHANGELOG.md"
                            className="hover:text-foreground hover:underline"
                        >
                            Changelog
                        </Link>
                    </span>
                    <Separator orientation="vertical" className="h-4" />
                    <Link
                        href="https://github.com/Fx64b/learn"
                        target="_blank"
                        rel="noopener noreferrer"
                        className="hover:text-foreground"
                        aria-label="GitHub Repository"
                    >
                        <Github className="h-4 w-4" />
                    </Link>
                </div>
            </div>
        </footer>
    )
}
