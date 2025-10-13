import { createClient } from '@libsql/client'
import { drizzle } from 'drizzle-orm/libsql'
import { migrate } from 'drizzle-orm/libsql/migrator'

async function runMigrations() {
    const client = createClient({
        url: process.env.DATABASE_URL!,
        authToken: process.env.DATABASE_AUTH_TOKEN,
    })

    const db = drizzle(client)

    console.log('Running migrations...')

    await migrate(db, { migrationsFolder: './db/migrations' })

    console.log('Migrations completed!')

    process.exit(0)
}

runMigrations().catch((e) => {
    console.error('Migration failed:', e)
    process.exit(1)
})
