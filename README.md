# Flashcard Learning App

A modern flashcard application for effective learning using the Spaced Repetition System (SRS). Built with Next.js 15, TypeScript, and Turso database.

[![Build and Lint](https://github.com/Fx64b/learn/actions/workflows/build-lint.yml/badge.svg)](https://github.com/Fx64b/learn/actions/workflows/build-lint.yml)

## Features

- 🗂️ Create and manage flashcard decks
- 📚 Study cards with spaced repetition algorithm
- 👤 User authentication via email (Resend)
- 📊 Track learning progress
- 🔄 Import/export cards via JSON
- 📱 Responsive design with dark mode support

## Tech Stack

- **Framework**: Next.js 15.3.1
- **Language**: TypeScript
- **Database**: Turso (SQLite) with Drizzle ORM
- **Authentication**: NextAuth.js
- **Email**: Resend
- **UI**: shadcn/ui + Tailwind CSS
- **Animations**: Framer Motion

## Prerequisites

- Node.js 20+ (for React 19 support)
- pnpm
- A Turso account (database)
- A Resend account (email authentication)

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

4. Seed the database with example data:

```bash
pnpm db:seed
```

### 5. Run the Development Server

```bash
pnpm dev
```

Open [http://localhost:3000](http://localhost:3000) to view the application.

## Available Scripts

**Start development server with Turbopack**

```bash
pnpm dev
```

**Build for production**

```bash
pnpm build
```

**Start production server**

```bash
pnpm start
```

**Run ESLint**

```bash
pnpm lint
```

**Format code with Prettier**

```bash
pnpm format
```

**Generate DB migrations**

```bash
pnpm db:generate
```

**Run DB migrations**

```bash
pnpm db:migrate
```

**Seed the database**

```bash
pnpm db:seed
```

## Project Structure

```
.
├── app/                    # Next.js app directory
│   ├── actions/           # Server actions
│   ├── api/auth/          # NextAuth configuration
│   ├── deck/              # Deck management pages
│   ├── lernen/            # Learning/study pages
│   └── ...
├── components/            # React components
│   ├── ui/               # shadcn/ui components
│   └── ...
├── db/                    # Database setup
│   ├── migrations/       # Drizzle migrations
│   └── ...
├── lib/                   # Utilities & helpers
└── types/                 # TypeScript types
```

## Authentication

The app uses NextAuth with email-based authentication via Resend:

1. Users enter their email
2. They receive a login link via email
3. Clicking the link logs them in

## Database Schema

Key tables:

- `users` - User accounts
- `accounts` - OAuth/email account details
- `sessions` - User sessions
- `decks` - Flashcard collections
- `flashcards` - Individual cards
- `card_reviews` - Spaced repetition tracking

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

1. Click "Lernen starten" on a deck
2. Review cards and rate them (1-4):
    - 1: Again (hard)
    - 2: Hard
    - 3: Good
    - 4: Easy
3. The system schedules reviews based on your ratings

## License

MIT License

## Support

For issues and feature requests, please create an issue in the repository.
