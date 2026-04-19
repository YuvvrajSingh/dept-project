# Dept Project - Run All Three Services on a New Machine

This repo has three apps that must run together:

- `time-table-backend` (Node/Express/Prisma API, port `3001`)
- `timetable-light` (Next.js frontend, port `3000`)
- `zippp` (FastAPI GradeAI service, port `8000`)

## 1. Prerequisites

Install:

- Git
- Node.js 20+
- npm 10+
- Python 3.12+

Also required:

- Access to your MongoDB Atlas database (`department_timetable`)

## 2. Clone the repo

```bash
git clone <your-repo-url>
cd dept-project
```

## 3. Configure environment files

Create these files from examples and fill real values:

- `time-table-backend/.env`
- `timetable-light/.env.local`
- `zippp/.env`

### 3.1 Backend env (`time-table-backend/.env`)

Minimum:

```env
DATABASE_URL=mongodb+srv://<user>:<password>@<cluster>/department_timetable?retryWrites=true&w=majority
PORT=3001
JWT_SECRET=<same-secret-used-in-frontend>
JWT_EXPIRES_IN=7d
GRADEAI_API_URL=http://127.0.0.1:8000
GRADEAI_SHARED_SECRET=<same-secret-used-in-zippp>
ADMIN_EMAIL=admin@dept.local
ADMIN_PASSWORD=changeme
```

### 3.2 Frontend env (`timetable-light/.env.local`)

```env
API_BACKEND_URL=http://127.0.0.1:3001
JWT_SECRET=<same-secret-used-in-backend>
```

### 3.3 Zippp env (`zippp/.env`)

Minimum:

```env
DATABASE_URL=mongodb+srv://<user>:<password>@<cluster>/department_timetable?retryWrites=true&w=majority
TIMETABLE_DB_NAME=department_timetable
PORT=8000
AI_LOCAL_MODE=true
GRADEAI_SHARED_SECRET=<same-secret-used-in-backend>
CORS_ALLOW_ORIGINS=*
```

## 4. Install dependencies

### 4.1 Backend

```bash
cd time-table-backend
npm install
npm run db:push
npm run db:seed
cd ..
```

### 4.2 Frontend

```bash
cd timetable-light
npm install
cd ..
```

### 4.3 Zippp

Windows PowerShell:

```powershell
cd zippp
python -m venv .venv
.\.venv\Scripts\Activate.ps1
python -m pip install --upgrade pip
pip install -r requirements.txt
cd ..
```

macOS/Linux:

```bash
cd zippp
python3 -m venv .venv
source .venv/bin/activate
python -m pip install --upgrade pip
pip install -r requirements.txt
cd ..
```

## 5. Run all three (use 3 terminals)

### Terminal A - zippp

```bash
cd zippp
python api.py
```

### Terminal B - backend

```bash
cd time-table-backend
npm run dev
```

### Terminal C - frontend

```bash
cd timetable-light
npm run dev
```

## 6. Verify health

- Frontend: `http://localhost:3000`
- Backend health: `http://localhost:3001/health`
- Zippp health: `http://127.0.0.1:8000/healthz`

## 7. Common mistakes

- `JWT_SECRET` mismatch between backend and frontend causes auth/session issues.
- `GRADEAI_SHARED_SECRET` mismatch between backend and zippp causes GradeAI proxy auth failures.
- If backend starts but API calls fail, confirm `API_BACKEND_URL` in `timetable-light/.env.local` is `http://127.0.0.1:3001`.
- On Windows, prefer `python api.py` for zippp instead of uvicorn reload mode.
