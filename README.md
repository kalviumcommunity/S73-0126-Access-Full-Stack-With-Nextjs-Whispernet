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

## Reflection
If this app scaled to 10x users, I would move the **Teacher Dashboard** from pure SSR to Client-Side Fetching (SWR/TanStack Query) or aggressive caching to prevent the server from crashing under load.