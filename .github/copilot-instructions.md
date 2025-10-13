This is a nextjs based repository for a flashcard learning app with spaced repetition and ai features.

## Setup

- Before starting with the implementation install pnpm and use it to install the dependencies
- Copy the .env.local.example file using `cp .env.local.example .env.local`

## Code Standards

### Required Before Each Commit

- run `pnpm format && pnpm lint` to lint and format the code
- Test `pnpm test`

### Development Flow

- Build: `pnpm build`
- Dev server: `pnpm dev`

## Information regarding specific folders

- `components/ui` contains shadcn/ui components
    - Don't make any manual changes to this folder
    - Instead, use the `pnpm dlx shadcn@latest add <component>` command to add new shadcn components that don't exist yet
    - In general, it is encouraged to use shadcn components instead of creating custom ones
