# Timetable Light (Frontend)

![Next.js](https://img.shields.io/badge/next.js-16.x-000000?logo=next.js&logoColor=white)
![React](https://img.shields.io/badge/react-19.x-149ECA?logo=react&logoColor=white)
![TypeScript](https://img.shields.io/badge/typescript-5.x-3178C6?logo=typescript&logoColor=white)
![Status](https://img.shields.io/badge/status-active--dev-1f883d)

This is the UI layer for the department timetable system. It gives admins a full scheduling cockpit, gives teachers a focused personal portal, and exposes a public timetable page for students/mobile viewing.

## What this frontend solves

- One interface for three audiences: admin, teacher, public viewer.
- Visual timetable construction with conflict-aware backend validation.
- Session-based role routing (admins and teachers see only what they should).
- Real-time dashboard metrics and occupancy heatmaps.
- Public sharing and printable timetable exports.

## Core experience

### Admin

- Login and session shell
- Dashboard analytics (`/dashboard`)
- Master data CRUD (`/master-data`)
- Assignment mapping (`/assignments`)
- Timetable builder (`/timetable-builder`)
- Timetable matrix views and PDF export (`/timetable-views`)
- Academic year controls + danger-zone operations (`/settings`)
- Teacher account management (`/dashboard/teacher-accounts`)

### Teacher

- Personal subject management (`/teacher-portal`)
- Personal schedule matrix (`/teacher-portal/timetable`)

### Public

- Open timetable viewer (`/timetable?branch=...&semester=...`)

## Tech stack

- Next.js 16 (App Router)
- React 19 + TypeScript
- Tailwind CSS 4
- Recharts (dashboard charts)
- `jose` (JWT verification in middleware)

## Quick start

### 1. Install dependencies

```bash
npm install
```

### 2. Configure environment

Create `timetable-light/.env.local` from `.env.example`:

```env
API_BACKEND_URL=http://127.0.0.1:3001
# NEXT_PUBLIC_API_BASE_URL=http://127.0.0.1:3001
JWT_SECRET=change-me-to-a-long-random-string
```

Important:

- `JWT_SECRET` must match backend `JWT_SECRET`.
- `API_BACKEND_URL` must point to Express backend (not this Next app).

### 3. Start frontend

```bash
npm run dev
```

App runs on `http://localhost:3000`.

## Scripts

```bash
npm run dev    # Start dev server
npm run build  # Production build
npm run start  # Start production server
npm run lint   # ESLint
```

## How backend integration works

The app uses Next rewrites so browser calls stay same-origin:

- `/api/*` -> `${API_BACKEND_URL}/api/*`

This keeps cookie auth simple (`credentials: include`) while forwarding API calls to backend.

Server-side data fetching can also hit backend directly using `API_BACKEND_URL`.

## Auth and route protection

Middleware verifies `tt_session` JWT and enforces route access by role.

Protected admin areas:

- `/dashboard`
- `/master-data`
- `/timetable-builder`
- `/timetable-views`
- `/settings`
- `/assignments`

Protected teacher area:

- `/teacher-portal`

Behavior:

- Unauthenticated users -> redirected to `/login`.
- Teacher trying admin routes -> redirected to `/teacher-portal`.
- Admin trying teacher portal -> redirected to `/dashboard`.

## Routes at a glance

| Route | Audience | Purpose |
|---|---|---|
| `/login` | Public | Sign in |
| `/dashboard` | Admin | Metrics and operations overview |
| `/master-data` | Admin | Teachers/subjects/rooms/labs/classes CRUD |
| `/assignments` | Admin | Teacher-subject and class-subject mapping |
| `/timetable-builder` | Admin | Build/generate/edit class timetables |
| `/timetable-views` | Admin | View by class/teacher/room + export |
| `/settings` | Admin | Academic years, clear/reset operations |
| `/dashboard/teacher-accounts` | Admin | Create/deactivate teacher login accounts |
| `/teacher-portal` | Teacher | My subjects |
| `/teacher-portal/timetable` | Teacher | My timetable |
| `/timetable` | Public | Public class timetable viewer |

## Example API interaction from UI

Login request from `login-form.tsx`:

```ts
await fetch("/api/auth/login", {
	method: "POST",
	headers: { "Content-Type": "application/json" },
	credentials: "include",
	body: JSON.stringify({ email, password }),
});
```

Timetable matrix fetch:

```ts
const matrix = await timetableApi.getMatrix(classSectionId);
```

## Known friction points and fixes

1. Redirect loop on protected pages.
- Cause: `JWT_SECRET` mismatch between frontend and backend.
- Fix: set same value in both env files.

2. API calls fail with 404/connection errors.
- Cause: wrong `API_BACKEND_URL`.
- Fix: point it to backend, usually `http://127.0.0.1:3001`.

3. Login appears successful but pages still unauthorized.
- Cause: cookies not included.
- Fix: keep `credentials: "include"` on auth/data requests.

4. Phone access works for frontend but data does not load.
- Cause: backend not reachable from same network/tunnel context.
- Fix: ensure backend is running and reachable from the frontend host environment.

## Related docs

- Root full-stack guide: `../README.md`
- Backend API/service docs: `../time-table-backend/README.md`

## License

Project-internal/academic use unless defined otherwise by repository owner.
