/**
 * Parse category field to tags array, supporting multiple legacy formats
 * @param category - The category string from database
 * @returns Array of tag strings
 */
export function parseCategoryToTags(category: string): string[] {
    // Try to parse as JSON array first (new format)
    try {
        const parsed = JSON.parse(category)
        if (Array.isArray(parsed)) {
            return parsed.filter((tag) => tag.trim()).map((tag) => tag.trim())
        }
    } catch {
        // Not JSON, continue to legacy format parsing
    }

    // Check for comma-separated values (legacy format)
    if (category.includes(',')) {
        return category
            .split(',')
            .map((tag) => tag.trim())
            .filter((tag) => tag)
    }

    // Check for space-separated values (legacy format)
    if (category.includes(' ')) {
        return category
            .split(' ')
            .map((tag) => tag.trim())
            .filter((tag) => tag)
    }

    // Single value (legacy format)
    return [category.trim()].filter((tag) => tag)
}
