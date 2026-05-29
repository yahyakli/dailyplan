## **DailyPlan** 

Complete Project Blueprint 

Full-Stack Next.js · MongoDB · Groq AI · i18n (AR / FR / EN) · Auth + OAuth 

|Version|1.0.0 – Remake Branch|
|---|---|
|Date|May 28, 2026|
|Stack|Next.js 14 App Router · Tailwind CSS · shadcn/ui · MongoDB · Groq|
|Auth|Google OAuth 2.0 + Email/Password (NextAuth.js)|
|i18n|English · French · Arabic (RTL support)|
|Theme|Light / Dark / System|



Confidential · Internal Engineering Reference · DailyPlan © 2025 

DailyPlan Blueprint  ·  Page 1 

**TOC Table of Contents** 

Navigation 

|**1**|Project Overview & Goals|**3**|
|---|---|---|
|**2**|Tech Stack & Architecture|**4**|
|**3**|Database Schema (MongoDB)|**5**|
|**4**|Authentication & Authorization|**7**|
|**5**|i18n – Internationalization|**8**|
|**6**|Page Blueprints & UI Logic|**9**|
|**7**|Core Business Logic & Conflict Rules|**13**|
|**8**|AI Integration (Groq)|**15**|
|**9**|Badges & Points System (Redesigned)|**16**|
|**10**|Leaderboard System|**18**|
|**11**|API Routes Reference|**19**|
|**12**|Git Branch Strategy|**21**|
|**13**|Theme & Design System|**22**|
|**14**|Guest Mode & Restrictions|**23**|
|**15**|Notifications & Alerts|**24**|
|**16**|Environment Variables|**24**|
|**17**|Testing Strategy|**25**|
|**18**|Future Roadmap|**25**|



DailyPlan Blueprint  ·  Page 2 

**01 Project Overview & Goals** 

What DailyPlan is 

## **Purpose** 

DailyPlan is a smart, AI-powered daily planner that transforms loose ideas into structured, time-blocked schedules. Users brainstorm freely, set a day and time window, declare an energy/context state, and let Groq AI generate a conflict-free, optimised plan. The app tracks completion, rewards consistency through a gamified badge and points system, and surfaces a global Leaderboard to fuel healthy competition. 

## **Core User Journey** 

|**Core User Journey**||
|---|---|
|1. Brainstorm|User dumps tasks / ideas into a free-text area — no structure needed yet.|
|2. Set Window|User picks the target date + start time + end time for the planning block.|
|3. Set Context|User selects one or more context tags (Low Energy, Deep Work, Meetings, etc.).|
|4. Generate|Groq AI analyses the dump, context, and available time, then returns a structured task<br>list with per-task durations, priorities, and tips.|
|5. Review & Edit|User can re-order, delete, or adjust AI-suggested tasks before saving the plan.|
|6. Execute|During the day the user marks tasks In Progress / Done. The app awards XP, checks<br>badge conditions, updates streaks.|
|7. Reflect|History + Progress pages show analytics: completion rate, streaks, category heatmaps.|



## **Key Differentiators** 

- **Conflict detection** — the app prevents and resolves overlapping time slots across multiple plans on the same 

- day. 

- **Context-aware AI** — Groq tailors task order and duration to declared energy level and meeting load. 

- **Full i18n** — all static strings in English, French, and Arabic (with RTL layout flip). 

- **Progressive access** — guest users get a taste (7-plan history); authenticated users unlock everything. 

- **Gamification v2** — redesigned badge + point economy rewarding planning quality, not just quantity. 

DailyPlan Blueprint  ·  Page 3 

**Tech Stack & Architecture** 

**02** 

Next.js App Router 

|**Layer**|**Technology**|**Notes**|
|---|---|---|
|Frontend|Next.js 14 (App Router)|Server + Client components, RSC streaming|
|Styling|Tailwind CSS 3 + shadcn/ui|Design tokens, dark/light/system themes|
|Icons|lucide-react|Consistent icon set across all pages|
|Charts|Recharts|Progress, heatmap, completion trend charts|
|State|Zustand / React Context|Client state; server state via SWR / fetch|
|Auth|NextAuth.js v5|Google OAuth provider + Credentials provider|
|Database|MongoDB Atlas|Mongoose ODM; Atlas Search for future search|
|AI|Groq SDK (groq-sdk)|LLaMA-3 / Mixtral via Groq Cloud API|
|i18n|next-intl|Static messages in /messages/{en,fr,ar}.json|
|API|Next.js Route Handlers|REST-style /api/* routes; Zod validation|
|Email|Resend + react-email|Password reset, welcome email|
|Deploy|Vercel|Edge functions for i18n middleware|



## **Folder Structure (Next.js App Router)** 

`dailyplan/` III `app/` I III `[locale]/` ← `i18n root (en | fr | ar)` I I III `(auth)/` ← `Login, Register, Reset pages` I I III `plan/` ← `Plan page` I I III `history/` ← `History page` I I III `progress/` ← `Progress page` I I III `badges/` ← `Badges page` I I III `leaderboard/` ← `Leaderboard page` I I III `settings/` ← `Settings page` I III `api/` I III `auth/[...nextauth]/` ← `NextAuth handler` I III `plans/` ← `CRUD plans` I III `ai/generate/` ← `Groq plan generation` I III `badges/` ← `Badge checks` I III `leaderboard/` ← `Ranking endpoint` I III `users/` ← `Account management` III `components/` I III `ui/` ← `shadcn primitives` I III `layout/` ← `Header, Footer, Sidebar` I III `plan/` ← `PlanForm, ScheduleOverview, TaskCard` I III `badges/` ← `BadgeCard, BadgeGrid` 

DailyPlan Blueprint  ·  Page 4 

I III `charts/` ← `StreakChart, HeatmapChart` I III `shared/` ← `LanguageSwitcher, ThemeToggle` III `lib/` I III `db.ts` ← `MongoDB connection` I III `groq.ts` ← `Groq client wrapper` I III `auth.ts` ← `NextAuth config` I III `points.ts` ← `XP / badge calculation` I III `validators.ts` ← `Zod schemas` III `messages/` I III `en.json` I III `fr.json` I III `ar.json` III `models/` 

III `User.ts` III `Plan.ts` III `Task.ts` III `Badge.ts` 

DailyPlan Blueprint  ·  Page 5 

**03 Database Schema (MongoDB)** 

Mongoose Models 

## **3.1  User Model** 

|**Field**|**Type**|**Notes**|
|---|---|---|
|_id|ObjectId|Primary key|
|name|String|Display name, required|
|email|String|Unique, lowercase, indexed|
|password|String?|bcrypt hash; null for OAuth users|
|provider|enum|'credentials' | 'google'|
|googleId|String?|Google sub; null for credentials|
|avatar|String?|URL – Google photo or uploaded|
|locale|enum|'en' | 'fr' | 'ar' (default 'en')|
|theme|enum|'light' | 'dark' | 'system'|
|points|Number|Total XP — used for Leaderboard rank|
|streakCurrent|Number|Consecutive planning days|
|streakMax|Number|All-time best streak|
|lastActiveDate|Date?|Date of last plan created/updated|
|badges|[BadgeRef]|Array of { badgeId, earnedAt }|
|role|enum|'user' | 'admin' (default 'user')|
|isDeleted|Boolean|Soft delete flag|
|createdAt|Date|Auto timestamp|
|updatedAt|Date|Auto timestamp|



## **3.2  Plan Model** 

|**Field**|**Type**|**Notes**|
|---|---|---|
|_id|ObjectId|Primary key|
|userId|ObjectId | null|Ref User; null = guest session plan|
|guestSessionId|String?|UUID stored in cookie for guest plans|
|title|String|Auto-generated or user-edited (max 80 chars)|
|braindump|String|Raw user input text|



DailyPlan Blueprint  ·  Page 6 

|planDate|Date|The target calendar date (date only, no time)|
|---|---|---|
|startTime|String|HH:MM (24-hour)|
|endTime|String|HH:MM (24-hour)|
|contextTags|[String]|['low_energy','deep_work','meetings',…]|
|tasks|[Task]|Embedded task sub-documents (see 3.3)|
|status|enum|'draft' | 'active' | 'completed' | 'missed'|
|aiModel|String|Groq model used for generation|
|aiPromptHash|String|SHA-256 of prompt — dedup check|
|totalXPEarned|Number|XP awarded when plan completed|
|completionRate|Number|0–100 % — computed on save|
|isGuestPlan|Boolean|True if created without auth|
|createdAt|Date||
|updatedAt|Date||



## **3.3  Task Sub-Document (embedded in Plan)** 

|**Field**|**Type**|**Notes**|
|---|---|---|
|_id|ObjectId|Local ID within plan|
|title|String|Task name (AI generated or user edited)|
|description|String?|Optional detail / AI tip|
|startTime|String|HH:MM — must be within plan window|
|endTime|String|HH:MM — must be after startTime|
|durationMin|Number|Computed: (endTime - startTime) in minutes|
|priority|enum|'low' | 'medium' | 'high' | 'critical'|
|category|String?|e.g. 'health','work','personal'|
|status|enum|'todo' | 'in_progress' | 'done' | 'skipped'|
|xpValue|Number|XP for completing this task (AI-assigned)|
|order|Number|Display order — user can drag-reorder|



## **3.4  Badge Model (Collection)** 

|**Field**|**Type**|**Notes**|
|---|---|---|
|_id|String|Slug: 'early_bird', 'perfect_week', …|



DailyPlan Blueprint  ·  Page 7 

|name|Object|{ en, fr, ar } — translated name|
|---|---|---|
|description|Object|{ en, fr, ar }|
|icon|String|Emoji or SVG path slug|
|tier|enum|'bronze' | 'silver' | 'gold' | 'platinum'|
|category|enum|'streak' | 'completion' | 'planning' | 'social' | 'special'|
|condition|Object|Serialised rule (see §9)|
|xpReward|Number|XP granted on first earn|
|isSecret|Boolean|Hidden until earned|
|totalEarned|Number|Denormalised counter — Leaderboard display|



DailyPlan Blueprint  ·  Page 8 

**04 Authentication & Authorization** 

NextAuth.js v5 

## **Providers** 

|**Provider**|**Fields**|**Behaviour**|
|---|---|---|
|Google OAuth|googleId, name, email, avatar|Upsert user on first sign-in; no password<br>stored|
|Credentials|email + password|bcrypt.compare; return user object or null|
|Guest / None|guestSessionId (cookie, 7-day TTL)|Limited to 7 plans in MongoDB; no personal<br>data|



## **Password Reset Flow** 

|1|User submits email on /forgot-password|
|---|---|
|2|Server generates a signed JWT (exp 15 min), stores hash in User.resetToken|
|3|Resend sends an email with a link: /reset-password?token=|
|4|User submits new password; server verifies JWT, bcrypt-hashes, clears resetToken|
|5|Redirect to /login with success toast|



|1|User submits email on /forgot-password|
|---|---|
|2|Server generates a signed JWT (exp 15 min), stores hash in User.resetToken|
|3|Resend sends an email with a link: /reset-password?token=|
|4|User submits new password; server verifies JWT, bcrypt-hashes, clears resetToken|
|5|Redirect to /login with success toast|



## **Route Protection Rules** 

|**Route Pattern**|**Guest**|**Auth User**|**Admin**|
|---|---|---|---|
|/plan|(read only gen)|full||
|/history|last 7 only|all||
|/progress|redirect /login|||
|/badges|redirect /login|||
|/leaderboard|view only|||
|/settings|redirect /login|||
|/admin/*||||



DailyPlan Blueprint  ·  Page 9 

**05 i18n – Internationalisation** 

next-intl · AR · FR · EN 

## **Setup Overview** 

All UI text lives in /messages/{en,fr,ar}.json. The Next.js middleware detects the preferred locale from (1) URL prefix, (2) user.locale from DB, (3) Accept-Language header, then redirects to the appropriate /[locale]/* route. Arabic enables RTL layout globally via dir='rtl' on and Tailwind's rtl: variant. 

## **Key Considerations** 

|RTL Flip|All flexbox rows must use start/end instead of left/right. Use Tailwind rtl:flex-row-reverse<br>where needed. shadcn/ui components already support dir.|
|---|---|
|Date Formats|Use Intl.DateTimeFormat with locale for all date strings. Never hard-code month names.|
|Plurals|next-intl supports ICU plural syntax: {count, plural, one {# task} other {# tasks}}|
|Numbers|Intl.NumberFormat for XP, percentages. Arabic uses Eastern Arabic numerals<br>optionally.|
|Font|Geist Sans (Latin/Latin-Ext) + Noto Kufi Arabic loaded via next/font for Arabic locale.|
|Locale Switch|Header LanguageSwitcher calls PATCH /api/users/locale then router.refresh().<br>Persisted in DB for auth users, in cookie for guests.|



## **Message Key Convention** 

```
en.json (excerpt):
{
  "plan": {
    "headline": "What's on your plate today?",
    "braindump_placeholder": "Dump everything on your mind...",
    "context_low_energy": "Low Energy",
    "context_deep_work": "Deep Work",
    "btn_generate": "Plan My Day"
  },
  "nav": { "plan": "Plan", "history": "History", ... }
}
```

DailyPlan Blueprint  ·  Page 10 

**06 Page Blueprints & UI Logic** 

All 8 pages detailed 

## **6.0  Global Header** 

**Left:** DailyPlan logo + brand name (links to /plan). 

**Centre Nav:** Plan · History · Settings (tabs; active state highlighted). 

**Right — Guest:** Language switcher (EN / FR / AR chip) + Sign Up button (CTA). 

**Right — Auth:** Language switcher + avatar + user name inside a Tag/Badge component (clicking opens a dropdown: Progress, Badges, Leaderboard, Settings, Sign Out). 

**Mobile:** Hamburger menu collapses nav; bottom nav bar shows Plan, History, Progress icons. 

## **6.1  Plan Page  (/plan)** 

|**Element**|**Details**|
|---|---|
|Hero Headline|Localised: "What's on your plate today?" — h1, large, centered.|
|Braindump Textarea|Auto-resize textarea, placeholder localised. Min 3 chars validation. Debounced<br>auto-save draft to localStorage.|
|Date Picker|Defaults to today. User cannot select past dates. Calendar uses locale-aware<br>week start (Mon for FR/AR, Sun for EN).|
|Start Time|Time input HH:MM. Default 08:00. Must be before End Time.|
|End Time|Time input HH:MM. Default 17:00. Validated against Start Time.|
|Context Tags|Multi-select chips: Low Energy · High Energy · Deep Work · Meetings · Creative ·<br>Exercise · Admin. At least 1 required.|
|Schedule Overview|Visual 24-hr timeline strip showing ALL existing plans for the selected date.<br>Existing blocks shown in colour; selected window highlighted. Clicking an existing<br>block opens its detail drawer.|
|Conflict Indicator|If the selected window overlaps an existing plan: yellow warning banner with<br>options (see §7).|
|Plan My Day Button|Disabled until: braindump≥3 chars + date + valid times +≥1 context. Shows<br>spinner during AI call.|
|AI Result Panel|Slides in from right (sheet). Shows generated task cards with time, priority chip,<br>drag handles, XP value. Edit / Delete per task. Confirm & Save button.|
|Guest Nudge|Floating banner at bottom: 'Sign up to save more than 7 plans and unlock badges.'|



## **6.2  History Page  (/history)** 

DailyPlan Blueprint  ·  Page 11 

|Filter Bar|Date range picker + status filter (All / Active / Completed / Missed) + search by title.|
|---|---|
|Plan Cards Grid|Card per plan: date badge, title, status chip, completion % ring, task count. Click<br>opens detail drawer.|
|Detail Drawer|Full task list, braindump text, context tags, XP earned, AI model used. 'Recreate Plan'<br>CTA pre-fills the Plan page.|
|Guest Limit|After 7 cards a blurred overlay shows with 'Create a free account to see full history'.|
|Empty State|Illustration + 'No plans yet. Start planning your day!' + CTA to /plan.|
|Pagination|Cursor-based pagination, 10 plans per page.|



## **6.3  Progress Page  (/progress)  [Auth only]** 

|Stats Bar|4 KPI tiles: Total Plans · Completion Rate · Current Streak · Total XP.|
|---|---|
|Streak Chart|Recharts CalendarHeatmap — last 365 days. Cell colour intensity = completion %.|
|Completion Trend|LineChart — last 30 days completion rate trend.|
|Category Breakdown|PieChart — task categories (work, health, personal, etc.).|
|Best Day|Highlight card: highest completion day with date and tasks done.|
|XP Timeline|BarChart — XP earned per week for last 12 weeks.|



## **6.4  Badges Page  (/badges)  [Auth only]** 

|Category Tabs|All · Streak · Completion · Planning · Social · Special.|
|---|---|
|Badge Grid|4-col grid on desktop. Each cell: icon, tier ring (bronze/silver/gold/platinum), localised<br>name, progress bar if in progress.|
|Earned State|Full colour + earned date tooltip.|
|Locked State|Greyscale + lock icon. Secret badges show '???' for name/desc until earned.|
|Badge Detail Modal|Click any badge: full description, condition, XP reward, how many users earned it<br>(social proof).|



## **6.5  Leaderboard Page  (/leaderboard)** 

|Period Tabs|All Time · This Month · This Week.|
|---|---|
|Top-3 Podium|Visual podium (2nd, 1st, 3rd) with avatar, name, XP, top badge.|
|Rankings Table|Rank · Avatar · Name · XP · Top Badge · Streak. 50 rows, infinite scroll.|



DailyPlan Blueprint  ·  Page 12 

|My Position|Sticky card at bottom for auth users showing their rank, even if outside top 50.|
|---|---|
|Guest View|Full table visible. 'Sign up to compete' banner.|



## **6.6  Settings Page  (/settings)  [Auth only]** 

|Account Section|Avatar upload (Cloudinary/R2), change display name (max 30 chars).|
|---|---|
|Security Section|Change password form (current + new + confirm). Disabled for Google OAuth users<br>with tooltip explanation.|
|Preferences Section|Theme (Light/Dark/System toggle), Language (EN/FR/AR select), Default Start/End<br>times, Default context tags.|
|Danger Zone|Delete Account — two-step confirmation (type email to confirm). Soft-deletes user;<br>anonymises their Leaderboard entry.|
|Connected Accounts|Shows if Google is linked. Button to link/unlink Google.|



DailyPlan Blueprint  ·  Page 13 

**07 Core Business Logic & Conflict Rules** 

The most critical section 

## **7.1 Time Conflict Detection** 

When a user selects a date + start/end time window, the server (and client) checks all existing plans for that user on that date. 

|**Scenario**|**Condition**|**UI Response**|
|---|---|---|
|No overlap|New window does not intersect any<br>existing plan|Green 'Window is free' indicator|
|Partial overlap — head|New start < existing end AND new start<br>> existing start|Yellow warning: shows conflicting plan<br>name + options|
|Partial overlap — tail|New end > existing start AND new end<br>< existing end|Yellow warning: same options|
|Full containment (new<br>inside)|New start >= existing start AND new<br>end <= existing end|Red error: 'This window is fully<br>occupied'|
|Full containment (new<br>wraps)|New start <= existing start AND new<br>end >= existing end|Red error: 'This window contains an<br>existing plan'|
|Same window exact|New start == existing start AND new<br>end == existing end|Red error: 'Exact duplicate window'|



## **Conflict Resolution Options (presented to user)** 

- **Adjust Window** — modal lets user pick a non-conflicting adjacent window (auto-suggested: earliest gap after last 

- existing plan). 

- **Replace Plan** — delete the conflicting existing plan and proceed with the new one (requires confirmation). 

- **Add to Existing Plan** — merge the braindump text into the existing plan and re-generate (only available for 

- partial overlaps). 

- **Cancel** — return to form with time fields highlighted in red. 

## **7.2 Multiple Plans on the Same Day** 

Multiple plans on the same day are **allowed** as long as their time windows do not overlap. The Schedule Overview timeline on the Plan page visualises all plans for the selected date so users can see free slots at a glance. The total coverage for a day cannot exceed 24 hours (server-side guard). 

## **7.3 Plan Status State Machine** 

|**Status**|**Trigger**|**Side Effects**|
|---|---|---|
|draft|Plan saved before 'Confirm & Save' is<br>clicked|No XP, not counted in streaks|



DailyPlan Blueprint  ·  Page 14 

|active|User confirms & saves the plan|Streak counter starts, plan appears on Today<br>widget|
|---|---|---|
|completed|All tasks marked done OR completionRate<br>≥90%|XP awarded, badge check triggered, streak<br>incremented|
|missed|Cron job at 23:59 if status still active|No XP; streak broken; badge check for<br>recovery badges|



## **7.4 Streak Rules** 

- A streak day is counted when at least **one plan reaches 'completed' status** on that calendar day (UTC). 

- Streak increments at midnight UTC via a serverless cron route GET /api/cron/check-streaks. 

- If the user has no completed plan on a given day, streak resets to 0 (not decremented — immediate reset). 

- A **Grace Period Badge** exists: if a user misses a day but had a streak ≥ 7 they get a one-time 24-hour grace (streak paused, not broken). Only usable once per 30 days. 

- streakCurrent and streakMax are stored on the User model and updated atomically with findOneAndUpdate. 

## **7.5 XP Calculation** 

|**Action**|**XP**|**Conditions**|
|---|---|---|
|Complete a task (low priority)|+5 XP|Status→done|
|Complete a task (medium)|+10 XP||
|Complete a task (high)|+20 XP||
|Complete a task (critical)|+35 XP||
|Plan completion≥90%|+50 XP bonus|On plan status→completed|
|Perfect plan (100%)|+100 XP<br>bonus|All tasks done|
|Plan created (any)|+5 XP|On plan save (draft→active)|
|Streak day +7|+25 XP/day|While streak≥7|
|Streak day +30|+75 XP/day|While streak≥30|
|Badge earned|+xpReward|Per badge definition|



DailyPlan Blueprint  ·  Page 15 

**08 AI Integration (Groq)** 

Plan generation pipeline 

## **Model** 

Primary: **llama-3.1-70b-versatile** via Groq Cloud. Fallback: **mixtral-8x7b-32768** if primary rate-limited. Model string stored on each Plan for auditability. 

## **Prompt Architecture** 

```
SYSTEM:
```

```
You are DailyPlan AI, an expert productivity coach.
Your job: transform a user's braindump into a structured, time-blocked task list.
Rules:
```

- `Tasks must fit exactly within {startTime} – {endTime}.` 

- `Total task durations must not exceed the window.` 

- `Respect the context: {contextTags}.` 

- `Low Energy` → `shorter tasks, more breaks.` 

- `Deep Work` → `90-min focus blocks, minimal context switching.` 

- `Meetings` → `buffer 15 min before/after each meeting slot.` 

- `Respond ONLY in valid JSON matching the TaskList schema.` 

- `Locale: {locale} — use this language for task titles and descriptions.` 

```
USER:
Date: {planDate}  Window: {startTime} - {endTime}
Context: {contextTags}
Braindump:
{braindump}
```

## **Expected JSON Response Schema** 

```
{
  "tasks": [
    {
      "title": "string",
      "description": "string (optional)",
      "startTime": "HH:MM",
      "endTime": "HH:MM",
      "priority": "low|medium|high|critical",
      "category": "work|health|personal|learning|admin|creative",
      "xpValue": number
    }
  ],
  "planTitle": "string",
  "aiTip": "string (motivational tip for this plan)"
}
```

## **Validation & Safety** 

- Zod validates the returned JSON. If invalid, retry once with a stricter prompt. 

- Total task minutes checked: must be ≤ window minutes. If over, last tasks are trimmed. 

- Task startTime/endTime must be within plan window (server guard). 

- Prompt hash (SHA-256) stored — if same braindump + same date + same window submitted within 5 min, return cached result instead of calling Groq. 

DailyPlan Blueprint  ·  Page 16 

- Rate limiting: 10 AI generations per user per day (Redis counter or MongoDB TTL doc). 

- Guest users: 3 AI generations per day per IP/session. 

DailyPlan Blueprint  ·  Page 17 

**09 Badges & Points System (Redesigned)** 

Original system replaced 

## **Design Philosophy** 

The old badge system was stripped and replaced with a **three-axis reward model** : (1) **Consistency** — showing up daily, (2) **Quality** — completing tasks well, (3) **Exploration** — using the full feature set. Badges are tiered (Bronze → Silver → Gold → Platinum) and many are upgradeable in place. Secret/hidden badges create surprise moments. 

## **Badge Catalogue (40 badges)** 

|**ID**|**Name**|**Tier**|**Category**|**Condition**|**XP**|
|---|---|---|---|---|---|
|first_plan|First Step|Bronze|Planning|Create first plan|50|
|plan_5|Getting Started|Bronze|Planning|Create 5 plans|75|
|plan_25|Planner|Silver|Planning|Create 25 plans|150|
|plan_100|Master Planner|Gold|Planning|Create 100 plans|300|
|plan_365|Planning Legend|Platinum|Planning|Create 365 plans|1000|
|streak_3|Hat Trick|Bronze|Streak|3-day streak|60|
|streak_7|Week Warrior|Silver|Streak|7-day streak|150|
|streak_30|Monthly Master|Gold|Streak|30-day streak|500|
|streak_100|Century Club|Platinum|Streak|100-day streak|2000|
|perfect_day|Perfect Day|Silver|Completion|100% completion on a plan|100|
|perfect_week|Flawless Week|Gold|Completion|100% completion 7 days in a row|600|
|early_bird|Early Bird|Bronze|Planning|Create a plan starting before 07:00<br>x5|80|
|night_owl|Night Owl|Bronze|Planning|Create a plan ending after 22:00 x5|80|
|deep_worker|Deep Worker|Silver|Planning|Use 'Deep Work' context 10 times|120|
|energy_manager|Energy Manager|Silver|Planning|Use all 7 context tags at least once|200|
|comeback_kid|Comeback Kid|Silver|Streak|Resume planning after 7+ day gap|150|
|grace_used|Second Chance|Bronze|Streak|Use the streak grace period|30|
|top_10|Top 10|Gold|Social|Reach top 10 on All-Time<br>Leaderboard|500|
|top_1|Champion|Platinum|Social|Reach #1 on Leaderboard|2000|
|invite_friend|Social Planner|Bronze|Social|Refer 1 user (referral link)|100|
|multilingual|World Citizen|Bronze|Special|Switch language 3 times|50|
|dark_mode_fan|Dark Side|Bronze|Special|Use dark mode for 7 consecutive<br>days|40|
|xp_1000|XP Hunter|Silver|Completion|Earn 1,000 total XP|100|
|xp_10000|XP Legend|Gold|Completion|Earn 10,000 total XP|500|



DailyPlan Blueprint  ·  Page 18 

|complete_50_tasks|Task Crusher|Silver|Completion|Complete 50 total tasks|200|
|---|---|---|---|---|---|
|complete_500_tasks|Task Machine|Gold|Completion|Complete 500 total tasks|750|
|critical_completer|No Excuses|Gold|Completion|Complete 10 critical-priority tasks|300|
|plan_month_straight|Full Month|Gold|Streak|Plan every day for a calendar<br>month|800|
|morning_routine|Morning Routine|Silver|Planning|Create a plan before 08:00 for 14<br>days|250|
|???|Secret: Explorer|Gold|Special|Hidden — triggered by easter egg<br>click|500|



## **Badge Check Pipeline** 

- After every plan save (status → active/completed) and after every task status change, the server calls checkBadges(userId). 

- checkBadges fetches relevant aggregates (plan count, streak, task counts) and evaluates each unearned badge's condition. 

- Earned badges are pushed to User.badges with earnedAt timestamp. XP is added atomically. 

- Frontend polls GET /api/badges/new after AI generation completes; if new badges returned, a toast celebration fires. 

DailyPlan Blueprint  ·  Page 19 

**10 Leaderboard System** 

Global ranking by XP 

## **Data Model** 

- Leaderboard is computed from the **User.points** field, not a separate collection. 

- Three time windows: All Time (User.points), This Month (sum XP where earnedAt in current month), This Week. 

- Weekly/Monthly XP is stored in a lightweight XPLog collection: { userId, xp, earnedAt } — aggregated on demand or cached via a daily cron. 

## **Ranking API** 

```
GET /api/leaderboard?period=alltime&page;=1&limit;=50
```

```
Response:
{
  "rankings": [ { "rank": 1, "userId": "...", "name": "...", "avatar": "...",
                  "points": 4250, "streak": 42, "topBadge": { ... } } ],
  "myRank": { "rank": 87, "points": 810 },   // null for guests
  "total": 1542
}
```

## **Anti-Cheat Rules** 

- XP is only awarded server-side — never trusted from client payloads. 

- Duplicate plan detection via aiPromptHash prevents farming XP with identical plans. 

- A rate limiter caps plan creation at 20 per day per user. 

- Suspicious accounts (XP growth > 3 standard deviations) are flagged for admin review. 

- Deleted/soft-deleted accounts are anonymised: 'Deleted User #XXXX' shown on Leaderboard. 

DailyPlan Blueprint  ·  Page 20 

**API Routes Reference** 

All /api/* endpoints 

**11** 

|**Method**|**Route**|**Auth?**|**Description**|
|---|---|---|---|
|POST|/api/auth/register|–|Create credentials account. Returns session.|
|POST|/api/auth/[...nextauth]|–|NextAuth handler (login, OAuth, session)|
|POST|/api/auth/forgot-password|–|Send reset email|
|POST|/api/auth/reset-password|–|Verify token + set new password|
|GET|/api/plans|opt|List plans. ?date=, ?status=, ?page=. Guest: last 7.|
|POST|/api/plans|opt|Create plan. Body: { braindump, planDate, startTime,<br>endTime, contextTags, tasks }|
|GET|/api/plans/:id|opt|Get plan detail|
|PATCH|/api/plans/:id|opt|Update plan status, tasks, title|
|DELETE|/api/plans/:id||Delete plan (own plans only)|
|PATCH|/api/plans/:id/tasks/:taskId||Update single task status→triggers XP + badge check|
|POST|/api/ai/generate|opt|Send braindump to Groq→return TaskList JSON. Rate<br>limited.|
|GET|/api/badges||All badge definitions + user's earned status|
|GET|/api/badges/new||Badges earned since last check (polling endpoint)|
|GET|/api/progress||Aggregate stats for progress page charts|
|GET|/api/leaderboard|opt|?period=alltime|month|week &page;= &limit;=|
|GET|/api/users/me||Get own profile|
|PATCH|/api/users/me||Update name, avatar, locale, theme, defaultTimes|
|PATCH|/api/users/me/password||Change password (credentials users only)|
|DELETE|/api/users/me||Soft delete account|
|PATCH|/api/users/locale|opt|Update preferred locale (also sets cookie for guests)|
|GET|/api/plans/conflicts|opt|?date=&startTime;=&endTime;= — returns overlapping<br>plans|
|GET|/api/cron/check-streaks|cron|Run nightly: mark missed plans, update streaks|
|GET|/api/cron/refresh-leaderboard|cron|Recompute weekly/monthly XP caches|



DailyPlan Blueprint  ·  Page 21 

**Git Branch Strategy** 

**12** 

Remake workflow 

## **Branch Tree** 

`main  (production — protected)` III `develop  (integration branch)` III `remake  (parent for this full remake)` III `remake/db-schema` ← `Mongoose models + migrations` III `remake/auth` ← `NextAuth setup + Google OAuth` III `remake/i18n` ← `next-intl + message files + RTL` III `remake/design-system` ← `Tailwind config + shadcn + tokens` III `remake/plan-page` ← `Plan page + Schedule Overview` III `remake/conflict-logic` ← `Time conflict detection + resolution` III `remake/ai-integration` ← `Groq pipeline + prompt + caching` III `remake/history-page` ← `History + pagination` III `remake/progress-page` ← `Charts + stats` III `remake/badges-system` ← `New badge catalogue + check pipeline` III `remake/leaderboard` ← `Ranking API + UI` III `remake/settings-page` ← `Account management` III `remake/guest-mode` ← `Guest restrictions + nudges` 

## **PR Rules** 

- Each sub-branch merges into **remake** via PR with at least 1 review. 

- PR title format: [remake/scope] Short description. 

- All PRs must pass: **lint** (ESLint + Prettier) + **type-check** (tsc --noEmit) + **unit tests** . 

- No direct pushes to main or develop. 

- Remake branch merges into develop → main only after full QA sign-off. 

DailyPlan Blueprint  ·  Page 22 

**13 Theme & Design System** 

Light / Dark / System 

## **Theme Implementation** 

Theme is controlled by the next-themes library. The user's preference is stored in User.theme (DB) for auth users and in a cookie for guests. On the server, the theme class is injected into the tag via a server component reading the session/cookie, preventing flash of unstyled content (FOUC). 

## **Colour Tokens (Tailwind CSS Variables)** 

|**Token**|**Light**|**Dark**|**Usage**|
|---|---|---|---|
|--background|#FFFFFF|#0F172A|Page background|
|--foreground|#0F172A|#F8FAFC|Primary text|
|--card|#F8FAFC|#1E293B|Card surfaces|
|--primary|#4F46E5|#6366F1|Brand / CTA buttons|
|--primary-foreground|#FFFFFF|#FFFFFF|Text on primary|
|--muted|#F1F5F9|#1E293B|Muted backgrounds|
|--muted-foreground|#64748B|#94A3B8|Secondary text|
|--border|#E2E8F0|#334155|Borders|
|--accent|#818CF8|#818CF8|Highlights|
|--destructive|#EF4444|#EF4444|Errors / delete|
|--success|#10B981|#10B981|Success states|
|--warning|#F59E0B|#F59E0B|Warnings / conflicts|



## **Typography** 

- **Latin fonts:** Geist Sans (Vercel) via next/font/local — weights 400, 500, 600, 700. 

- **Arabic font:** Noto Kufi Arabic — loaded only when locale=ar to avoid bundle bloat. 

- **Mono font:** Geist Mono — code blocks, time displays. 

- **Scale:** Tailwind default + custom: text-2xs (10px) for badge labels. 

DailyPlan Blueprint  ·  Page 23 

**Guest Mode & Restrictions** 

**14** 

Unauthenticated users 

|**Feature**|**Guest**|**Auth User**|
|---|---|---|
|Create Plans|(max 7 stored)|unlimited|
|AI Generation|(3/day/IP)|(10/day)|
|Plan History|last 7 visible|all history|
|Progress Page|redirect to /login||
|Badges|redirect to /login||
|Leaderboard (view)|view only||
|Leaderboard (ranked)|not ranked|ranked|
|Settings|redirect to /login||
|Streak Tracking|||
|XP / Points|||
|Email Notifications|||
|Plan data persistence|7-day TTL cookie session in<br>MongoDB|Permanent in MongoDB|



## **Guest Plan Migration** 

When a guest signs up or logs in, the server checks for a guestSessionId cookie. If found, it migrates all guest plans (up to 7) to the new user account by updating Plan.userId and clearing Plan.guestSessionId. A toast notifies: 'Your 3 previous plans have been saved to your account.' 

DailyPlan Blueprint  ·  Page 24 

**15 Notifications & Alerts** 

Toast + Email 

|**Trigger**|**Channel**|**Message**|
|---|---|---|
|Plan saved|Toast|'Your plan for [date] is ready!'|
|Task marked done|Toast|+XP animation + 'Task completed!'|
|Plan completed (≥90%)|Toast|Confetti + 'Amazing! Plan completed. +150 XP'|
|New badge earned|Toast|Badge icon + name + '+ XP earned'|
|Streak milestone|Toast + Email|'You're on a X-day streak!I'|
|Conflict detected|Inline Banner|Yellow banner with resolution options|
|AI generation failed|Toast|Red toast + retry button|
|Password reset sent|Toast|'Check your email for reset instructions'|
|Account deleted|Toast|'Your account has been deleted. Goodbye!'|
|Daily reminder (opt-in)|Email|Sent at user's preferred time if no plan for today|



## **16 Environment Variables** 

.env.local 

```
# Database
MONGODB_URI=mongodb+srv://...
# NextAuth
NEXTAUTH_SECRET=
NEXTAUTH_URL=https://dailyplan.app
# Google OAuth
GOOGLE_CLIENT_ID=...
GOOGLE_CLIENT_SECRET=...
# Groq AI
GROQ_API_KEY=gsk_...
# Email (Resend)
RESEND_API_KEY=re_...
EMAIL_FROM=noreply@dailyplan.app
# Storage (avatar uploads)
CLOUDINARY_URL=cloudinary://...
# Cron security
CRON_SECRET=
# Rate limiting (optional Upstash Redis)
```

DailyPlan Blueprint  ·  Page 25 

```
UPSTASH_REDIS_REST_URL=...
UPSTASH_REDIS_REST_TOKEN=...
```

DailyPlan Blueprint  ·  Page 26 

Unit · Integration · E2E 

**17 Testing Strategy** 

|**Layer**|**Tool**|**Coverage Target**|**Key Test Areas**|
|---|---|---|---|
|Unit|Vitest|80%+ functions|XP calc, conflict detection algo, badge<br>conditions, Zod validators, prompt builder|
|Integration|Vitest + mongodb-mem<br>ory-server|All API routes|Plan CRUD, auth flows, AI mock, streak<br>cron logic, guest migration|
|Component|Testing Library|All interactive UI|Form validation, Schedule Overview<br>timeline, Language switcher, Badge grid|
|E2E|Playwright|Critical user journeys|Sign up→create plan→complete tasks→<br>earn badge; Conflict detection flow;<br>Language switch|
|Visual|Storybook + Chromatic|All shadcn<br>components|Dark/light theme parity, RTL Arabic layout,<br>responsive breakpoints|



**18 Future Roadmap** 

Post-remake features 

|**Phase**|**Feature**|**Notes**|
|---|---|---|
|v1.1|Mobile app (React Native Expo)|Share code via monorepo (Turborepo)|
|v1.1|Push Notifications|Web Push API + Expo Push for mobile|
|v1.2|Calendar Integration|Google Calendar / iCal sync of completed plans|
|v1.2|Team Plans|Shared workspace — plan together with a team|
|v1.3|AI Journal|End-of-day reflection prompt stored as journal entry|
|v1.3|Recurring Plans|Template plans that auto-generate daily/weekly|
|v2.0|Voice Input|Web Speech API→braindump by speaking|
|v2.0|Smart Suggestions|AI learns from past plans to pre-suggest tasks|
|v2.1|Offline Mode|Service Worker + IndexedDB draft sync|
|v2.1|Public Profile Page|Share achievements, badges, streak|
|v3.0|AI Coach|Weekly analysis report generated by Groq|
|v3.0|Premium Tier|Unlimited AI calls, advanced analytics, custom themes|



DailyPlan Blueprint  ·  Page 27 

DailyPlan Project Blueprint v1.0 · Generated May 28, 2026 · All details subject to change during implementation. 

DailyPlan Blueprint  ·  Page 28 

