'use client'

import { CheckCircle2, Clock, Code2, Hammer, Lightbulb } from 'lucide-react'

import Link from 'next/link'

import { Badge } from '@/components/ui/badge'
import {
    Card,
    CardContent,
    CardDescription,
    CardHeader,
    CardTitle,
} from '@/components/ui/card'

export default function TodoPage() {
    const developerTodos = [
        {
            task: 'Improve usability of the user interface',
            status: 'in-progress',
            priority: 'high',
        },
        {
            task: 'Improve dashboard analytics and statistics',
            status: 'in-progress',
            priority: 'medium',
        },
        {
            task: 'Add advanced learning mode with custom input and AI validation',
            status: 'planning',
            priority: 'medium',
        },
        { task: 'Optimize database queries', status: 'todo', priority: 'low' },
        {
            task: 'Write comprehensive documentation',
            status: 'todo',
            priority: 'medium',
        },
    ]

    const getStatusIcon = (status: string) => {
        switch (status) {
            case 'in-progress':
                return <Clock className="h-4 w-4 text-orange-500" />
            case 'planning':
                return <Lightbulb className="h-4 w-4 text-yellow-500" />
            case 'todo':
                return <Code2 className="h-4 w-4 text-gray-500" />
            default:
                return <CheckCircle2 className="h-4 w-4 text-green-500" />
        }
    }

    const getPriorityColor = (priority: string) => {
        switch (priority) {
            case 'high':
                return 'bg-red-100 text-red-800 border-red-200'
            case 'medium':
                return 'bg-yellow-100 text-yellow-800 border-yellow-200'
            case 'low':
                return 'bg-green-100 text-green-800 border-green-200'
            default:
                return 'bg-gray-100 text-gray-800 border-gray-200'
        }
    }

    return (
        <>
            <div className="min-h-screen">
                <div className="container mx-auto max-w-4xl px-4 py-12">
                    {/* Header Section */}
                    <div className="mb-12 text-center">
                        <h1 className="mb-4 text-4xl font-bold">
                            {' '}
                            <div className="relative top-[-10] left-5 inline-flex h-16 w-16 items-center justify-center rounded-full">
                                <Hammer className="animate-hammer h-8 w-8" />
                            </div>
                            Coming Soon
                        </h1>
                        <p className="mb-2 text-xl">
                            This feature is currently under development
                        </p>
                        <p className="mx-auto max-w-2xl">
                            You've discovered a page that's still being crafted.
                            Our development team is working hard to bring you
                            something amazing. Check back soon!
                        </p>
                    </div>

                    {/* Developer Todo Section */}
                    <Card className="border-0 shadow-lg backdrop-blur-sm">
                        <CardHeader className="pb-4 text-center sm:pb-6">
                            <CardTitle className="flex items-center justify-center gap-2 text-xl font-semibold sm:text-2xl">
                                <Code2 className="text-primary h-5 w-5 sm:h-6 sm:w-6" />
                                Development Progress
                            </CardTitle>
                            <CardDescription className="text-sm sm:text-base">
                                Here's what our team is currently working on
                            </CardDescription>
                        </CardHeader>
                        <CardContent className="px-4 sm:px-6">
                            <div className="space-y-3 sm:space-y-4">
                                {developerTodos.map((todo, index) => (
                                    <div
                                        key={index}
                                        className="flex flex-col gap-3 rounded-lg border p-3 transition-all duration-200 hover:shadow-md sm:flex-row sm:items-center sm:gap-4 sm:p-4"
                                    >
                                        <div className="flex min-w-0 flex-1 items-start gap-3 align-middle sm:items-center">
                                            {getStatusIcon(todo.status)}
                                            <span className="text-sm leading-relaxed font-medium select-none sm:text-base">
                                                {todo.task}
                                            </span>
                                        </div>
                                        <div className="ml-7 flex flex-shrink-0 items-center gap-2 sm:ml-0">
                                            <Badge
                                                variant="outline"
                                                className={`text-xs font-medium select-none hover:cursor-default ${getPriorityColor(todo.priority)}`}
                                            >
                                                {todo.priority}
                                            </Badge>
                                            <Badge
                                                variant="secondary"
                                                className="selection-none text-xs font-medium capitalize"
                                            >
                                                {todo.status.replace('-', ' ')}
                                            </Badge>
                                        </div>
                                    </div>
                                ))}
                            </div>
                        </CardContent>
                    </Card>

                    {/* Footer Message */}
                    <div className="mt-12 text-center">
                        <p className="text-sm text-gray-500">
                            Have questions or suggestions? We'd love to hear
                            from you while we build this feature.
                        </p>
                        <p className="mt-4 text-sm text-gray-500">
                            You can follow the current development{' '}
                            <Link
                                className="text-primary underline"
                                href={'https://github.com/Fx64b/learn'}
                            >
                                here
                            </Link>
                            .
                        </p>
                    </div>
                </div>
            </div>
        </>
    )
}
