'use client'

import { useTranslations } from 'next-intl'
import Link from 'next/link'
import { Calendar, CheckCircle2, Clock, Lightbulb, Github } from 'lucide-react'

import { Badge } from '@/components/ui/badge'
import {
    Card,
    CardContent,
    CardHeader,
    CardTitle,
} from '@/components/ui/card'

export default function RoadmapPage() {
    const t = useTranslations('roadmap')

    const getStatusIcon = (status: string) => {
        switch (status) {
            case 'inProgress':
                return <Clock className="h-4 w-4 text-orange-500" />
            case 'planning':
                return <Lightbulb className="h-4 w-4 text-blue-500" />
            case 'testing':
                return <CheckCircle2 className="h-4 w-4 text-green-500" />
            default:
                return <Clock className="h-4 w-4 text-gray-500" />
        }
    }

    const getPriorityColor = (priority: string) => {
        switch (priority) {
            case 'high':
                return 'bg-red-100 text-red-800 border-red-200 dark:bg-red-900/20 dark:text-red-400 dark:border-red-800'
            case 'medium':
                return 'bg-yellow-100 text-yellow-800 border-yellow-200 dark:bg-yellow-900/20 dark:text-yellow-400 dark:border-yellow-800'
            case 'low':
                return 'bg-green-100 text-green-800 border-green-200 dark:bg-green-900/20 dark:text-green-400 dark:border-green-800'
            default:
                return 'bg-gray-100 text-gray-800 border-gray-200 dark:bg-gray-900/20 dark:text-gray-400 dark:border-gray-800'
        }
    }

    const getCategoryColor = (category: string) => {
        switch (category) {
            case 'ui':
                return 'bg-purple-100 text-purple-800 border-purple-200 dark:bg-purple-900/20 dark:text-purple-400 dark:border-purple-800'
            case 'learning':
                return 'bg-blue-100 text-blue-800 border-blue-200 dark:bg-blue-900/20 dark:text-blue-400 dark:border-blue-800'
            case 'ai':
                return 'bg-indigo-100 text-indigo-800 border-indigo-200 dark:bg-indigo-900/20 dark:text-indigo-400 dark:border-indigo-800'
            case 'mobile':
                return 'bg-pink-100 text-pink-800 border-pink-200 dark:bg-pink-900/20 dark:text-pink-400 dark:border-pink-800'
            case 'integration':
                return 'bg-teal-100 text-teal-800 border-teal-200 dark:bg-teal-900/20 dark:text-teal-400 dark:border-teal-800'
            case 'performance':
                return 'bg-orange-100 text-orange-800 border-orange-200 dark:bg-orange-900/20 dark:text-orange-400 dark:border-orange-800'
            default:
                return 'bg-gray-100 text-gray-800 border-gray-200 dark:bg-gray-900/20 dark:text-gray-400 dark:border-gray-800'
        }
    }

    const renderQuarterSection = (quarter: string) => {
        const features = t.raw(`features.${quarter}`) as Array<{
            title: string
            description: string
            category: string
            priority: string
            status: string
        }>
        
        return (
            <Card key={quarter} className="border-0 shadow-lg">
                <CardHeader className="pb-4">
                    <CardTitle className="flex items-center gap-2 text-xl font-semibold">
                        <Calendar className="h-5 w-5 text-primary" />
                        {t(`quarters.${quarter}`)}
                    </CardTitle>
                </CardHeader>
                <CardContent className="px-4 sm:px-6">
                    <div className="space-y-4">
                        {features.map((feature, index) => (
                            <div
                                key={index}
                                className="flex flex-col gap-3 rounded-lg border p-4 transition-all duration-200 hover:shadow-md"
                            >
                                <div className="flex items-start justify-between gap-3">
                                    <div className="flex-1 min-w-0">
                                        <div className="flex items-start gap-3 mb-2">
                                            {getStatusIcon(feature.status)}
                                            <h3 className="font-medium text-base leading-tight">
                                                {feature.title}
                                            </h3>
                                        </div>
                                        <p className="text-sm text-muted-foreground leading-relaxed ml-7">
                                            {feature.description}
                                        </p>
                                    </div>
                                </div>
                                <div className="flex flex-wrap gap-2 ml-7">
                                    <Badge
                                        variant="outline"
                                        className={`text-xs font-medium ${getCategoryColor(feature.category)}`}
                                    >
                                        {t(`categories.${feature.category}`)}
                                    </Badge>
                                    <Badge
                                        variant="outline"
                                        className={`text-xs font-medium ${getPriorityColor(feature.priority)}`}
                                    >
                                        {t(`priority.${feature.priority}`)}
                                    </Badge>
                                    <Badge
                                        variant="secondary"
                                        className="text-xs font-medium capitalize"
                                    >
                                        {t(`status.${feature.status}`)}
                                    </Badge>
                                </div>
                            </div>
                        ))}
                    </div>
                </CardContent>
            </Card>
        )
    }

    return (
        <div className="min-h-screen">
            <div className="container mx-auto max-w-6xl px-4 py-12">
                {/* Header Section */}
                <div className="mb-12 text-center">
                    <h1 className="mb-4 text-4xl font-bold">
                        <div className="relative top-[-10px] left-5 inline-flex h-16 w-16 items-center justify-center rounded-full">
                            <Calendar className="h-8 w-8 text-primary" />
                        </div>
                        {t('title')}
                    </h1>
                    <p className="mb-2 text-xl text-muted-foreground">{t('subtitle')}</p>
                    <p className="mx-auto max-w-3xl text-muted-foreground">{t('description')}</p>
                </div>

                {/* Roadmap Grid */}
                <div className="grid gap-8 md:grid-cols-2">
                    {renderQuarterSection('q1_2025')}
                    {renderQuarterSection('q2_2025')}
                    {renderQuarterSection('q1_2026')}
                    {renderQuarterSection('future')}
                </div>

                {/* Footer Section */}
                <div className="mt-12 text-center space-y-4">
                    <div className="text-sm text-muted-foreground bg-muted/50 rounded-lg p-4 mx-auto max-w-3xl">
                        <p className="font-medium mb-2">📋 {t('disclaimer')}</p>
                        <p>{t('feedback')}</p>
                    </div>
                    <p className="text-sm text-muted-foreground">
                        Have questions or suggestions? We&apos;d love to hear your ideas!{' '}
                        <Link
                            className="text-primary underline hover:no-underline"
                            href="https://github.com/Fx64b/learn"
                            target="_blank"
                            rel="noopener noreferrer"
                        >
                            <Github className="inline h-4 w-4 mr-1" />
                            GitHub
                        </Link>
                    </p>
                </div>
            </div>
        </div>
    )
}