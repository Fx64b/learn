import { readFileSync } from 'fs'
import { join } from 'path'

import { FooterContent } from '@/components/footer-content'

let cachedVersion: string | null = null
try {
    const packageJsonPath = join(process.cwd(), 'package.json')
    const packageJson = JSON.parse(readFileSync(packageJsonPath, 'utf8'))
    cachedVersion = packageJson.version
} catch (error) {
    console.error('Error reading version:', error)
    cachedVersion = null
}

export async function Footer() {
    const version = cachedVersion
    const currentYear = new Date().getFullYear()

    // INFO: this is such a weird approach, but if the whole footer is in here there are some errors like:
    // ions$2e$js__$5b$app$2d$rsc$5d$__$28$ecmascript$29$__$3c$export__default__as__getTranslations$3e$__.getTranslations) is not a function
    return <FooterContent version={version} currentYear={currentYear} />
}
