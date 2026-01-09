# Rural Education App - Offline-First Rendering Demo

## Problem Statement
Rural schools struggle with low bandwidth. This app demonstrates how Next.js rendering modes can optimize performance for these environments.

## Rendering Strategies Implemented

### 1. Static Site Generation (SSG) - /textbooks
* **Why:** Textbooks are static content.
* **Performance:** Pre-rendered HTML means zero server wait time and easy caching for offline use.

### 2. Server-Side Rendering (SSR) - /dashboard
* **Why:** Teachers need real-time attendance data.
* **Trade-off:** Slower TTFB (Time to First Byte) but ensures data accuracy.

### 3. Incremental Static Regeneration (ISR) - /notices
* **Why:** Notices change daily, not second-by-second.
* **Benefit:** Reduces server load by 99% compared to SSR, while keeping content relatively fresh.

## Build Evidence
[Insert Screenshot of your `npm run build` terminal output here]

# 🛠️ Code Quality & Configuration

To ensure our team writes clean, bug-free code, we have implemented strict linting and formatting rules.

## 1. TypeScript Configuration (`tsconfig.json`)
We enabled `strict: true`, `noImplicitAny`, and `noUnusedLocals`.
* **Why:** This prevents "undefined" errors at runtime and forces us to handle data types explicitly.

## 2. ESLint + Prettier
* **Style:** Double quotes, semi-colons required, tab width 2.
* **Quality:** No unused variables, warnings on `console.log`.
* **Why:** Ensures the code looks like it was written by one person, even with a team of 10.

## 3. Husky (Pre-Commit Hooks)
We use `lint-staged` to run checks before every commit.
* **Workflow:** If a developer tries to commit code with errors, the commit is blocked automatically.

# 🔐 Environment Variable Management

To ensure security, this project separates server secrets from client configuration.

## Setup Instructions
1. Copy the example file: `cp .env.example .env.local`
2. Fill in the real values in `.env.local`.

## Variable Reference

| Variable | Scope | Purpose |
| :--- | :--- | :--- |
| `DATABASE_URL` | **Server Only** | Connection string for PostgreSQL. Never exposed to browser. |
| `API_SECRET_KEY` | **Server Only** | Private key for backend services. |
| `NEXT_PUBLIC_APP_NAME` | **Client & Server** | The public display name of the app. |
| `NEXT_PUBLIC_API_BASE_URL` | **Client & Server** | Base URL for fetching data. |

## Security Measures
* **.gitignore:** Configured to ignore `.env.local` so secrets are never pushed to GitHub.
* **Prefixing:** Only variables starting with `NEXT_PUBLIC_` are bundled to the client.

## Reflection
If this app scaled to 10x users, I would move the **Teacher Dashboard** from pure SSR to Client-Side Fetching (SWR/TanStack Query) or aggressive caching to prevent the server from crashing under load.

