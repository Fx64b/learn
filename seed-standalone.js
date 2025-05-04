import { createClient } from '@libsql/client'
import dotenv from 'dotenv'
import { drizzle } from 'drizzle-orm/libsql'
import { nanoid } from 'nanoid'

// Laden der Umgebungsvariablen
dotenv.config({ path: '.env.local' })

// Datenbankverbindung herstellen
const client = createClient({
    url: process.env.DATABASE_URL,
    authToken: process.env.DATABASE_AUTH_TOKEN,
})

console.log(
    '🔌 Verbindung zur Datenbank hergestellt:',
    process.env.DATABASE_URL
)

// Schema direkt definieren (vereinfachte Version)
const schema = {
    users: {
        id: 'id',
        email: 'email',
        erstelltAm: 'erstellt_am',
    },
    decks: {
        id: 'id',
        userId: 'user_id',
        titel: 'titel',
        beschreibung: 'beschreibung',
        kategorie: 'kategorie',
        erstelltAm: 'erstellt_am',
    },
    flashcards: {
        id: 'id',
        deckId: 'deck_id',
        vorderseite: 'vorderseite',
        rückseite: 'rückseite',
        istPrüfungsrelevant: 'ist_prüfungsrelevant',
        schwierigkeitsgrad: 'schwierigkeitsgrad',
        erstelltAm: 'erstellt_am',
    },
}

const db = drizzle(client)

// Hilfsfunktionen für SQL-Abfragen
async function insertUser(id, email) {
    const query = `
    INSERT INTO user (id, email, erstellt_am) 
    VALUES (?, ?, ?)
    ON CONFLICT (id) DO NOTHING
  `

    await client.execute({
        sql: query,
        args: [id, email, new Date().toISOString()],
    })
}

async function insertDeck(id, userId, titel, beschreibung, kategorie) {
    const query = `
    INSERT INTO decks (id, user_id, titel, beschreibung, kategorie, erstellt_am) 
    VALUES (?, ?, ?, ?, ?, ?)
    ON CONFLICT (id) DO NOTHING
  `

    await client.execute({
        sql: query,
        args: [
            id,
            userId,
            titel,
            beschreibung,
            kategorie,
            new Date().toISOString(),
        ],
    })
}

// Add this function to create the account entry
async function insertAccount(id, userId, type, provider, providerAccountId) {
    const query = `
        INSERT INTO account (id, user_id, type, provider, provider_account_id)
        VALUES (?, ?, ?, ?, ?) ON CONFLICT (id) DO NOTHING
    `

    await client.execute({
        sql: query,
        args: [id, userId, type, provider, providerAccountId],
    })
}

async function insertFlashcard(
    id,
    deckId,
    vorderseite,
    rückseite,
    istPrüfungsrelevant
) {
    const query = `
    INSERT INTO flashcards (id, deck_id, vorderseite, rückseite, ist_prüfungsrelevant, schwierigkeitsgrad, erstellt_am) 
    VALUES (?, ?, ?, ?, ?, ?, ?)
    ON CONFLICT (id) DO NOTHING
  `

    await client.execute({
        sql: query,
        args: [
            id,
            deckId,
            vorderseite,
            rückseite,
            istPrüfungsrelevant ? 1 : 0,
            0,
            new Date().toISOString(),
        ],
    })
}

async function checkIfFlashcardExists(deckId, vorderseite) {
    const result = await client.execute({
        sql: `SELECT id FROM flashcards WHERE deck_id = ? AND vorderseite = ?`,
        args: [deckId, vorderseite],
    })

    return result.rows.length > 0
}

// Hauptfunktion zum Seeden der Datenbank
async function seed() {
    console.log('🌱 Seeding database...')

    try {
        // Demo-User anlegen
        const DEMO_USER_ID = 'demo-user'
        await insertUser(DEMO_USER_ID, 'demo@example.com')
        console.log('👤 Demo-Benutzer erstellt oder bereits vorhanden')

        const DEMO_ACCOUNT_ID = nanoid()
        await insertAccount(
            DEMO_ACCOUNT_ID,
            DEMO_USER_ID,
            'email',
            'email',
            DEMO_USER_ID
        )
        console.log('👤 Demo-Account erstellt oder bereits vorhanden')

        // Kategorien
        const kategorien = [
            {
                id: 'gemeinschaft-und-staat',
                titel: 'Gemeinschaft und Staat',
                beschreibung:
                    'Politik, demokratische Prozesse und staatliche Institutionen',
            },
            {
                id: 'risiko-und-verantwortung',
                titel: 'Risiko und Verantwortung',
                beschreibung:
                    'Soziale Sicherheit, Versicherungen und Verantwortungsprinzipien',
            },
            {
                id: 'arbeit-und-markt',
                titel: 'Arbeit und Markt',
                beschreibung: 'Wirtschaft, Arbeitsrecht und Marktmechanismen',
            },
        ]

        // Decks erstellen
        for (const kategorie of kategorien) {
            await insertDeck(
                kategorie.id,
                DEMO_USER_ID,
                kategorie.titel,
                kategorie.beschreibung,
                kategorie.id
            )
            console.log(
                `📚 Deck "${kategorie.titel}" erstellt oder bereits vorhanden`
            )
        }

        // Beispielkarten
        const beispielKarten = {
            'gemeinschaft-und-staat': [
                {
                    vorderseite: 'Was ist der Begriff «Staat»?',
                    rückseite:
                        'Ein Volk schliesst sich innerhalb eines bestimmten Gebietes (Land, Territorium) zusammen und stellt Regeln für das Zusammenleben auf (Gesetzgebung), vollstreckt diese (Ausführung) und ahndet Zuwiderhandlungen (Rechtsprechung).',
                },
                {
                    vorderseite: 'Was ist der Zweck der Gewaltenteilung?',
                    rückseite:
                        'Die Gewaltenteilung hat den Zweck, die Macht im Staat auf drei voneinander unabhängige Organe aufzuteilen.',
                },
                {
                    vorderseite: 'Nenne die drei Gewalten auf Bundesebene.',
                    rückseite:
                        'Parlament (Legislative) = National- und Ständerat\nRegierung (Exekutive) = Bundesrat\nGerichte (Judikative) = Bundesgericht',
                },
                {
                    vorderseite: 'Was ist der Begriff Demokratie?',
                    rückseite:
                        'Volksherrschaft: Das Volk ist oberster Entscheidungsträger.',
                },
            ],
            'risiko-und-verantwortung': [
                {
                    vorderseite: 'Was ist das Solidaritätsprinzip?',
                    rückseite:
                        'Jedes Mitglied einer Gemeinschaft steht für die anderen Mitglieder ein und umgekehrt. «Einer für alle, alle für einen.»',
                },
                {
                    vorderseite:
                        'Was sind vier wichtige Leistungen, die durch die Grundversicherung der Krankenkasse nach KVG gedeckt sind?',
                    rückseite:
                        '1. Behandlungen bei einem Arzt oder einer Ärztin und Notfallbehandlungen im Ausland\n2. Spitalaufenthalt und Behandlung in der allgemeinen Abteilung\n3. Beiträge an ärztlich verschriebene Pflege zu Hause (Spitex) oder im Pflegeheim\n4. Sämtliche Medikamente, die ärztlich verschrieben wurden und in der «Spezialitätenliste» aufgeführt sind',
                },
                {
                    vorderseite: 'Was ist der Begriff Haftung?',
                    rückseite:
                        'Man muss für den Schaden einstehen, den man einer Drittperson zugefügt hat.',
                },
            ],
            'arbeit-und-markt': [
                {
                    vorderseite:
                        'Welche sind die drei Wirtschaftssektoren und nenne je zwei Beispiele.',
                    rückseite:
                        '1. Sektor (Primärsektor): Gewinnung von Rohstoffen, Urproduktion - z.B. Land- und Forstwirtschaft\n2. Sektor (Sekundärsektor): Verarbeitung/Veredelung von Rohstoffen - z.B. Handwerk, Industrie\n3. Sektor (Tertiärsektor): Verteilung von Gütern, Dienstleistungen - z.B. Handel, Banken',
                },
                {
                    vorderseite: 'Was ist der Grundgedanke des GAV?',
                    rückseite:
                        'Er bildet die Grundlage des Arbeitsfriedens in der Schweiz (Sozialpartnerschaft). Arbeitnehmer- und Arbeitgeberverbände handeln Vereinbarungen für einheitliche Arbeitsbedingungen aus.',
                },
                {
                    vorderseite:
                        'Was sind fünf Pflichten der/des Arbeitnehmenden gegenüber der/dem Arbeitgebenden?',
                    rückseite:
                        '1. Persönlich Arbeit im Dienste der/des Arbeitgebenden leisten\n2. Treuepflicht – keine Schwarzarbeit, keine Arbeit für eine:n Dritte:n, die den/die Arbeitgeber:in konkurrenziert\n3. Sorgfaltspflicht: Arbeitsgeräte und Maschinen usw. sorgfältig behandeln\n4. Wenn notwendig Überstundenarbeit leisten\n5. Anordnungen und Weisungen der/des Arbeitgebenden befolgen',
                },
            ],
        }

        // Karten für jedes Deck hinzufügen
        for (const [deckId, karten] of Object.entries(beispielKarten)) {
            for (const karte of karten) {
                const exists = await checkIfFlashcardExists(
                    deckId,
                    karte.vorderseite
                )

                if (!exists) {
                    const id = nanoid()
                    await insertFlashcard(
                        id,
                        deckId,
                        karte.vorderseite,
                        karte.rückseite,
                        true // istPrüfungsrelevant
                    )
                    console.log(
                        `📝 Flashcard "${karte.vorderseite.substring(0, 20)}..." erstellt`
                    )
                } else {
                    console.log(
                        `📝 Flashcard "${karte.vorderseite.substring(0, 20)}..." bereits vorhanden`
                    )
                }
            }
        }

        console.log('✅ Seeding abgeschlossen')
    } catch (error) {
        console.error('❌ Fehler beim Seeding:', error)
        throw error
    } finally {
        // Verbindung schließen
        await client.close()
    }
}

// Skript ausführen
seed()
    .then(() => {
        console.log('🎉 Seeding erfolgreich abgeschlossen')
        process.exit(0)
    })
    .catch((err) => {
        console.error('💥 Fehler beim Seeding:', err)
        process.exit(1)
    })
