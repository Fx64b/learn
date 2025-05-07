import { readFileSync } from 'fs'
import {Github, Heart} from 'lucide-react'
import { join } from 'path'

import Link from 'next/link'

import { Separator } from '@/components/ui/separator'

let cachedVersion: string | null = null;
try {
    const packageJsonPath = join(process.cwd(), 'package.json');
    const packageJson = JSON.parse(readFileSync(packageJsonPath, 'utf8'));
    cachedVersion = packageJson.version;
} catch (error) {
    console.error('Error reading version:', error);
    cachedVersion = null;
}

export function Footer() {
    const version = cachedVersion;
    const currentYear = new Date().getFullYear()

    return (
        <footer className="border-border mt-auto border-t py-6">
            <div className="text-muted-foreground container mx-auto flex max-w-5xl flex-col items-center justify-between gap-4 px-4 text-sm md:flex-row">
                <div className="flex items-center gap-2">
                    <span>© {currentYear}</span>
                    <span className="flex items-center">
                        Made with{' '}
                        <Heart className="mx-1 h-3 w-3 fill-red-500 text-red-500" /> by
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
                                href={"https://github.com/Fx64b/learn/releases/tag/v"+version}
                                className="hover:text-foreground hover:underline"
                            >
                                {version}
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
