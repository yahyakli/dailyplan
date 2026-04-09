# dailyplan 🗓️

**Brain-dump everything. Turn it into a realistic time-blocked day.**

dailyplan is a modern, AI-powered scheduling application that solves the "blank page" problem of daily planning. By converting a simple list of tasks and energy levels into a structured, prioritized timeline, it helps users regain control of their day with zero friction.

![Version](https://img.shields.io/badge/version-0.1.0-blue.svg)
![Next.js](https://img.shields.io/badge/Next.js-16.2.1-black.svg)
![React](https://img.shields.io/badge/React-19.2.4-61dafb.svg)

---

## ✨ Key Features

### 🧠 AI-Driven Scheduling
Convert messy brain-dumps into logical time blocks. The AI respects your preferred start/end times and categorizes tasks (Deep Work, Admin, Communication, etc.) based on your context and energy levels.

### 🔑 Decentralized API Costs
Unlike traditional SaaS, dailyplan uses a **User-Side API Key** model. Users provide their own Mistral API key, which is stored securely in their browser's `localStorage`. This ensures the project remains free and scalable for the developer while giving users full control.

### 🌍 Full Localization & RTL Support
Built with `next-intl`, dailyplan supports **English**, **French**, and **Arabic**. It includes native Right-to-Left (RTL) layout support for a seamless experience across cultures.

### 🎮 Gamification & Habits
- **Points & Streaks**: Earn points for starting tasks and completing plans.
- **Leaderboard**: Compete with other planners to stay consistent.
- **Badges**: Unlock achievements like "First Plan," "Weekend Warrior," and "Perfect Week."

### 📱 Mobile-First Design
Optimized for high-speed interaction on mobile. Large touch targets, sequential task locking (prevents skipping ahead), and a premium glassmorphic UI.

### 🔒 Privacy & Persistence
- **Auth Mode**: Sign in with Google or Email to sync history and stats across devices (MongoDB).
- **Guest Mode**: Use the app instantly with local storage persistence.

---

## 🚀 Tech Stack

- **Framework**: [Next.js 16](https://nextjs.org/) (App Router, Turbopack)
- **UI Logic**: [React 19](https://react.dev/)
- **Database**: [MongoDB](https://www.mongodb.com/) via [Mongoose](https://mongoosejs.com/)
- **Authentication**: [NextAuth.js](https://next-auth.js.org/)
- **AI Engine**: [Mistral AI](https://mistral.ai/)
- **Styling**: Vanilla CSS + [Shadcn/ui](https://ui.shadcn.com/) (Custom tokens)
- **Icons**: [Lucide React](https://lucide.dev/)
- **Internationalization**: [Next-intl](https://next-intl-docs.vercel.app/)

---

## 🛠️ Getting Started

### Prerequisites
- Node.js 20.x or higher
- MongoDB instance (Local or Atlas)
- Mistral API Key (for the scheduler)

### 1. Clone the repository
```bash
git clone https://github.com/yahyakli/dailyplan.git
cd dailyplan
```

### 2. Install dependencies
```bash
npm install
```

### 3. Environment Setup
Create a `.env.local` file in the root directory:
```env
MONGODB_URI=your_mongodb_connection_string
NEXTAUTH_SECRET=your_nextauth_secret
NEXTAUTH_URL=http://localhost:3000
GOOGLE_CLIENT_ID=your_google_client_id
GOOGLE_CLIENT_SECRET=your_google_client_secret
```
> [!NOTE]
> `MISTRAL_API_KEY` is not required on the server side unless you want to provide a fallback. Users will input their own keys in the application settings.

### 4. Run Development Server
```bash
npm run dev
```
Open [http://localhost:3000](http://localhost:3000) to see the result.

---

## 📖 How It Works

1. **The Brain-Dump**: Enter your tasks in a free-form text area.
2. **Setup**: Choose your start time, end time, and overall context (e.g., "low energy day," "focused work").
3. **Connect**: Link your Mistral API key in **Settings > AI Configuration**.
4. **Plan**: Click "Plan for my day." The AI generates a time-blocked schedule with built-in breaks and category prioritization.
5. **Track**: Mark blocks as started and completed to earn points and climb the leaderboard.

---

## 🗺️ Project Structure

```bash
├── public/locales/      # Translation JSON files (en, fr, ar)
├── src/
│   ├── app/             # Next.js App Router (Pages & API routes)
│   ├── components/      # Reusable React components
│   ├── lib/             # Core logic (AI, scoring, i18n, db)
│   ├── models/          # Mongoose schemas
│   └── styles/          # Global styles & Design system
└── .env.local           # Local configuration
```

---

## ✨ Contribution

This project is in its MVP stage. Feel free to open issues or submit PRs for:
- New AI scheduling prompts & models.
- Additional localization (Spanish, German, etc.).
- Performance optimizations for Next.js 16.

---

## 📜 License
Licensed under the MIT License. Created by [yahyakli](https://github.com/yahyakli).
