'use client'

import { X } from 'lucide-react'

import type React from 'react'
import { type KeyboardEvent, useRef, useState } from 'react'

import { Badge } from '@/components/ui/badge'
import { Input } from '@/components/ui/input'

interface TagInputProps {
    tags: string[]
    onChange: (tags: string[]) => void
    placeholder?: string
    id?: string
    required?: boolean
}

export function TagInput({
    tags,
    onChange,
    placeholder,
    id,
    required = false,
}: TagInputProps) {
    const [inputValue, setInputValue] = useState('')
    const inputRef = useRef<HTMLInputElement>(null)

    const addTag = (tag: string) => {
        const trimmedTag = tag.trim()
        if (trimmedTag && !tags.includes(trimmedTag)) {
            onChange([...tags, trimmedTag])
        }
        setInputValue('')
    }

    const removeTag = (tagToRemove: string) => {
        onChange(tags.filter((tag) => tag !== tagToRemove))
    }

    const handleKeyDown = (e: KeyboardEvent<HTMLInputElement>) => {
        // Check for Enter, Space, or Comma
        if (e.key === 'Enter' || e.key === ' ' || e.key === ',') {
            e.preventDefault()
            addTag(inputValue)
        } else if (
            e.key === 'Backspace' &&
            inputValue === '' &&
            tags.length > 0
        ) {
            // Remove last tag when backspace is pressed on empty input
            removeTag(tags[tags.length - 1])
        }
    }

    const handleBlur = () => {
        // Add tag on blur if there's text in the input
        if (inputValue.trim()) {
            addTag(inputValue)
        }
    }

    return (
        <div
            className="border-input bg-background ring-offset-background focus-within:ring-ring flex min-h-[40px] w-full flex-wrap items-center gap-2 rounded-md border px-3 py-2 text-base focus-within:ring-2 focus-within:ring-offset-2 focus-within:outline-none disabled:cursor-not-allowed disabled:opacity-50 md:text-sm"
            onClick={() => inputRef.current?.focus()}
        >
            {tags.map((tag) => (
                <Badge
                    key={tag}
                    variant="secondary"
                    className="gap-1 pr-1 pl-2"
                >
                    {tag}
                    <button
                        type="button"
                        onClick={(e) => {
                            e.stopPropagation()
                            removeTag(tag)
                        }}
                        className="hover:bg-secondary-foreground/20 ml-1 rounded-sm"
                    >
                        <X className="h-3 w-3" />
                        <span className="sr-only">Remove {tag}</span>
                    </button>
                </Badge>
            ))}
            <Input
                ref={inputRef}
                id={id}
                type="text"
                value={inputValue}
                onChange={(e) => setInputValue(e.target.value)}
                onKeyDown={handleKeyDown}
                onBlur={handleBlur}
                placeholder={tags.length === 0 ? placeholder : ''}
                className="h-7 flex-1 border-0 bg-transparent p-0 shadow-none ring-0 outline-none focus-visible:ring-0 focus-visible:ring-offset-0"
                required={required && tags.length === 0}
            />
        </div>
    )
}
