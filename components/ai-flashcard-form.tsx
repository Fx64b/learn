'use client'

import { FileText, Loader2, Sparkles, Upload, X } from 'lucide-react'
import { toast } from 'sonner'

import { useCallback, useState } from 'react'

import { useTranslations } from 'next-intl'
import { useRouter } from 'next/navigation'

import { generateAIFlashcards } from '@/app/actions/ai-flashcards'

import { Alert, AlertDescription } from '@/components/ui/alert'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'

interface AIFlashcardFormProps {
    deckId: string
}

export function AIFlashcardForm({ deckId }: AIFlashcardFormProps) {
    const t = useTranslations('deck.ai')
    const router = useRouter()
    const [prompt, setPrompt] = useState('')
    const [file, setFile] = useState<File | null>(null)
    const [isGenerating, setIsGenerating] = useState(false)
    const [dragActive, setDragActive] = useState(false)

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

        setIsGenerating(true)

        try {
            let fileContent: string | undefined
            let fileType: string | undefined

            if (file) {
                // Validate file size (10MB limit)
                if (file.size > 10 * 1024 * 1024) {
                    toast.error(t('fileTooLarge', { max: '10MB' }))
                    setIsGenerating(false)
                    return
                }

                fileContent = await fileToBase64(file)
                fileType = file.type
            }

            const result = await generateAIFlashcards({
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
        } catch (error) {
            console.error('Error generating flashcards:', error)
            toast.error(t('unexpectedError'))
        } finally {
            setIsGenerating(false)
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
            </CardContent>
        </Card>
    )
}
