# 🏫 RuralEdu - Offline-First Education Portal

A modern, offline-capable web application designed for rural schools with limited internet connectivity. Built with **Next.js 16**, **React 19**, **TypeScript**, and a complete backend stack including **PostgreSQL**, **Redis**, and **Docker**.

---

## 📋 Table of Contents

- [Overview](#-overview)
- [Features](#-features)
- [Tech Stack](#-tech-stack)
- [Getting Started](#-getting-started)
- [Project Structure](#-project-structure)
- [Rendering Strategies](#-rendering-strategies)
- [Authentication](#-authentication)
- [API Documentation](#-api-documentation)
- [Database Design](#-database-design)
- [Caching Strategy](#-caching-strategy)
- [Docker Setup](#-docker-setup)
- [Code Quality](#-code-quality)

---

## 🎯 Overview

**Problem:** Rural schools in India struggle with inconsistent internet connectivity, making it difficult for teachers to manage student records and access educational resources.

**Solution:** RuralEdu is an offline-first Progressive Web App (PWA) that:

- Works offline using Service Workers and cached content
- Uses smart rendering strategies (SSG, SSR, ISR) to minimize data usage
- Provides teachers with a dashboard to manage students, attendance, and notices
- Offers students access to pre-rendered textbooks that load instantly

---

## ✨ Features

| Feature                   | Description                                               |
| ------------------------- | --------------------------------------------------------- |
| 🔐 **Authentication**     | Email/password login + Google OAuth with JWT tokens       |
| 👨‍🎓 **Student Management** | Full CRUD operations with search, pagination & validation |
| 📊 **Admin Dashboard**    | Real-time statistics with Redis caching (10ms response)   |
| 📚 **Digital Textbooks**  | Pre-rendered content (SSG) for instant offline access     |
| 📢 **School Notices**     | ISR-powered announcements that refresh hourly             |
| 📱 **PWA Support**        | Installable app with offline fallback page                |
| 🎨 **Modern UI**          | Glassmorphism design with Tailwind CSS                    |

---

## 🛠 Tech Stack

### Frontend

| Technology   | Version | Purpose                         |
| ------------ | ------- | ------------------------------- |
| Next.js      | 16.1.1  | React framework with App Router |
| React        | 19.2.3  | UI component library            |
| TypeScript   | 5.x     | Type-safe development           |
| Tailwind CSS | 4.x     | Utility-first styling           |
| Lucide React | 0.563.0 | Modern icon library             |

### Backend

| Technology         | Purpose                    |
| ------------------ | -------------------------- |
| Next.js API Routes | RESTful API endpoints      |
| Prisma ORM         | Type-safe database queries |
| PostgreSQL 15      | Relational database        |
| Redis 7            | Response caching           |
| JWT (jose)         | Stateless authentication   |
| Zod                | Runtime input validation   |
| bcrypt             | Password hashing           |

### DevOps

| Technology        | Purpose                     |
| ----------------- | --------------------------- |
| Docker            | Containerization            |
| Docker Compose    | Multi-service orchestration |
| Husky             | Pre-commit hooks            |
| ESLint + Prettier | Code quality                |

---

## 🚀 Getting Started

### Prerequisites

- Node.js 20+
- Docker Desktop (for full stack)
- PostgreSQL & Redis (or use Docker)

### Quick Start (Development)

```bash
# 1. Clone the repository
git clone https://github.com/your-repo/rural-edu-app.git
cd rural-edu-app

# 2. Install dependencies
npm install

# 3. Set up environment variables
cp .env.example .env.local
# Edit .env.local with your database credentials

# 4. Generate Prisma client & run migrations
npx prisma generate
npx prisma migrate dev

# 5. Seed the database (optional)
npx prisma db seed

# 6. Start development server
npm run dev
```

### Docker Setup (Recommended)

```bash
# Start all services (App + PostgreSQL + Redis)
docker-compose up --build

# Access the app at http://localhost:3000
```

---

## 📁 Project Structure

```
rural-edu-app/
├── app/                    # Next.js App Router
│   ├── api/                # API Routes
│   │   ├── auth/           # Login, Signup, Google OAuth
│   │   ├── students/       # Student CRUD operations
│   │   ├── admin/          # Admin statistics
│   │   └── profile/        # User profile
│   ├── components/         # Reusable UI components
│   ├── dashboard/          # Teacher dashboard (SSR)
│   ├── textbooks/          # Digital textbooks (SSG)
│   ├── notices/            # School notices (ISR)
│   └── login/              # Authentication pages
├── context/                # React Context (AuthContext)
├── lib/                    # Utilities & configurations
│   ├── prisma.ts           # Database client (singleton)
│   ├── redis.ts            # Cache client
│   ├── api.ts              # Frontend API wrapper
│   └── schemas/            # Zod validation schemas
├── prisma/                 # Database schema & migrations
├── public/                 # Static assets & PWA files
└── docker-compose.yml      # Multi-container setup
```

---

## 🎨 Rendering Strategies

We leverage Next.js rendering modes strategically based on data requirements:

| Page              | Strategy                                  | Reason                                          |
| ----------------- | ----------------------------------------- | ----------------------------------------------- |
| `/textbooks`      | **SSG** (Static Site Generation)          | Content never changes, pre-render at build time |
| `/textbooks/[id]` | **SSG** with `generateStaticParams`       | All textbook pages pre-built                    |
| `/dashboard`      | **SSR** (Server-Side Rendering)           | Teachers need real-time student data            |
| `/notices`        | **ISR** (Incremental Static Regeneration) | Notices update daily, revalidate every hour     |
| `/login`          | **CSR** (Client-Side Rendering)           | Authentication happens in browser               |

---

## 🔐 Authentication

### Flow

1. User submits credentials → Server validates with bcrypt
2. Server generates JWT token (expires in 7 days)
3. Token stored in localStorage, sent with every API request
4. Middleware verifies token on protected routes
5. Role-based access: `ADMIN`, `TEACHER`, `STUDENT`

### Supported Methods

- **Email/Password:** Traditional signup with bcrypt hashing
- **Google OAuth:** One-click sign-in with Google Identity Services

---

## 🌐 API Documentation

### Authentication

| Method | Endpoint           | Description               |
| ------ | ------------------ | ------------------------- |
| `POST` | `/api/auth/signup` | Register new user         |
| `POST` | `/api/auth/login`  | Login with email/password |
| `POST` | `/api/auth/google` | Google OAuth callback     |

### Students

| Method   | Endpoint                        | Description               |
| -------- | ------------------------------- | ------------------------- |
| `GET`    | `/api/students?page=1&limit=10` | List students (paginated) |
| `POST`   | `/api/students`                 | Create new student        |
| `GET`    | `/api/students/:id`             | Get student details       |
| `PATCH`  | `/api/students/:id`             | Update student            |
| `DELETE` | `/api/students/:id`             | Delete student            |

### Admin

| Method | Endpoint           | Description                   |
| ------ | ------------------ | ----------------------------- |
| `GET`  | `/api/admin/stats` | Dashboard statistics (cached) |

### Response Format

All API responses follow a consistent envelope:

```json
{
  "success": true,
  "message": "Students fetched successfully",
  "data": { ... },
  "timestamp": "2026-01-28T10:30:00.000Z"
}
```

---

## 🗄 Database Design

### Entity Relationship

```
User (1) ──────────────────────────────────────
  │  id, email, password, role, googleId
  │
Student (1) ────────< Attendance (Many)
  │  id, name, grade, section     │  id, date, status, studentId
  │
Notice (Standalone)
  │  id, title, content, isActive, updatedAt
```

### Performance Indexes

- `User(role)` - Fast role-based queries
- `User(googleId)` - OAuth lookups
- `Student(grade)` - Filter by class
- `Attendance(date)` - Today's attendance
- `Attendance(status, date)` - Composite for "who was absent on X date"

---

## ⚡ Caching Strategy

We use **Redis** with the **Cache-Aside Pattern** for the admin dashboard:

1. Check Redis for `admin:stats` key
2. **Cache HIT:** Return instantly (~10ms)
3. **Cache MISS:** Query PostgreSQL (~200ms), store in Redis with 60s TTL
4. **Invalidation:** When students are created/deleted, cache is cleared

```typescript
// On student create/delete
await redis.del("admin:stats");
```

---

## 🐳 Docker Setup

### Services

| Container           | Image          | Port | Purpose             |
| ------------------- | -------------- | ---- | ------------------- |
| `rural-portal-app`  | Node 20 Alpine | 3000 | Next.js application |
| `rural-postgres-db` | PostgreSQL 15  | 5432 | Primary database    |
| `rural-redis-cache` | Redis 7        | 6379 | Response cache      |

### Networking

All services communicate via `rural_network` bridge:

- App → DB: `postgres://postgres:password@db:5432/rural_school_db`
- App → Redis: `redis://redis:6379`

### Commands

```bash
# Start all services
docker-compose up --build

# View logs
docker-compose logs -f app

# Stop and clean up
docker-compose down -v
```

---

## ✅ Code Quality

### Tools Configured

| Tool            | Purpose                                           |
| --------------- | ------------------------------------------------- |
| **TypeScript**  | Strict mode enabled, no implicit any              |
| **ESLint**      | Next.js recommended + Core Web Vitals             |
| **Prettier**    | Consistent formatting (double quotes, semicolons) |
| **Husky**       | Pre-commit hooks block bad code                   |
| **lint-staged** | Only lint changed files                           |

### Pre-commit Workflow

```
git commit → Husky triggers → lint-staged runs → ESLint + Prettier → Commit succeeds/fails
```

---

## 📄 License

This project is for educational purposes as part of a college course demonstration.

---

## 👥 Contributors

- Built with ❤️ for rural education
