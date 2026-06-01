# DailyPlan Remake v1.0.0 - Roadmap

This roadmap outlines the plan to transform the current DailyPlan project into the version 1.0.0 state defined in the `DailyPlan_Blueprint.md`.

## Git Branching Strategy
All work will be conducted in the `remake` parent branch, with feature-specific sub-branches.

- **Main Parent:** `remake`
- **Feature Branches:**
  - `remake/db-schema`
  - `remake/auth`
  - `remake/i18n`
  - `remake/design-system`
  - `remake/plan-page`
  - `remake/conflict-logic`
  - `remake/ai-integration`
  - `remake/history-page`
  - `remake/progress-page`
  - `remake/badges-system`
  - `remake/leaderboard`
  - `remake/settings-page`
  - `remake/guest-mode`

---

## Sprints & Tasks

### Sprint 1: Foundation (Infrastructure & Data)
**Goal:** Establish the core data structures and internationalization framework.

- [x] **Task 1.1: Database Schema Migration (`remake/db-schema`)**
  - Update `User` model (points, streaks, badges, locale, theme).
  - Update `Plan` model (braindump, planDate, window, contextTags, tasks sub-doc).
  - Create `Badge` and `XPLog` collections.
- [x] **Task 1.2: NextAuth v5 Upgrade (`remake/auth`)**
  - Implement Google OAuth 2.0 and Email/Password provider.
  - Setup password reset flow with Resend.
  - Implement route protection rules.
- [x] **Task 1.3: Advanced i18n Setup (`remake/i18n`)**
  - Implement `app/[locale]/` directory structure.
  - Configure `next-intl` middleware and translation files (`en`, `fr`, `ar`).
  - Implement RTL layout support for Arabic.

### Sprint 2: Core UX & Logic (The Planning Engine)
**Goal:** Deliver the AI-powered planning experience with conflict resolution.

- [x] **Task 2.1: Design System & Theme (`remake/design-system`)**
  - Setup Tailwind CSS variables for light/dark/system themes.
  - Integrate `Geist` and `Noto Kufi Arabic` fonts.
  - Refine shadcn/ui components for consistency.
- [x] **Task 2.2: Plan Page & Visual Timeline (`remake/plan-page`)**
  - Build the Braindump textarea and Date/Time pickers.
  - Implement the "Schedule Overview" 24-hr timeline.
- [x] **Task 2.3: Conflict Detection Logic (`remake/conflict-logic`)**
  - Implement server-side and client-side overlap detection.
  - Build the conflict resolution UI (Adjust Window, Replace, Merge).
- [x] **Task 2.4: Groq AI Integration (`remake/ai-integration`)**
  - Setup Groq SDK with LLaMA-3.1-70b-versatile.
  - Implement the "Expert Productivity Coach" prompt and Zod validation.
  - Add prompt caching and rate limiting.

### Sprint 3: Engagement & Gamification
**Goal:** Implement the reward system and social features.

- [ ] **Task 3.1: Badges & Points Pipeline (`remake/badges-system`)**
  - Implement the 40-badge catalogue and check pipeline.
  - Setup XP calculation for tasks and plan completion.
  - Create "Toast Celebration" for new badges.
- [ ] **Task 3.2: Leaderboard System (`remake/leaderboard`)**
  - Create the ranking API with All-Time/Monthly/Weekly filters.
  - Build the Podium UI and Rankings Table with infinite scroll.
- [ ] **Task 3.3: Progress Analytics (`remake/progress-page`)**
  - Build the KPI tiles and Recharts charts (Calendar Heatmap, Trend, Pie chart).

### Sprint 4: Secondary Pages & Polish
**Goal:** Complete the user journey and finalize the application.

- [ ] **Task 4.1: History & Plan Management (`remake/history-page`)**
  - Implement cursor-based pagination for history.
  - Create the plan detail drawer and "Recreate Plan" CTA.
- [ ] **Task 4.2: Settings & Profile (`remake/settings-page`)**
  - Build the account management forms (avatar, display name).
  - Implement preference toggles (theme, language, default times).
- [ ] **Task 4.3: Guest Mode & Migration (`remake/guest-mode`)**
  - Implement guest restrictions (7-plan limit, 3 AI calls/day).
  - Build the guest-to-user plan migration logic.

---

## Validation & Quality Assurance
- [ ] Unit testing for core logic (XP, conflicts) with Vitest.
- [ ] E2E testing for the critical "Brain-to-Plan" journey with Playwright.
- [ ] Visual regression testing for RTL and Dark Mode.
- [ ] Accessibility (a11y) audit for all interactive components.
