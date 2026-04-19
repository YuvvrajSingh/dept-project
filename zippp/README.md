# timetable-ai-service

Backend-only microservice for AI exam operations.

## Technical Integration Doc

For backend integration and LLM context mapping, see TECHNICAL_INTEGRATION_SPEC.md.
For machine-readable contract ingestion, see INTEGRATION_CONTRACT.json.

## What This Service Does

- Acts as a backend API for timetable AI operations.
- Reads and writes both AI exam workflow data and core auth/profile data from a single department_timetable MongoDB database.
- Runs AI-heavy operations locally in-process for single-machine mode, or proxies to an upstream AI FastAPI service when configured.

## Request Flow

- timetable-light frontend calls time-table-backend.
- time-table-backend calls this service for AI endpoints.
- In local mode, this service processes uploads/grading itself.
- In proxy mode, this service forwards AI-heavy endpoints to AI_FASTAPI_BASE_URL.

## Data Sources

- department_timetable database:
  - exams, questions, submission_queue, student_results, objections
  - User, Teacher, Student, ClassSection, Branch

## 1) Prerequisites On New Machine

Install:

- Python 3.12+

Also required:

- Network access to the MongoDB cluster hosting department_timetable
- Network access from this machine to AI worker URL on port 8000

## 2) Copy Project

Clone or copy this folder to the new machine.

## 3) Configure Environment

Create a .env file in project root (or copy from .env.example).

Required variables:

- DATABASE_URL
- GRADEAI_SHARED_SECRET

Optional variables:

- TIMETABLE_DB_NAME (default inferred from DATABASE_URL)
- AI_FASTAPI_BASE_URL (required only in proxy mode)
- AI_PROXY_TIMEOUT_SECONDS (default 300)
- AI_LOCAL_MODE (default auto; true forces local in-process grading)
- AI_EXECUTION_DEVICE (default cpu, status visibility only)
- PORT (default 8000)
- CORS_ALLOW_ORIGINS (default *)

Example (replace placeholders):

```env
DATABASE_URL=mongodb+srv://<tt-user>:<tt-password>@<tt-cluster>/department_timetable?retryWrites=true&w=majority
TIMETABLE_DB_NAME=department_timetable

AI_FASTAPI_BASE_URL=http://<ai-worker-ip>:8000
AI_PROXY_TIMEOUT_SECONDS=300
AI_LOCAL_MODE=auto
AI_EXECUTION_DEVICE=cpu

PORT=8000
CORS_ALLOW_ORIGINS=*
GRADEAI_SHARED_SECRET=replace-with-a-long-random-secret
```

Important:

- For single-machine setup (no separate worker), set AI_LOCAL_MODE=true.
- Use AI_FASTAPI_BASE_URL only when forwarding to a separate upstream AI worker.

## 4) Run With Python venv

Windows PowerShell:

```powershell
python -m venv .venv
.\.venv\Scripts\Activate.ps1
python -m pip install --upgrade pip
pip install -r requirements.txt
python api.py
```

macOS/Linux:

```bash
python3 -m venv .venv
source .venv/bin/activate
python -m pip install --upgrade pip
pip install -r requirements.txt
python api.py
```

Alternative run command:

```bash
uvicorn api:app --host 0.0.0.0 --port 8000
```

Windows stability note (important):

- On Windows + newer Python versions, running uvicorn with `--reload` or multiple workers can switch to SelectorEventLoop in subprocess mode and crash with `ValueError: too many file descriptors in select()`.
- Use `python api.py` (recommended) or uvicorn without reload/workers.
- If you need auto-reload locally, keep watched scope very small and avoid watching `.venv`, `uploads`, and large folders.

## 5) Verify Service

Health endpoint:

- GET http://127.0.0.1:8000/healthz

PowerShell example:

```powershell
$response = Invoke-WebRequest -UseBasicParsing -Uri "http://127.0.0.1:8000/healthz"
Write-Output $response.StatusCode
Write-Output $response.Content
```

Expected:

- Status code 200
- JSON includes ok true

## 6) AI Proxy Endpoints

These are forwarded to AI_FASTAPI_BASE_URL:

- POST /api/student/upload
- POST /api/admin/trigger-grading
- POST /api/teacher/process-pending/{exam_id}

In local mode (AI_LOCAL_MODE=true or auto+self URL), the same endpoints run grading in-process and are not forwarded.

Student upload requirement:

- Single scanned-sheet uploads are no longer supported.
- Uploads must be question-wise multipart fields using keys like q_1, q_2, ...

## 7) Auth And Profile Behavior

- Teacher login/auth uses department_timetable User plus Teacher records.
- Student lookups use Student plus ClassSection and Branch mapping.
- Teacher registration endpoint in this service is disabled; registration belongs to timetable backend.

## 8) Common Issues

Missing env var at startup:

- Error: Missing required environment variable DATABASE_URL
- Fix: ensure .env exists in root and has correct values

Port 8000 already in use:

- Stop the process using port 8000 and restart the app.

AI proxy failures (502/503):

- 503 means AI_FASTAPI_BASE_URL is empty
- 502 means URL is set but unreachable from this machine
- Verify firewall and that upstream AI FastAPI is running

Mongo auth/network errors:

- Check username/password in URIs
- Check IP allow-list/network access in MongoDB Atlas

## 9) Local-Only Note

Docker support has been removed from this repository for now.
Run this service locally with Python venv until you decide to add Docker again.
