import { resolve } from 'path'
import { defineConfig } from 'vitest/config'

export default defineConfig({
    test: {
        environment: 'happy-dom',
        setupFiles: ['./test-setup.ts'],
        globals: true,
    },
    resolve: {
        alias: {
            '@': resolve(__dirname, './'),
        },
    },
})
