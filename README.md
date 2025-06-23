# Flashcard Learning App

<img src="public/logo-dark.png" alt="Logo" style="width: 150px;" />

A modern flashcard application for effective learning using the Spaced Repetition System (SRS). Built with Next.js 15, TypeScript, and Turso database.

[![Build and Lint](https://github.com/Fx64b/learn/actions/workflows/build-lint.yml/badge.svg)](https://github.com/Fx64b/learn/actions/workflows/build-lint.yml)

> [!IMPORTANT]  
> This project is currently in **early development**. Features may change, and the application is not yet ready for personal production use.

## Features

- 🗂️ **Deck Management**: Create and organize flashcard decks by categories
- 📚 **Spaced Repetition**: Study cards with an intelligent SRS algorithm
- 👤 **User Authentication**: Secure email-based login via Resend
- 📊 **Progress Tracking**: Monitor learning streaks, success rates, and daily progress
- 🔄 **Bulk Import**: Import multiple cards via JSON format
- ⏱️ **Study Sessions**: Track study time and analyze productive hours
- 📱 **Responsive Design**: Works perfectly on desktop and mobile devices
- 🌙 **Dark Mode**: Eye-friendly interface with dark mode support
- ⌨️ **Keyboard Shortcuts**: Learn faster with keyboard navigation

## Tech Stack

- **Framework**: Next.js 15.3.1 with App Router
- **Language**: TypeScript
- **Database**: Turso (SQLite) with Drizzle ORM
- **Authentication**: NextAuth.js with email provider
- **Email**: Resend
- **UI**: shadcn/ui + Tailwind CSS
- **Animations**: Framer Motion
- **State Management**: Zustand
- **Rate Limiting**: Upstash Redis

## Prerequisites

- Node.js 20+ (for React 19 support)
- pnpm
- A Turso account (database)
- A Resend account (email authentication)
- Optional: Redis/Upstash for rate limiting

## Getting Started

### 1. Clone the Repository

```bash
git clone https://github.com/Fx64b/learn
cd learn
```

### 2. Install Dependencies

```bash
pnpm install
```

### 3. Environment Setup

Create a `.env.local` file based on `.env.local.example`:

```bash
cp .env.local.example .env.local
```

Fill in the required environment variables:

```env
# Turso Database
DATABASE_URL="your-turso-database-url"
DATABASE_AUTH_TOKEN="your-turso-auth-token"

# NextAuth
NEXTAUTH_URL="http://localhost:3000"
NEXTAUTH_SECRET="your-random-secret"

# Resend (for email authentication)
RESEND_API_KEY="your-resend-api-key"
EMAIL_FROM="noreply@yourdomain.com"

# Optional: Redis for rate limiting
REDIS_URL="your-redis-url"
KV_REST_API_TOKEN="your-api-token"
KV_REST_API_URL="your-api-url"
```

### 4. Database Setup

1. Create a Turso database:

```bash
turso db create flashcard-app
```

2. Get your database credentials:

```bash
turso db url flashcard-app
turso db token create flashcard-app --write
```

3. Run migrations:

```bash
pnpm db:generate
pnpm db:migrate
```

### 5. Run the Development Server

```bash
pnpm dev
```

Open [http://localhost:3000](http://localhost:3000) to view the application.

## Available Scripts

| Command            | Description                             |
| ------------------ | --------------------------------------- |
| `pnpm dev`         | Start development server with Turbopack |
| `pnpm build`       | Build for production                    |
| `pnpm start`       | Start production server                 |
| `pnpm lint`        | Run ESLint                              |
| `pnpm format`      | Format code with Prettier               |
| `pnpm db:generate` | Generate DB migrations                  |
| `pnpm db:migrate`  | Run DB migrations                       |

## Project Structure

```
.
├── app/                    # Next.js app directory
│   ├── actions/           # Server actions
│   ├── api/               # API routes
│   ├── deck/              # Deck management pages
│   ├── learn/             # Learning/study pages
│   └── ...
├── components/            # React components
│   ├── ui/               # shadcn/ui components
│   ├── flashcard.tsx     # Main flashcard component
│   └── ...
├── db/                    # Database setup
│   ├── migrations/       # Drizzle migrations
│   ├── schema.ts         # Database schema
│   └── utils.ts          # Database utilities
├── lib/                   # Utilities & helpers
│   ├── auth.ts           # Authentication setup
│   ├── srs.ts            # Spaced repetition algorithm
│   └── ...
├── types/                 # TypeScript types
└── ...
```

## Authentication

The app uses NextAuth with email-based authentication via Resend:

1. Users enter their email address
2. They receive a login link via email
3. Clicking the link logs them in
4. Sessions are managed with JWT

## Database Schema

Key tables:

- `users` - User accounts
- `decks` - Flashcard collections
- `flashcards` - Individual cards
- `card_reviews` - Spaced repetition tracking
- `study_sessions` - Study time tracking

## Usage

### Creating a Deck

1. Click "Neues Deck" on the home page
2. Fill in the title, description, and category
3. Click "Deck erstellen"
4. You'll be redirected to the edit page to add cards

### Adding Cards

1. On the edit page, you can:
    - Add individual cards manually
    - Import multiple cards from JSON
2. Cards automatically appear in the learning queue

### Learning

1. Click "Lernen" on a deck
2. Review cards and rate them (1-4):
    - 1: Again (hard)
    - 2: Hard
    - 3: Good
    - 4: Easy
3. The system schedules reviews based on your ratings
4. Use keyboard shortcuts for faster navigation:
    - Space: Flip card
    - 1-4: Rate card
    - Arrow keys: Rate card (when flipped)

### Study Analytics

The dashboard provides insights into:

- Daily learning progress
- Streak tracking
- Time of day analysis
- Cards by difficulty
- Due cards overview

## Development Roadmap

### Upcoming Features

1. **Advanced Learning Features**

    - Image support for flashcards
    - Audio pronunciation
    - Rich text formatting
    - Multi-language support

2. **Collaboration**

    - Share decks with others
    - Community deck library
    - Group studying

3. **Gamification**
    - Achievement system
    - Experience points
    - Daily challenges

See [TODO.md](./TODO.md) for a complete list of planned features.

### Activity

![Alt](https://repobeats.axiom.co/api/embed/e26f5c728d5b30144b3d3353306a519469a999f0.svg 'Repobeats analytics image')

## License

MIT License

## Support

For issues and feature requests, please create an issue in the repository.

## Contributing

Contributions are welcome! Please fork the repository and submit a pull request.
