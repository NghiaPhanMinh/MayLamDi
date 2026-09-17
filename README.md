# MayLamDi

> An AI-assisted teamwork platform designed to make university group projects feel fairer, clearer, and more collaborative.

[![Build Status](https://img.shields.io/badge/Build-Passing-22c55e.svg)](https://github.com/NghiaPhanMinh/MayLamDi)
[![Tests](https://img.shields.io/badge/Tests-228%2F228%20Passed-22c55e.svg)](https://github.com/NghiaPhanMinh/MayLamDi)
[![License](https://img.shields.io/badge/License-MIT-blue.svg)](LICENSE)

---

## 1. Project Overview

**MayLamDi** — an AI-assisted teamwork platform designed to make university group projects feel fairer, clearer, and more collaborative.

Teams can organise project briefs, plan tasks, allocate responsibilities based on skills and workload, and keep everyone's progress visible in one shared space. By combining AI planning, contribution tracking, and gamification, MayLamDi reduces uneven workload and keeps teams accountable — without turning collaboration into competition.

---

## 2. Core Features

- **Personification** — Set up a project brief, framework, and deadline, skills and availability, and weekly capacity.  
  $\rightarrow$ *Builds a shared project structure.*
- **AI Assistant** — Suggests tasks and recommends task owners, factoring in workload and team context. All AI suggestions can be edited or rejected by the team.  
  $\rightarrow$ *Fairer, human-controlled allocation.*
- **Tracking** — Task ownership, progress status, evidence uploads, and peer reviews.  
  $\rightarrow$ *Makes contribution visible.*
- **Gamification** — Shared quests, battle progress, and team outcomes, kept deliberately non-competitive.  
  $\rightarrow$ *Turns real work into shared progress.*

---

## 3. Tech Stack

- **Frontend**:
  - [React 19](https://react.dev/) & [TypeScript](https://www.typescriptlang.org/)
  - [Vite](https://vitejs.dev/) (lightning-fast build tool and dev server)
  - [Tailwind CSS v4](https://tailwindcss.com/) & Neo-Brutalist accessible design system
  - [Lucide React](https://lucide.dev/) (consistent UI icons)
  - [Recharts](https://recharts.org/) (workload and progress analytics)
  - [React Router v7](https://reactrouter.com/) (client-side routing)
- **Backend & Realtime Database**:
  - [Convex](https://www.convex.dev/) (reactive document database, serverless TypeScript functions, storage, scheduled cron jobs, and subscriptions)
- **Authentication**:
  - [Convex Auth](https://labs.convex.dev/auth) with Google OAuth (OpenID Connect / Google Cloud)
- **AI Integration**:
  - [OpenRouter API](https://openrouter.ai/) (access to open-weights LLMs such as Google Gemma 26B, Nvidia Nemotron, and Llama for automated task decomposition and skill-based allocation)
- **Testing & Quality**:
  - [Vitest](https://vitest.dev/) & [React Testing Library](https://testing-library.com/) (165 unit & integration tests)
  - [ESLint](https://eslint.org/) & TypeScript strict checks

---

## 4. Setup Instructions

### Prerequisites
- [Node.js](https://nodejs.org/) (version `22.x` or compatible LTS)
- `npm` (bundled with Node.js)
- A [Convex](https://www.convex.dev/) account

### Step 1: Clone the Repository
```bash
git clone https://github.com/NghiaPhanMinh/Gamified-Team-Project-Tracker.git
cd Gamified-Team-Project-Tracker
```

### Step 2: Install Dependencies
```bash
npm install
```

### Step 3: Configure Local Environment
Copy the provided `.env.example` file:
```bash
cp .env.example .env.local
```
Set your development Convex URLs in `.env.local`:
```env
VITE_CONVEX_URL=https://<your-dev-deployment>.convex.cloud
VITE_CONVEX_SITE_URL=https://<your-dev-deployment>.convex.site
```

### Step 4: Run the Development Server
In your first terminal, start Convex backend syncing:
```bash
npx convex dev
```
In a second terminal, launch the Vite dev server:
```bash
npm run dev
```
Open [http://localhost:5173](http://localhost:5173) in your browser.

### Step 5: Verification & Quality Checks
```bash
# Run unit and integration tests
npm test

# Run TypeScript typechecks
npm run typecheck

# Run linter
npm run lint

# Build production bundle locally
npm run build
```

---

## 5. Environment Variables

All required environment variables are listed in [`.env.example`](.env.example). **Never expose private server keys in client-side `VITE_` variables.**

| Variable Name | Required In | Description & Source |
|---|---|---|
| `VITE_CONVEX_URL` | Frontend (`.env.local` / Vercel) | Convex deployment WebSocket/HTTP URL (from Convex Dashboard). |
| `VITE_CONVEX_SITE_URL` | Frontend (`.env.local` / Vercel) | Convex HTTP actions and callback URL. |
| `SITE_URL` | Convex Dashboard | Base URL of the app (`http://localhost:5173` locally, production domain in production). |
| `AUTH_GOOGLE_ID` | Convex Dashboard | Google OAuth Client ID (from Google Cloud Console). |
| `AUTH_GOOGLE_SECRET` | Convex Dashboard | Google OAuth Client Secret (from Google Cloud Console). |
| `OPENROUTER_API_KEY` | Convex Dashboard | API key for AI assistant features (from OpenRouter Dashboard). |
| `OPENROUTER_MODEL` | Convex Dashboard (Optional) | Primary LLM identifier (defaults to `google/gemma-4-26b-a4b-it:free`). |
| `OPENROUTER_FALLBACK_MODEL` | Convex Dashboard (Optional) | Fallback LLM identifier if the primary model is busy or rate-limited. |
| `OPENROUTER_FREE_FALLBACK_MODELS` | Convex Dashboard (Optional) | Comma-separated list of free-tier fallback models. |
| `CONVEX_DEPLOY_KEY` | Vercel Environment Variables | Production deploy key allowing Vercel to automatically sync schema during CI/CD. |

---

## 6. Deployment Notes

- **Frontend Hosting**: Hosted on [Vercel](https://vercel.com/) linked to the `main` branch.
- **Backend Hosting**: Hosted on [Convex Cloud](https://www.convex.dev/) (production deployment).
- **Automated CI/CD**:
  - Pushes to `main` trigger GitHub Actions and Vercel builds.
  - Vercel executes `npm run vercel-build` (`node scripts/vercel-build.js`), which pushes the Convex functions with `CONVEX_DEPLOY_KEY`, injects the production `VITE_CONVEX_URL`, and builds the Vite production assets.
- **OAuth Callback Whitelisting**:
  - Google OAuth requires exact redirect URIs configured in Google Cloud Console:
    - **Local**: Origin `http://localhost:5173` and redirect `https://<dev>.convex.site/api/auth/callback/google`
    - **Production**: Origin `https://maylamdi.vercel.app` and redirect `https://<prod>.convex.site/api/auth/callback/google`
- **Typography & Font Fallbacks**:
  - The design specifies *Blode Starkly* for headings and *Glacial Indifference* for body text. Documented system font fallbacks ensure the UI looks sharp and functional on all operating systems without hotlinking external font CDNs.

---

## 7. Known Limitations

The following limitations are actively documented so users and reviewers are not confused by works-in-progress:

- **UI/UX & Navigation**:
  - Onboarding/project flow is unclear.
  - Mobile layout has issues.
  - High rate of invalid-click behaviour.
- **AI Features**:
  - AI assistant needs better context and personalisation.
  - Loading indicator lacks feedback (no stop button, no countdown timer).
  - No pre-commit editing of AI-suggested tasks.
- **Onboarding**:
  - No short tutorial for first-time users.
  - Users are forced to sign in immediately, with no "try before signing in" option.

---

## 8. License

This project is licensed under the [MIT License](LICENSE) — see the [LICENSE](LICENSE) file for details.