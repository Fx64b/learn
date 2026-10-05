# Flashcard Learning App

<img src="public/logo-dark.png" alt="Logo" style="width: 150px;" />

A learning app that mixes the Duolingo and Quizlet styles: varied, bite-sized exercises on top of a spaced repetition system (SRS), with light gamification. Built with Next.js 15, TypeScript, and Turso database. Features AI-powered item generation and Pro subscription plans. Available in English and German.

[![Build and Lint](https://github.com/Fx64b/learn/actions/workflows/build-lint.yml/badge.svg)](https://github.com/Fx64b/learn/actions/workflows/build-lint.yml)

## Core Features

### **Rich Item Types**

A deck holds items of nine types. The app turns each item into fitting exercises:

| Item              | Exercises                                                                   |
| ----------------- | --------------------------------------------------------------------------- |
| Question & answer | Multiple choice, match pairs, type the answer, self-graded flashcard        |
| Multiple choice   | Single or "select all" choice                                               |
| Cloze             | Fill the blanks from a word bank, then type the missing word                |
| Passage           | Build the sentence from tiles, then type the first letter of each word      |
| List              | Name every member of a set in any order                                     |
| Sequence          | Put steps or events in order                                                |
| Number            | Multiple choice, then type the number with tolerance and higher/lower hints |
| Pairs             | Match terms and their counterparts                                          |
| Diagram           | Label markers on an uploaded image, then tap the right spot                 |

### **Adaptive Learning**

- **Spaced Repetition**: SuperMemo-2 schedules every item, and each exercise maps to an SM-2 grade
- **Mastery Stages**: Items move from New to Learning, Familiar and Mastered. Exercises get harder with each stage (recognition first, then recall)
- **Mistakes Come Back**: A missed exercise returns later in the same session
- **Four Modes per Deck**: Learn (adaptive), Flashcards (classic flip cards), Match (timed game with personal best) and Practice test (no effect on the schedule)

### **Light Gamification**

- **XP and Daily Goal**: Earn XP per exercise with combo bonuses and pick a daily goal
- **Streaks**: Timezone-aware day streak with one streak freeze
- **Achievements**: 13 badges for milestones
- **Progress**: Mastery bars, activity heatmap and an end-of-session summary

### **AI-Powered Creation**

- **AI Item Generation**: Create items of mixed types from text prompts or PDF documents
- **Intelligent Content Processing**: Automatically extract key concepts and definitions
- **Quality Validation**: AI-generated content is validated for educational value

### **Pro Subscription**

- **Unlimited AI Generation**: Pro users get unlimited AI flashcard creation
- **Advanced Features**: Enhanced study modes and detailed analytics
- **Secure Billing**: Powered by Stripe with automatic payment recovery

### **Essential Tools**

- **Deck Management**: Organize flashcards into themed collections
- **Import and Export**: JSON import and export of all item types (classic `{ front, back }` cards still work)
- **Multi-language Support**: Available in English and German
- **Responsive Design**: Works seamlessly on desktop and mobile

## Getting Started

### Prerequisites

- Node.js 18+ and pnpm
- [Turso](https://turso.tech/) database
- [Resend](https://resend.com/) for emails
- [Google AI](https://aistudio.google.com/) API key (for AI features)
- [Stripe](https://stripe.com/) account (for subscriptions)

### Environment Setup

Create `.env.local` from `.env.local.example`:

```bash
# Core Configuration
NEXT_PUBLIC_SITE_URL="http://localhost:3000"
NEXTAUTH_URL="http://localhost:3000"
NEXTAUTH_SECRET="your-secret-key"

# Database
DATABASE_URL="your-turso-url"
DATABASE_AUTH_TOKEN="your-turso-token"

# Email Service
RESEND_API_KEY="your-resend-key"
EMAIL_FROM="learn@yourdomain.com"

# AI Features (Optional)
GOOGLE_GENERATIVE_AI_API_KEY="your-google-ai-key"

# Stripe Subscriptions (Optional)
STRIPE_SECRET_KEY="your-stripe-secret-key"
NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY="your-stripe-publishable-key"
STRIPE_WEBHOOK_SECRET="your-webhook-secret"

# Rate Limiting (Optional)
REDIS_URL="your-redis-url"

# Image uploads for diagram items (Optional, Vercel Blob)
BLOB_READ_WRITE_TOKEN="your-blob-token"
```

### Installation

1. Clone and install dependencies:

```bash
git clone https://github.com/Fx64b/learn.git
cd learn
pnpm install
```

2. Set up the database:

```bash
pnpm db:migrate
```

3. Start development server:

```bash
pnpm dev
```

Visit `http://localhost:3000` to start learning!

## Technology Stack

- **Framework**: Next.js 15 with App Router
- **Language**: TypeScript with strict type checking
- **Database**: Turso (LibSQL) with Drizzle ORM
- **Authentication**: NextAuth.js
- **UI Components**: shadcn/ui with Tailwind CSS
- **AI Integration**: Google AI (Gemini)
- **Payments**: Stripe
- **Email**: Resend
- **Deployment**: Vercel

## Usage

### Creating Items

**Manual Creation:**

1. Create a new deck or select an existing one
2. Pick an item type and fill in its form. Use the preview to see the exercise
3. Start learning immediately

**AI Generation (Pro Feature):**

1. Open a deck and click the "AI" tab
2. Enter a topic and optionally upload a PDF document
3. Choose the item types the AI may use
4. The AI picks the best fitting type for each piece of knowledge

### Learning

1. Open a deck and choose Learn, Flashcards, Match or Practice test, or use "Continue learning" on the dashboard for all due items
2. Answer the exercises. Missed ones come back later in the session
3. The SRS adjusts future review intervals automatically
4. Track XP, streak, mastery and achievements on the dashboard and in your profile

### Subscription Management

- **Free Plan**: Basic flashcard functionality
- **Pro Plan**: Unlimited AI generation, priority support
- **Billing**: Secure payment processing with automatic recovery

## Deployment

### Vercel (Recommended)

[![Deploy with Vercel](https://vercel.com/button)](https://vercel.com/new/clone?repository-url=https://github.com/Fx64b/learn)

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

![Alt](https://repobeats.axiom.co/api/embed/e26f5c728d5b30144b3d3353306a519469a999f0.svg 'Repobeats analytics image')

## License

MIT License - see [LICENSE](./LICENSE) for details

## Support

- **Issues**: [GitHub Issues](https://github.com/Fx64b/learn/issues)
- **Email**: learn@fx64b.dev
- **Documentation**: Coming soon
- **Technical Documentation**: [fx64b.dev/projects/flashcard-app](https://fx64b.dev/projects/flashcard-app)

## 🎉 Acknowledgments

- [shadcn/ui](https://ui.shadcn.com/) for the component library
- [Turso](https://turso.tech/) for the database platform
- [Resend](https://resend.com/) for email infrastructure
- [Google AI](https://aistudio.google.com/) for AI-powered features
- [Stripe](https://stripe.com/) for secure payment processing
- The spaced repetition algorithm is based on SuperMemo-2

---

Built with ❤️ by [Fx64b](https://fx64b.dev)
