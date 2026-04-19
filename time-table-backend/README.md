# Time Table Backend

![Node](https://img.shields.io/badge/node-%3E%3D20-339933?logo=node.js&logoColor=white)
![TypeScript](https://img.shields.io/badge/typescript-6.x-3178C6?logo=typescript&logoColor=white)
![Express](https://img.shields.io/badge/express-5.x-000000?logo=express&logoColor=white)
![Prisma](https://img.shields.io/badge/prisma-7.x-2D3748?logo=prisma&logoColor=white)
![Status](https://img.shields.io/badge/status-active--dev-1f883d)

This service powers a conflict-aware academic timetable system for department admins, teachers, and public viewers. It solves the hard part of scheduling: validating teacher/room/lab conflicts, enforcing assignment rules, managing academic years, and generating class timetables with an auto-scheduler.

## What this backend solves

- Centralized timetable data model (classes, subjects, teachers, rooms, labs, entries).
- Role-based access control (ADMIN and TEACHER).
- Strict conflict checks before every write.
- Public read-only routes for timetable viewing.
- Auto-generation of class timetables with audit output.
- PDF export of class timetable views.

## Tech stack

- Node.js + TypeScript
- Express 5
- Prisma + MongoDB
- JWT auth in HTTP-only cookie
- Zod for request validation
- Puppeteer for PDF export

## Quick start

### 1. Install dependencies

```bash
npm install
```

### 2. Configure environment

Create `time-table-backend/.env` from `.env.example` and fill values:

```env
DATABASE_URL="mongodb+srv://<user>:<password>@<cluster-host>/department_timetable?retryWrites=true&w=majority"
PORT=3001
JWT_SECRET=change-me-to-a-long-random-string
JWT_EXPIRES_IN=7d
GRADEAI_API_URL=http://127.0.0.1:8000
GRADEAI_SHARED_SECRET=replace-with-a-long-random-secret
ADMIN_EMAIL=admin@dept.local
ADMIN_PASSWORD=changeme
# CORS_ORIGIN=http://localhost:3000
```

### 3. Sync schema and seed

```bash
npm run db:push
npm run db:seed
```

### 4. Start development server

```bash
npm run dev
```

API starts on `http://localhost:3001`.

## Scripts

```bash
npm run dev           # Start backend in dev mode (tsx)
npm run build         # Compile TypeScript -> dist/
npm run start         # Run compiled server
npm run db:push       # Prisma db push (MongoDB)
npm run db:migrate    # Alias to db:push
npm run db:seed       # Seed demo data
npm run data:overview # Generate DATA_OVERVIEW.md
npm run data:populate # Populate extended academic dataset
```

## Environment variables

| Variable | Required | Default | Notes |
|---|---:|---|---|
| `DATABASE_URL` | Yes | - | MongoDB connection string |
| `PORT` | No | `3001` | Express port |
| `JWT_SECRET` | Yes | - | Must match frontend `JWT_SECRET` |
| `JWT_EXPIRES_IN` | No | `7d` | Session cookie/token expiry |
| `GRADEAI_API_URL` | Yes | - | URL of zippp/timetable-ai-service |
| `GRADEAI_SHARED_SECRET` | Yes | - | Shared secret matching zippp service |
| `CORS_ORIGIN` | No | localhost defaults | Comma-separated allowed origins |
| `ADMIN_EMAIL` | No | `admin@dept.local` | Used only during seed |
| `ADMIN_PASSWORD` | No | `changeme` | Used only during seed |

## Auth model

- Session cookie name: `tt_session`
- Cookie is `httpOnly`, `sameSite=lax`, `secure` in production.
- `POST /api/auth/login` issues cookie.
- `POST /api/auth/logout` clears cookie.
- `GET /api/auth/me` resolves current authenticated user.

Role guards:

- `requireAdmin`: admin-only routes.
- `requireTeacherSelf`: teacher can access only own record.
- `requireAdminOrTeacherSelf`: admin or matching teacher.

## API surface

### Public routes (no login)

- `GET /health`
- `GET /api/public/active-year`
- `GET /api/public/classes?academicYearId=...`
- `GET /api/public/timetable/:classSectionId`

### Auth routes

- `POST /api/auth/login`
- `POST /api/auth/logout`
- `GET /api/auth/me`

### Protected resource routes

- `/api/academic-years`
- `/api/users`
- `/api/teachers`
- `/api/subjects`
- `/api/classes`
- `/api/rooms`
- `/api/labs`
- `/api/timetable`
- `/api/timetable/occupancy`
- `/api/dashboard/metrics`

For request-level validation details, see route files in `src/routes/`.

## Request examples

### Login

```bash
curl -i -X POST http://localhost:3001/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{"email":"admin@dept.local","password":"changeme"}'
```

### Create lecture entry (admin)

```bash
curl -X POST http://localhost:3001/api/timetable/entry \
  -H "Content-Type: application/json" \
  -H "Cookie: tt_session=<session-cookie>" \
  -d '{
    "classSectionId": 1,
    "day": 1,
    "slotStart": 1,
    "entryType": "LECTURE",
    "subjectId": 1,
    "teacherId": 1,
    "roomId": 1
  }'
```

### Auto-generate class timetable (admin)

```bash
curl -X POST http://localhost:3001/api/timetable/1/generate \
  -H "Cookie: tt_session=<session-cookie>"
```

Returns `auditReport` with warnings/success details.

## Scheduling and conflict rules

Core constraints:

- One class cannot have two entries in same day+slot.
- Teacher conflicts are blocked in same academic year scope.
- Room conflicts are blocked in same academic year scope.
- Lab entries occupy two consecutive slots.
- Lab group entries validate unique groups from `A1`, `A2`, `A3`.
- Subject must be assigned to class (`ClassSubject`).
- Teacher must be assigned to subject (`TeacherSubject`).

Auto-scheduler behavior:

- Greedy two-pass strategy (strict then relaxed).
- Initializes occupancy from all other class entries.
- Places labs and theory using available teachers/rooms/labs.
- Replaces target class timetable atomically in a transaction.

Detailed design docs: `docs/algo/`.

## Known friction points and workarounds

1. `JWT_SECRET` mismatch between frontend/backend causes redirect loops and 401s.
- Fix: keep same secret in both apps.

2. Missing `Slot` seed data breaks timetable writes.
- Fix: run `npm run db:push` and `npm run db:seed` before creating entries.

3. `npm run db:seed` is destructive for existing data.
- Fix: use only in local/dev unless intended.

4. PDF export depends on Puppeteer/Chromium.
- Fix: ensure environment can launch headless Chromium.

5. Some endpoints are intentionally destructive (`/factory-reset`, `/clear-all`).
- Fix: never expose these without proper admin control in production.

## Project map

```text
src/
  controllers/   # HTTP handlers
  routes/        # Endpoint definitions + zod validation
  services/      # Domain logic (timetable, scheduler, auth, dashboard)
  middleware/    # auth guards, error handling, rate limit
  prisma/        # Prisma client
  utils/         # shared helpers
prisma/
  schema.prisma
  seed.ts
  migrations/
postman/
  timetable-happy-path.postman_collection.json
  timetable-conflict-tests.postman_collection.json
```

## Related docs

- `QUICK_REF.md` (rules snapshot)
- `DATA_OVERVIEW.md` (generated dataset overview)
- `docs/algo/README.md` (algorithm report index)

## License

Project-internal/academic use unless defined otherwise by repository owner.
