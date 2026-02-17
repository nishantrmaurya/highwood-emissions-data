# Highwood Emissions Data Platform

Full-stack emissions ingestion and analytics application built with:

- Backend: Node.js + Express + Prisma + PostgreSQL + Socket.IO
- Frontend: Next.js (App Router) + React + TypeScript

## Repository Structure

- `backend/`: API server, Prisma schema/migrations, seed script
- `frontend/`: dashboard UI and Next.js API proxy routes
- `docker-compose.yml`: local infrastructure and app containers

## Prerequisites

- Node.js 22+
- npm 10+
- Docker + Docker Compose

## Quick Start (Docker, Recommended)

This path starts Postgres, backend, and frontend. Backend startup also runs Prisma generate + migrations automatically.

```bash
docker compose up --build
```

App URLs:

- Frontend: `http://localhost:4200`
- Backend health: `http://localhost:3000/health`

Optional tools profile (pgAdmin):

```bash
docker compose --profile tools up -d
```

## Local Development (Without Running App Containers)

### 1. Start infrastructure (Postgres)

```bash
docker compose up -d postgres
```

### 2. Backend setup

```bash
cd backend
npm ci
npm run prisma:generate
npm run prisma:migrate:deploy
npm run prisma:seed
npm run dev
```

Notes:

- Backend runs on `http://localhost:3000`.
- Environment is loaded from `backend/src/config/env/.env.dev` when `NODE_ENV=dev` (set by `npm run dev`).

### 3. Frontend setup

In another terminal:

```bash
cd frontend
npm ci
npm run dev
```

Frontend runs on `http://localhost:4200` and proxies requests to backend using `BACKEND_API_URL` (defaults to `http://localhost:3000`).

## Database Migrations

Run from `backend/`:

```bash
# Generate Prisma client
npm run prisma:generate

# Apply pending migrations locally
npm run prisma:migrate:deploy

# Create and apply a new dev migration
npm run prisma:migrate:dev

# Check migration status
npm run prisma:migrate:status

# Reset DB and reapply migrations (destructive)
npm run prisma:migrate:reset
```

Seed data:

```bash
npm run prisma:seed
```

## Tests and Quality Checks

Run from each package directory.

### Backend

```bash
cd backend
npm test
```

Current status: backend `test` script is a placeholder and exits with failure (`"Error: no test specified"`). No automated backend test suite is implemented yet.

### Frontend

```bash
cd frontend
npm run lint
```

## Common Commands

```bash
# Stop all docker services
docker compose down

# Stop services and remove volumes (clears Postgres data)
docker compose down -v
```

## Architecture Notes

See `ARCHITECTURE.md` for technical decisions, data flow, and trade-offs.
