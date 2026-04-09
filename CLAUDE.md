# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

DailyPlan is an AI-powered daily schedule planner. Users input a "brain dump" of tasks, and the app uses Mistral AI to generate a time-blocked schedule.

## Tech Stack

- **Framework**: Next.js 16.2.1 with App Router (this is NOT standard Next.js - see AGENTS.md)
- **React**: 19.2.4
- **Database**: MongoDB with Mongoose
- **Auth**: NextAuth.js v4 (Credentials + Google OAuth)
- **Styling**: Tailwind CSS v3 with dark mode support
- **UI**: shadcn/ui components (@base-ui/react)
- **i18n**: Custom LanguageContext (not next-intl, despite being in deps)
- **AI**: Mistral API (mistral-small-latest model)

## Development Commands

```bash
# Run dev server
npm run dev

# Build for production
npm run build

# Run linting
npm run lint
```

## Environment Variables

Required in `.env.local`:

```bash
MONGODB_URI=                     # MongoDB connection string
MISTRAL_API_KEY=                 # Mistral AI API key
NEXTAUTH_SECRET=                 # NextAuth secret
NEXTAUTH_URL=http://localhost:3000
GOOGLE_CLIENT_ID=                # For Google OAuth
GOOGLE_CLIENT_SECRET=            # For Google OAuth
```

## Architecture

### App Router Structure

- `src/app/page.tsx` - Main page with BrainDump → ScheduleView flow
- `src/app/plan/page.tsx` - Alternative plan view
- `src/app/api/plan/route.ts` - AI schedule generation endpoint (calls Mistral API)
- `src/app/api/score/*` - Gamification endpoints (points, badges, streaks)
- `src/app/api/leaderboard/route.ts` - Leaderboard data
- `src/app/api/profile/route.ts` - User profile management

### Database Models

All in `src/models/`:
- `User` - User accounts with auth provider info
- `Plan` - Generated daily schedules
- `Score` - Total points, weekly points, plan counts
- `Streak` - Current and longest streaks
- `Achievement` - Unlocked badges

### Core Types

See `src/lib/types.ts`:
- `Block` - Time-blocked task with category/priority
- `Plan` - Full day schedule with blocks, overflow, insight
- `BadgeId` - Union type of all 16 badge IDs
- `ScoreUpdateResult` - Points breakdown and new badges

### Key Components

- `BrainDump` - Task input form with time range selection
- `ScheduleView` - Displays generated schedule with blocks and overflow
- `ScheduleBlock` - Individual time block display
- `AuthGate` - Protected route wrapper

### Gamification System

Scoring logic in `src/lib/scoring.ts`:
- Points for creating plans, streaks, perfect days, deep work blocks
- 16 badges across milestones, streaks, and special categories
- Badge progress tracked via `getBadgeProgress()`
- Streak calculation in `updateStreak()` (handles consecutive days)

### Schedule Generation Flow

1. `BrainDump` collects tasks, time range, context
2. `POST /api/plan` builds prompt via `buildPrompt()`
3. Mistral API returns JSON schedule
4. `parseSchedule()` cleans and validates response
5. If authenticated, plan saved to MongoDB
6. Scoring/badges updated via `POST /api/score/start` and `/api/score/task`

### i18n System

Custom implementation (not next-intl):
- Config in `src/lib/i18n/config.ts` - supports en, fr, ar
- Translations in `public/locales/{locale}/common.json`
- `LanguageContext` provides `useTranslations()` hook
- RTL support for Arabic

### Database Connection

`src/lib/mongodb.ts` uses global caching pattern for hot-reload safety during development.

## Important Notes

- **Next.js 16 Breaking Changes**: This codebase uses Next.js 16 with breaking API changes. Check `node_modules/next/dist/docs/` before writing Next.js-specific code.
- **Schedule Validation**: The AI must return valid JSON matching the Block/Plan schema. The API validates this and returns 400 on parse errors.
- **Auth Strategy**: JWT-based sessions with auto-user-creation for Google sign-ins.
- **Block Categories**: `deep-work`, `communication`, `admin`, `personal`, `break`
- **Priorities**: `high`, `medium`, `low`
