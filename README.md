# Flashcard Learning App

<img src="public/logo-dark.png" alt="Logo" style="width: 150px;" />

A modern flashcard application for effective learning using the Spaced Repetition System (SRS). Built with Next.js 15, TypeScript, and Turso database. Features AI-powered flashcard generation and Pro subscription plans. Available in English and German.

[![Build and Lint](https://github.com/Fx64b/learn/actions/workflows/build-lint.yml/badge.svg)](https://github.com/Fx64b/learn/actions/workflows/build-lint.yml)

> [!IMPORTANT]  
> This project is currently in **beta**. While core features are stable, some features may change based on user feedback.

## Core Features

### **Smart Learning System**

- **Spaced Repetition Algorithm**: Optimized review intervals based on SuperMemo-2
- **Progress Tracking**: Detailed statistics and learning analytics
- **Multiple Study Modes**: Focus on due cards, difficult cards, or all cards

### **AI-Powered Creation**

- **AI Flashcard Generation**: Create flashcards from text prompts or PDF documents
- **Intelligent Content Processing**: Automatically extract key concepts and definitions
- **Quality Validation**: AI-generated content is validated for educational value

### **Pro Subscription**

- **Unlimited AI Generation**: Pro users get unlimited AI flashcard creation
- **Advanced Features**: Enhanced study modes and detailed analytics
- **Secure Billing**: Powered by Stripe with automatic payment recovery

### **Essential Tools**

- **Deck Management**: Organize flashcards into themed collections
- **Export Functionality**: Export decks for backup or sharing
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

### Creating Flashcards

**Manual Creation:**

1. Create a new deck or select existing one
2. Add flashcards with front/back content
3. Start studying immediately

**AI Generation (Pro Feature):**

1. Navigate to any deck
2. Click the "AI" Tab
3. Enter a topic and optionally upload a PDF document
4. Let AI create optimized flashcards for you

### Study Sessions

1. Select a study mode (Due, Difficult, or All cards)
2. Review each flashcard and rate your confidence
3. The algorithm adjusts future review intervals automatically
4. Track your progress in the statistics dashboard

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
