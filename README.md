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
Insert Screenshot of your `npm run build` terminal output here

## Reflection
If this app scaled to 10x users, I would move the **Teacher Dashboard** from pure SSR to Client-Side Fetching (SWR/TanStack Query) or aggressive caching to prevent the server from crashing under load.

# Concept 3: Cloud Deployments & Docker

## 1. Containerization (Docker)
I Dockerized the Rural School Portal to ensure it runs consistently across any environment.
* **Optimization:** Used a "Multi-Stage Build" in the Dockerfile to reduce the final image size.
* **Security:** Ran the container as a non-root user (`nextjs`) to prevent vulnerability escalation.

## 2. CI/CD Pipeline (GitHub Actions)
I set up an automated pipeline that triggers on every push.
* **Steps:** It installs dependencies, lints the code for errors, builds the Next.js app, and verifies the Docker build.
* **Benefit:** This prevents broken code from ever reaching the "production" branch.

## 3. Cloud Deployment Strategy (AWS)
*Architecture Plan:*
For a production deployment to AWS, I would use **AWS App Runner** or **ECS (Elastic Container Service)**.
1.  **Registry:** Push the Docker image to AWS ECR (Elastic Container Registry).
2.  **Service:** Connect App Runner to ECR.
3.  **Automation:** Update the GitHub Action to push the new image to AWS automatically on a successful build.

## Evidence
[Insert Screenshot of your Terminal running the Docker Container]
[Insert Screenshot of the "Green" GitHub Actions run]
