# Flashcard Learning App

<img src="public/logo-dark.png" alt="Logo" style="width: 150px;" />

A modern flashcard application for effective learning using the Spaced Repetition System (SRS). Built with Next.js 15, TypeScript, and Turso database. Available in English and German.

[![Build and Lint](https://github.com/Fx64b/learn/actions/workflows/build-lint.yml/badge.svg)](https://github.com/Fx64b/learn/actions/workflows/build-lint.yml)

> [!IMPORTANT]  
> This project is currently in **beta**. While core features are stable, some features may change based on user feedback.

## Features

### Core Learning Features

- **Advanced Deck Management**
    - Create and organize flashcard decks by categories
    - Set due dates for time-sensitive learning goals
    - Export decks to JSON format
    - Import decks from JSON with bulk card creation
    - Reset learning progress while keeping cards
    - Safe deck deletion with cascade removal

- **Intelligent Spaced Repetition System**
    - SuperMemo-2 algorithm implementation
    - Smart scheduling based on performance
    - Review intervals up to 365 days

- **Flexible Study Modes**
    - Study individual decks
    - Review all cards across decks
    - Focus on difficult cards (ease factor < 2.5)
    - Review due cards with smart prioritization
    - Shuffle cards for varied practice

### Progress & Analytics

- **Comprehensive Statistics**
    - Daily/weekly/monthly progress tracking
    - Success rate monitoring
    - Learning streak tracking
    - Cards by difficulty distribution
    - Time of day productivity analysis
    - Study session duration tracking

- **Smart Study Sessions**
    - Real-time session timer
    - Auto-save progress every 20 seconds
    - Pause/resume on tab switching
    - Session completion tracking
    - Cards reviewed counter

### User Experience

- **Internationalization**
    - Full support for English and German
    - Language switcher in header
    - Locale persistence for users
    - Localized date/time formats

- **Customization Options**
    - Light/Dark/System theme modes
    - Animation controls (enable/disable)
    - Animation speed adjustment (100-500ms)
    - Animation direction (horizontal/vertical)
    - User preferences persistence

- **Keyboard Shortcuts**
    - Space: Flip card
    - 1-4: Rate card (when flipped)
    - Arrow keys: Alternative rating
        - ←: Again (1)
        - ↓: Hard (2)
        - ↑: Good (3)
        - →: Easy (4)

### Technical Features

- **Secure Authentication**
    - Email-based magic link authentication
    - Session management with JWT
    - Protected routes
    - Email verification flow

- **Security & Performance**
    - Rate limiting on API endpoints
    - Security headers (XSS, CSRF protection)
    - SQL injection prevention
    - Optimized database queries with indexes

- **Responsive Design**
    - Mobile-first approach
    - Touch-optimized interactions
    - Progressive Web App ready
    - Offline capability (planned)

## Tech Stack

- **Framework**: Next.js 15 with App Router
- **Language**: TypeScript
- **Database**: Turso (SQLite) with Drizzle ORM
- **Authentication**: NextAuth.js v4 with email provider
- **Email Service**: Resend
- **UI Components**:
    - shadcn/ui (Radix UI + Tailwind CSS)
    - Framer Motion for animations
    - Sonner for toast notifications
- **State Management**: Zustand for client state
- **Internationalization**: next-intl
- **Date Handling**: date-fns
- **Rate Limiting**: Upstash Redis
- **Analytics**: Vercel Analytics
- **Styling**: Tailwind CSS v4 with CSS variables

## Prerequisites

- Node.js 20+ (required for React 19)
- pnpm 10+
- A Turso account for database
- A Resend account for email authentication
- Optional: Redis/Upstash account for rate limiting

## 🚀 Getting Started

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
# Turso Database (Required)
DATABASE_URL="libsql://your-database.turso.io"
DATABASE_AUTH_TOKEN="your-turso-auth-token"

# NextAuth (Required)
NEXTAUTH_URL="http://localhost:3000"
NEXTAUTH_SECRET="generate-a-random-secret-here"

# Resend (Required for email authentication)
RESEND_API_KEY="re_your_api_key"
EMAIL_FROM="noreply@yourdomain.com"

# Redis for rate limiting (Optional but recommended)
REDIS_URL="redis://your-redis-url"
KV_REST_API_TOKEN="your-upstash-token"
KV_REST_API_URL="https://your-instance.upstash.io"

# Environment
NODE_ENV="development"
```

### 4. Database Setup

1. Create a Turso database:

```bash
turso db create flashcard-app
```

2. Get your database credentials:

```bash
turso db url flashcard-app
turso db tokens create flashcard-app
```

3. Generate and run migrations:

```bash
pnpm db:generate
pnpm db:migrate
```

### 5. Run the Development Server

```bash
pnpm dev
```

Open [http://localhost:3000](http://localhost:3000) to start learning!

## Available Scripts

| Command            | Description                             |
| ------------------ | --------------------------------------- |
| `pnpm dev`         | Start development server with Turbopack |
| `pnpm build`       | Build for production                    |
| `pnpm start`       | Start production server                 |
| `pnpm lint`        | Run ESLint                              |
| `pnpm format`      | Format code with Prettier               |
| `pnpm db:generate` | Generate Drizzle migrations             |
| `pnpm db:migrate`  | Run database migrations                 |

## Project Structure

```
.
├── app/                    # Next.js app directory
│   ├── actions/           # Server actions for data mutations
│   ├── api/               # API routes (auth)
│   ├── deck/              # Deck management pages
│   │   ├── create/        # Create new deck
│   │   └── [id]/
│   │       └── edit/      # Edit deck & manage cards
│   ├── learn/             # Learning/study pages
│   │   ├── [category]/    # Study specific deck
│   │   ├── all/           # Study all cards
│   │   ├── difficult/     # Study difficult cards
│   │   └── due/           # Study due cards
│   ├── login/             # Authentication page
│   ├── profile/           # User profile & settings
│   └── verify-request/    # Email verification
├── components/            # React components
│   ├── ui/               # shadcn/ui base components
│   ├── misc/             # Utility components
│   ├── pages/            # Page-specific components
│   ├── statistics/       # Charts and analytics
│   └── flashcard.tsx     # Core flashcard component
├── db/                    # Database layer
│   ├── migrations/       # SQL migrations
│   ├── auth-schema.ts    # Auth-related tables
│   ├── schema.ts         # Main database schema
│   └── utils.ts          # Database utilities
├── lib/                   # Utilities & configuration
│   ├── auth.ts           # NextAuth configuration
│   ├── srs.ts            # Spaced repetition algorithm
│   ├── i18n.ts           # Internationalization setup
│   └── date.ts           # Date handling utilities
├── messages/              # Translation files
│   ├── en.json           # English translations
│   └── de.json           # German translations
├── store/                 # Client-side state
│   └── userPreferences.ts # User preferences store
├── types/                 # TypeScript definitions
└── middleware.ts          # Next.js middleware
```

## Database Schema

The app uses the following main tables:

- **users** - User accounts and profiles
- **decks** - Flashcard collections with metadata
- **flashcards** - Individual cards with front/back content
- **card_reviews** - Current SRS state for each card/user
- **review_events** - Historical review data for analytics
- **study_sessions** - Study time tracking
- **user_preferences** - User settings and preferences

All tables include appropriate indexes for optimal query performance.

## Usage Guide

### Creating Your First Deck

1. Click "Neues Deck" (New Deck) on the dashboard
2. Enter deck details:
    - **Title**: Name your deck
    - **Description**: Optional context
    - **Category**: Organize your decks
    - **Due Date**: Optional deadline for time-sensitive content
3. Add cards using:
    - **Single Card**: Add one card at a time
    - **Bulk Import**: Paste JSON array of cards

### JSON Format for Bulk Import

```json
[
    {
        "front": "What is the capital of France?",
        "back": "Paris",
        "isExamRelevant": true
    },
    {
        "front": "Explain the water cycle",
        "back": "1. Evaporation\n2. Condensation\n3. Precipitation\n4. Collection"
    }
]
```

### Study Workflow

1. **Choose Study Mode**:
    - Individual deck for focused learning
    - All cards for comprehensive review
    - Difficult cards for challenging content
    - Due cards for scheduled reviews

2. **Review Process**:
    - Read the question (front side)
    - Think of your answer
    - Flip the card (Space or click)
    - Rate your performance:
        - **Again (1)**: Didn't know it
        - **Hard (2)**: Struggled but got it
        - **Good (3)**: Knew it well
        - **Easy (4)**: Too easy

3. **Track Progress**:
    - Monitor daily streaks
    - Review success rates
    - Analyze best study times
    - Adjust based on statistics

## Configuration

### Theme Customization

The app uses CSS variables for theming. Colors are defined in OKLCH color space for better color manipulation:

```css
:root {
    --background: oklch(1 0 0);
    --foreground: oklch(0.145 0 0);
    /* ... more variables */
}
```

### Animation Settings

Users can customize animations through the profile settings:

- Enable/disable all animations
- Adjust animation speed (100-500ms)
- Choose animation direction (horizontal/vertical)

### Internationalization

Add new languages by:

1. Creating a new translation file in `/messages/`
2. Updating the locale type in `lib/locale.ts`
3. Adding the language option to language selectors

## Deployment

### Vercel (Recommended)

1. Push your code to GitHub
2. Import project in Vercel
3. Add environment variables
4. Deploy

### Self-Hosting

1. Build the project:

```bash
pnpm build
```

2. Set production environment variables
3. Start the server:

```bash
pnpm start
```

(Docker support is planned for future releases)

## Monitoring & Analytics

- **Vercel Analytics**: Automatic performance monitoring
- **Rate Limit Status**: Monitor API usage
- **Database Metrics**: Available through Turso dashboard

## Contributing

Contributions are welcome! Please:

1. Fork the repository
2. Create a feature branch
3. Commit your changes
4. Push to your fork
5. Submit a pull request

## Activity
![Alt](https://repobeats.axiom.co/api/embed/e26f5c728d5b30144b3d3353306a519469a999f0.svg "Repobeats analytics image")

## License

MIT License - see [LICENSE](./LICENSE) for details

## Support

- **Issues**: [GitHub Issues](https://github.com/Fx64b/learn/issues)
- **Email**: learn@fx64b.dev
- **Documentation**: Coming soon

## 🎉 Acknowledgments

- [shadcn/ui](https://ui.shadcn.com/) for the component library
- [Turso](https://turso.tech/) for the database platform
- [Resend](https://resend.com/) for email infrastructure
- The spaced repetition algorithm is based on SuperMemo-2

---

Built with ❤️ by [Fx64b](https://fx64b.dev)
