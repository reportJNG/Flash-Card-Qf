w# FlashQF

FlashQF is a small flashcard study app built with Next.js, TypeScript, Supabase, and Tailwind CSS. It lets users create profiles, organize questions into categories, import question sets, play study sessions, and review progress through stats and leaderboards.

## Tech Stack

- Next.js 14 App Router
- TypeScript
- Supabase PostgreSQL
- Tailwind CSS
- shadcn/ui-style components
- Framer Motion
- Zustand

## Getting Started

Install dependencies:

```bash
npm install
```

Create a `.env.local` file in the project root:

```env
NEXT_PUBLIC_SUPABASE_URL=your_supabase_project_url
NEXT_PUBLIC_SUPABASE_ANON_KEY=your_supabase_anon_key
SUPABASE_SERVICE_ROLE_KEY=your_supabase_service_role_key
SESSION_SECRET=your_long_random_session_secret
```

Set up the database by running the SQL in:

```text
Database/db.sql
```

Then start the development server:

```bash
npm run dev
```

Open `http://localhost:3000` in your browser.

## Available Scripts

```bash
npm run dev      # Start the development server
npm run build    # Build for production
npm run start    # Start the production server
npm run lint     # Run Next.js linting
```

## Project Structure

```text
src/app              Next.js routes and pages
src/components       Shared UI, auth, navigation, category, and question components
src/lib              Supabase clients, actions, parsers, validation, and utilities
src/store            Client-side session state
Database/db.sql      Supabase database schema
```

## Main Features

- Profile-based login with optional PIN protection
- Category management for flashcard organization
- Question import and parsing support
- Play sessions with difficulty tracking
- Stats, planning, and leaderboard pages

