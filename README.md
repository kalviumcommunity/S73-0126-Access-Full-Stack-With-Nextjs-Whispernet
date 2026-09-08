# RuralEdu

An offline-first school portal for rural India, built with Next.js 16, PostgreSQL and Redis.

**The problem.** Rural schools lose connectivity for hours at a time. Software that assumes a
working network is unusable exactly when a teacher needs it — halfway through marking a register,
or looking up a guardian's phone number.

**The approach.** Nothing a teacher does depends on the network being up at that moment. Pages
already visited keep working, data already seen is stored on the device, and changes made offline
are queued and sent when the line returns. The server side is fast when it is reachable, and the
app degrades honestly rather than pretending when it is not.

---

## What it does

| Area             | Detail                                                                                                             |
| ---------------- | ------------------------------------------------------------------------------------------------------------------ |
| **Attendance**   | Daily register per class, four states (present / absent / late / excused), 30-day trend. Fillable offline.         |
| **Students**     | Full roll with grades, sections, roll numbers and guardian contacts. Server-side search across the whole roster.   |
| **Notice board** | Publicly readable announcements with categories, priorities, pinning and automatic expiry. Staff publish and edit. |
| **Textbooks**    | Five books, fifteen chapters, statically rendered. "Save offline" downloads a whole book onto the device.          |
| **Dashboard**    | Live school figures, Redis-cached, reporting truthfully where each number came from.                               |
| **Auth**         | Email/password and Google Sign-In, JWT sessions, role-based access for teachers and administrators.                |

### Who can see what

| Surface                     | Anonymous | Teacher | Admin |
| --------------------------- | :-------: | :-----: | :---: |
| Notice board, textbooks     |     ✓     |    ✓    |   ✓   |
| Dashboard, roster, register |           |    ✓    |   ✓   |
| Publish / edit notices      |           |    ✓    |   ✓   |
| Enrol and edit students     |           |    ✓    |   ✓   |
| Delete a student record     |           |         |   ✓   |
| Staff account count         |           |         |   ✓   |

Pupils and parents read notices and textbooks without an account — that is the point of putting
them online in the first place.

---

## Getting started

Requires Node 20+ and Docker (for PostgreSQL and Redis).

```bash
npm install
cp .env.example .env.local        # then edit it — JWT_SECRET must be 32+ chars
npm run services:up               # PostgreSQL + Redis in Docker
npm run db:migrate                # create the schema
npm run db:seed                   # 62 pupils, 4 weeks of attendance, 8 notices
npm run dev
```

Then sign in at http://localhost:3000/login:

| Account               | Password      | Role    |
| --------------------- | ------------- | ------- |
| `admin@ruraledu.in`   | `Admin@12345` | ADMIN   |
| `teacher@ruraledu.in` | `Teacher@123` | TEACHER |

To run the whole stack in containers instead:

```bash
docker compose up --build
docker compose exec app npx prisma migrate deploy
```

### Scripts

| Command               | Purpose                                               |
| --------------------- | ----------------------------------------------------- |
| `npm run dev`         | Development server                                    |
| `npm run build`       | Generate the Prisma client, then build for production |
| `npm run lint`        | ESLint (includes the React Compiler rules)            |
| `npm run typecheck`   | `tsc --noEmit`                                        |
| `npm run db:migrate`  | Create and apply a migration                          |
| `npm run db:seed`     | Reseed with demo data                                 |
| `npm run db:studio`   | Prisma Studio                                         |
| `npm run services:up` | Start PostgreSQL and Redis                            |

---

## How "offline-first" actually works

Three separate mechanisms, each doing one job. They are independent — losing any one of them
degrades the app rather than breaking it.

### 1. Pages — service worker (`public/sw.js`)

| Request type  | Strategy                                                           |
| ------------- | ------------------------------------------------------------------ |
| Navigations   | Network first → cached page → `/offline.html`                      |
| Static assets | Stale-while-revalidate                                             |
| API reads     | Network first → last good response, tagged `X-From-SW-Cache`       |
| API writes    | Passed through untouched — queueing is the app's job, not the SW's |

Only `200`, non-opaque responses are cached, so an error page can never be stored and later served
as if it were content. Updates never reload the page on their own: a teacher mid-register is asked
first.

### 2. Data you have seen — IndexedDB (`src/lib/offline/db.ts`)

Successful `GET` responses are written to IndexedDB. When a read fails, the stored copy is returned
and the UI labels it — "showing a saved copy" — rather than passing stale data off as current.

### 3. Changes you make — the outbox (`src/lib/offline/sync.ts`)

A write attempted while offline goes into an IndexedDB queue with a human-readable label
("Attendance for Grade 5-A on 2026-09-08"). On reconnect the queue is replayed **in order**, because
"create student" must land before "mark that student present". A `4xx` other than 408/429 is
permanent, so it is dropped rather than blocking the queue forever.

Replays are safe: attendance is written with an upsert keyed on `(studentId, date)`, so syncing the
same register twice corrects the row instead of duplicating it.

`navigator.onLine` only reports whether a network interface is up — a captive portal or a dead
upstream still looks "online" — so a lightweight `HEAD /api/health` probe runs every 30 seconds to
find out whether the server is genuinely reachable.

---

## Caching

Redis is used cache-aside, and is **never** required. Every cache call goes through
`src/lib/cache/index.ts`, which returns the cache status alongside the value:

```
HIT      served from Redis
MISS     computed from PostgreSQL, then stored
BYPASS   Redis unreachable — answered from PostgreSQL
```

That status is surfaced on the response as `X-Cache` and shown on the dashboard, so the panel
reports what actually happened instead of guessing from response latency.

**Invalidation** is by key prefix, using `SCAN` rather than `KEYS` so it never blocks the Redis
event loop. Writing a student clears `students:`, `dashboard:stats:` and `attendance:` together.

**When Redis is down**, a circuit breaker marks it unavailable for 10 seconds after a failed
connection. Without that, every request would pay the full connect timeout before falling back —
turning a cache outage into a site-wide slowdown, which is the opposite of what a cache is for.
Measured locally: ~30 ms per request with Redis down, versus ~1 s without the breaker.

---

## Rendering strategies

| Route                                    | Strategy    | Why                                                                |
| ---------------------------------------- | ----------- | ------------------------------------------------------------------ |
| `/`                                      | Static      | Marketing copy; one HTML download and nothing else                 |
| `/textbooks`, `/textbooks/[id]`          | SSG         | The catalogue ships in the build, so it needs no database at all   |
| `/textbooks/[id]/chapter/[id]`           | SSG         | All 15 chapters pre-rendered — what makes the library work offline |
| `/notices`                               | ISR (5 min) | Static-page speed, plus `revalidatePath` on publish for immediacy  |
| `/dashboard`, `/students`, `/attendance` | Client      | Per-user, live data behind an auth gate                            |
| `/api/*`                                 | Dynamic     | Request-scoped                                                     |

Chapter markdown is rendered to HTML **at build time** (`src/features/textbooks/renderChapter.ts`),
so a pupil downloads finished HTML rather than a markdown parser. The renderer is ~200 lines and
purpose-built for the subset the chapters use; a general parser would weigh more than the content.

---

## Security

- **Authorisation is enforced in every route handler**, not only in the proxy. `src/proxy.ts` is a
  first line of defence, but a proxy can be bypassed by internal rewrites, so each handler calls
  `requireAuth` / `requireRole` itself.
- **Roles are assigned server-side.** The signup schema has no `role` field at all, so a request
  cannot register itself as an administrator.
- **Login does not leak account existence** — the same message and comparable work either way.
- **Brute-force protection counts failures, not sign-ins.** A rural school shares one connection,
  so a limit that counted successful logins would lock out the staff room by mid-morning. Failed
  attempts are counted per account _and_ IP (8 per 15 min) and cleared by a correct password; a
  separate, generous per-IP ceiling (60/min) stops outright hammering.
- **Google ID tokens are verified against Google's JWKS** — signature, issuer, audience and expiry —
  rather than trusted from a `tokeninfo` round trip.
- **Passwords are bcrypt-hashed** with a cost of 12.
- **Errors are funnelled** through `handleRouteError`, so stack traces and SQL never reach a client.
- **Identity headers are stripped** from incoming requests before the proxy sets its own.

---

## Project structure

```
src/
├── app/
│   ├── (auth)/            login, signup
│   ├── (portal)/          dashboard, students, attendance   — signed in
│   ├── (public)/          notices, textbooks                — no account needed
│   ├── api/               route handlers
│   └── layout.tsx
├── components/
│   ├── layout/            PortalShell, PublicShell, ConnectionStatus
│   ├── providers/         Auth, Offline, ServiceWorker
│   └── ui/                Button, Card, Modal, Field, Badge…
├── features/              one folder per domain
│   ├── attendance/        register + trend
│   ├── notices/           board, editor, category metadata
│   ├── students/          roster, form
│   └── textbooks/         catalogue, reader, markdown renderer
├── lib/
│   ├── auth/              JWT (jose), session guards, rate limiting
│   ├── cache/             Redis client + cache-aside helpers
│   ├── db/                Prisma client
│   ├── http/              API client, response envelope, error funnel
│   ├── offline/           IndexedDB store, outbox sync
│   ├── utils/             logger, cn, useLocalStore
│   └── validation/        Zod schemas, shared by client and server
└── proxy.ts               edge auth gate (Next 16 renamed this from middleware)
```

Validation schemas live in `lib/validation` and are imported by **both** the form and the route
handler, so the browser and the server cannot disagree about what is valid.

---

## Data model

```
User ────────────< Notice          (author)
  │
  └──────────────< Attendance      (who marked it)

Student ─────────< Attendance      unique (studentId, date)
```

`Attendance.date` is a `DATE` pinned to UTC midnight — attendance is a calendar fact, not an
instant, so "today" must not shift with the server's timezone. The `(studentId, date)` unique
constraint is what makes offline replay idempotent.

Indexes: `User(role)`, `User(googleId)`, `Student(grade)`, `Student(grade, section)`,
`Student(isActive)`, `Student(name)`, `Attendance(date)`, `Attendance(status, date)`,
`Notice(isActive, publishedAt)`, `Notice(category)`, `Notice(isPinned)`.

---

## API

All responses share one envelope:

```jsonc
{
  "success": true,
  "message": "Students fetched successfully",
  "data": {
    /* … */
  },
  "timestamp": "2026-09-08T10:30:00.000Z",
}
```

| Method             | Endpoint                                | Access    |
| ------------------ | --------------------------------------- | --------- |
| `POST`             | `/api/auth/signup`, `/login`, `/google` | Public    |
| `GET`              | `/api/auth/me`                          | Signed in |
| `GET`              | `/api/health`                           | Public    |
| `GET`              | `/api/notices`                          | Public    |
| `POST`             | `/api/notices`                          | Staff     |
| `PATCH` / `DELETE` | `/api/notices/:id`                      | Staff¹    |
| `GET`              | `/api/students`                         | Signed in |
| `POST`             | `/api/students`                         | Staff     |
| `GET` / `PATCH`    | `/api/students/:id`                     | Staff     |
| `DELETE`           | `/api/students/:id`                     | Admin     |
| `GET` / `POST`     | `/api/attendance`                       | Staff     |
| `GET`              | `/api/attendance/summary`               | Signed in |
| `GET`              | `/api/dashboard/stats`                  | Staff     |

¹ `DELETE` withdraws a notice; `?permanent=true` removes it and is admin-only. A notice board is a
record of what was announced, so history is hidden rather than destroyed.

`GET /api/health` returns `healthy`, `degraded` (Redis down, everything still works) or `unhealthy`
(database unreachable, `503`).

---

## Accessibility and low-end devices

- Light theme only, high contrast — these screens are read in daylight classrooms.
- 44 px minimum tap targets throughout.
- Every form control is labelled and wired to its error with `aria-describedby`; errors announce
  via `role="alert"`.
- The modal traps focus, restores it on close, and closes on Escape.
- `prefers-reduced-motion` is respected.
- Pinch-zoom is **not** disabled.
- The attendance chart is CSS-only — a charting library would outweigh the whole page.
- Chapter pages have a print stylesheet, because pupils without a device are given photocopies.

---

## Deploying

Set these on the host before the first deploy:

| Variable                       | Required | Notes                                                  |
| ------------------------------ | :------: | ------------------------------------------------------ |
| `DATABASE_URL`                 |    ✓     | Pooled connection for the app                          |
| `DIRECT_URL`                   |    ✓     | Unpooled connection, used by migrations                |
| `JWT_SECRET`                   |    ✓     | 32+ random characters; rotating it signs everyone out  |
| `REDIS_URL`                    |          | Omit and the app reads from PostgreSQL every time      |
| `GOOGLE_CLIENT_ID`             |          | Omit and the Google button is hidden                   |
| `NEXT_PUBLIC_GOOGLE_CLIENT_ID` |          | Same value; needed in the browser to render the button |

Then apply migrations against the new database — this is a separate step from
the build, and must run before the first request:

```bash
npx prisma migrate deploy
```

Point your uptime check at `GET /api/health`. It returns `200` for both
`healthy` and `degraded` (Redis down but everything still working), and `503`
only when PostgreSQL is unreachable — so a cache outage will not page anyone at
two in the morning.

**Seed data is for demonstration.** `npm run db:seed` deletes every student,
attendance record and notice before inserting the sample school. Never run it
against a database holding real records.

**After the first deploy**, create your administrator, then remove or change the
seeded accounts — `admin@ruraledu.in` and `teacher@ruraledu.in` have published
passwords.

---

## License

Educational project.
