'use client'

import { FileText, Loader2, Sparkles, Upload, X, XCircle } from 'lucide-react'
import { toast } from 'sonner'

import { useCallback, useState } from 'react'

import { useTranslations } from 'next-intl'
import { useRouter } from 'next/navigation'

import { useAIFlashcards } from '@/lib/hooks/use-ai-flashcards'

import { Alert, AlertDescription } from '@/components/ui/alert'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { DismissibleWarning } from '@/components/ui/dismissible-warning'
import { Label } from '@/components/ui/label'
import { Progress } from '@/components/ui/progress'
import { Textarea } from '@/components/ui/textarea'

interface AIFlashcardFormProps {
    deckId: string
}

export function AIFlashcardForm({ deckId }: AIFlashcardFormProps) {
    const t = useTranslations('deck.ai')
    const router = useRouter()
    const [prompt, setPrompt] = useState('')
    const [file, setFile] = useState<File | null>(null)
    const [dragActive, setDragActive] = useState(false)
    
    const { isGenerating, progress, generateFlashcards, cancelGeneration } = useAIFlashcards()

    const handleDrag = useCallback((e: React.DragEvent) => {
        e.preventDefault()
        e.stopPropagation()
        if (e.type === 'dragenter' || e.type === 'dragover') {
            setDragActive(true)
        } else if (e.type === 'dragleave') {
            setDragActive(false)
        }
    }, [])

    const handleDrop = useCallback(
        (e: React.DragEvent) => {
            e.preventDefault()
            e.stopPropagation()
            setDragActive(false)

            const droppedFile = e.dataTransfer.files?.[0]
            if (droppedFile && droppedFile.type === 'application/pdf') {
                setFile(droppedFile)
            } else {
                toast.error(t('invalidFileType'))
            }
        },
        [t]
    )

    const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const selectedFile = e.target.files?.[0]
        if (selectedFile && selectedFile.type === 'application/pdf') {
            setFile(selectedFile)
        } else {
            toast.error(t('invalidFileType'))
        }
    }

    const removeFile = () => {
        setFile(null)
    }

    const fileToBase64 = (file: File): Promise<string> => {
        return new Promise((resolve, reject) => {
            const reader = new FileReader()
            reader.readAsDataURL(file)
            reader.onload = () => {
                const base64 = reader.result as string
                // Remove data URL prefix to get pure base64
                const base64Content = base64.split(',')[1]
                resolve(base64Content)
            }
            reader.onerror = (error) => reject(error)
        })
    }

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault()

        if (!prompt.trim()) {
            toast.error(t('promptRequired'))
            return
        }

        try {
            let fileContent: string | undefined
            let fileType: string | undefined

            if (file) {
                // Validate file size (10MB limit)
                if (file.size > 10 * 1024 * 1024) {
                    toast.error(t('fileTooLarge', { max: '10MB' }))
                    return
                }

                fileContent = await fileToBase64(file)
                fileType = file.type
            }

            const result = await generateFlashcards({
                deckId,
                prompt: prompt.trim(),
                fileContent,
                fileType,
            })

            if (result.requiresPro) {
                // Show upgrade modal or redirect
                toast.error(result.error || t('proRequired'))
                router.push('/pricing')
                return
            }

            if (result.success) {
                toast.success(result.message || t('success'))
                setPrompt('')
                setFile(null)
                // Refresh the page to show new cards
                router.refresh()
            } else {
                toast.error(result.error || t('error'))
            }
        } catch (error: unknown) {
            console.error('Error generating flashcards:', error)
            
            if (error && typeof error === 'object' && 'type' in error) {
                const typedError = error as { type: string; error?: string; data?: { requiresPro?: boolean } }
                if (typedError.type === 'rate_limit') {
                    if (typedError.data?.requiresPro) {
                        toast.error(typedError.error || t('proRequired'))
                        router.push('/pricing')
                    } else {
                        toast.error(typedError.error || t('rateLimitExceeded'))
                    }
                } else {
                    toast.error(typedError.error || t('unexpectedError'))
                }
            } else {
                toast.error(t('unexpectedError'))
            }
        }
    }

    return (
        <Card>
            <CardHeader>
                <CardTitle className="flex items-center gap-2">
                    {t('title')}
                    <Badge className="ml-2" variant={'outline'}>
                        <Sparkles /> Pro
                    </Badge>
                </CardTitle>
            </CardHeader>
            <CardContent>
                <form onSubmit={handleSubmit} className="space-y-4">
                    <div className="space-y-2">
                        <Label htmlFor="ai-prompt">{t('promptLabel')}</Label>
                        <Textarea
                            id="ai-prompt"
                            value={prompt}
                            onChange={(e) => setPrompt(e.target.value)}
                            placeholder={t('promptPlaceholder')}
                            className="min-h-[110px]"
                            maxLength={1000}
                            required
                        />
                        <p className="text-muted-foreground text-xs">
                            {prompt.length}/1000 {t('characters')}
                        </p>
                    </div>

                    <div className="space-y-2">
                        <Label>{t('documentLabel')}</Label>
                        <div
                            className={`relative rounded-lg border-2 border-dashed p-6 text-center transition-colors ${
                                dragActive
                                    ? 'border-primary bg-primary/5'
                                    : 'border-muted-foreground/25 hover:border-muted-foreground/50'
                            }`}
                            onDragEnter={handleDrag}
                            onDragLeave={handleDrag}
                            onDragOver={handleDrag}
                            onDrop={handleDrop}
                        >
                            {file ? (
                                <div className="bg-muted flex items-center justify-between rounded-md p-3">
                                    <div className="flex items-center gap-2">
                                        <FileText className="h-4 w-4" />
                                        <span className="text-sm font-medium">
                                            {file.name}
                                        </span>
                                        <span className="text-muted-foreground text-xs">
                                            (
                                            {(file.size / 1024 / 1024).toFixed(
                                                2
                                            )}{' '}
                                            MB)
                                        </span>
                                    </div>
                                    <Button
                                        type="button"
                                        variant="ghost"
                                        size="sm"
                                        onClick={removeFile}
                                    >
                                        <X className="h-4 w-4" />
                                    </Button>
                                </div>
                            ) : (
                                <>
                                    <Upload className="text-muted-foreground mx-auto h-8 w-8" />
                                    <p className="text-muted-foreground mt-2 text-sm">
                                        {t('dropFile')}
                                    </p>
                                    <p className="text-muted-foreground text-xs">
                                        {t('maxFileSize')}
                                    </p>
                                </>
                            )}
                            <input
                                type="file"
                                accept="application/pdf"
                                onChange={handleFileChange}
                                className="absolute inset-0 cursor-pointer opacity-0"
                            />
                        </div>
                    </div>

                    {file && file.size > 3 * 1024 * 1024 && (
                        <DismissibleWarning
                            id="largeFileUpload"
                            message={t('largeFileWarning')}
                            dismissText={t('dismissWarning')}
                            variant="default"
                        />
                    )}

                    {progress && (
                        <div className="space-y-3">
                            <div className="flex items-center justify-between">
                                <Label className="text-sm font-medium">
                                    {progress.message}
                                </Label>
                                <Button
                                    type="button"
                                    variant="ghost"
                                    size="sm"
                                    onClick={cancelGeneration}
                                    className="h-8 w-8 p-0"
                                >
                                    <XCircle className="h-4 w-4" />
                                </Button>
                            </div>
                            <div className="space-y-2">
                                <Progress value={progress.percentage} className="h-2" />
                                <p className="text-xs text-muted-foreground">
                                    {progress.step} - {progress.percentage}% complete
                                </p>
                            </div>
                        </div>
                    )}

                    <Alert>
                        <Sparkles className="h-4 w-4" />
                        <AlertDescription>{t('helpText')}</AlertDescription>
                    </Alert>

                    <Button
                        type="submit"
                        className="w-full"
                        disabled={isGenerating || !prompt.trim()}
                    >
                        {isGenerating ? (
                            <>
                                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                                {t('generating')}
                            </>
                        ) : (
                            <>
                                <Sparkles className="mr-2 h-4 w-4" />
                                {t('generateButton')}
                            </>
                        )}
                    </Button>
                </form>
                <div className={'mt-4 ' + (isGenerating ? 'flex' : 'hidden')}>
                    <DismissibleWarning
                        id="aiDisclaimer"
                        message={t('aiDisclaimer')}
                        dismissText={t('dismissDisclaimer')}
                        variant="default"
                        className="mb-4"
                    />
                </div>
            </CardContent>
        </Card>
    )
}
