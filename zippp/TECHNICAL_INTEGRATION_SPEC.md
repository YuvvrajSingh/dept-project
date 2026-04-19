# Technical Integration Spec - timetable-ai-service

## 1. Purpose

This document is the integration contract for:

1. Backend-to-backend connectivity (time-table-backend -> timetable-ai-service).
2. LLM or agent context discovery (what this microservice does, what data it owns, and how to call it).

## 2. Service Identity

- Service name: timetable-ai-service
- Runtime: FastAPI
- Default port: 8000
- Base URL (local): http://127.0.0.1:8000
- Health endpoint: GET /healthz
- OpenAPI docs: /docs

## 3. Architecture and Ownership

This service has two responsibilities:

1. AI exam workflow API for teachers and students.
2. AI execution layer that can run locally in-process or proxy to external AI FastAPI (CPU or GPU).

This service uses one MongoDB database:

1. department_timetable (AI workflow data + auth and identity source of truth)

## 4. Environment Variables

Required:

1. DATABASE_URL
2. GRADEAI_SHARED_SECRET

Optional:

1. TIMETABLE_DB_NAME (default inferred from DATABASE_URL)
2. AI_FASTAPI_BASE_URL (required only when not using local mode)
3. AI_PROXY_TIMEOUT_SECONDS (default: 300)
4. AI_LOCAL_MODE (default: auto)
5. AI_EXECUTION_DEVICE (default: cpu, status visibility only)
6. PORT (default: 8000)
7. CORS_ALLOW_ORIGINS (default: *)

Important:

1. For single-machine deployment, set AI_LOCAL_MODE=true.
2. AI_FASTAPI_BASE_URL is only needed when forwarding to a separate upstream AI service.

## 5. Authentication Contract

Teacher auth source:

1. department_timetable.User (email, passwordHash, role, isActive)
2. department_timetable.Teacher (name, abbreviation, optional link by teacherId)

Password behavior:

1. Supports bcrypt hashes (primary)
2. Supports legacy SHA256 comparison fallback for older records

Role behavior:

1. Allowed roles: teacher or admin
2. Other roles receive HTTP 403

Credential transport:

1. Teacher endpoints use teacher_name/name and password via form fields or query params depending on endpoint.

## 6. Request/Response Basics

1. Form endpoints require multipart/form-data (FastAPI Form).
2. JSON endpoints require application/json.
3. Most errors use HTTPException with proper status codes.
4. Some student verification failures return HTTP 200 with an error field in body.

## 7. Endpoint Catalog

| Method | Path | Auth | Input Type | Purpose |
|---|---|---|---|---|
| GET | /healthz | No | Query none | Service + DB ping status |
| GET | /api/proxy/status | No | Query none | AI proxy configuration visibility |
| GET | /options | No | Query none | Branch/year options |
| POST | /api/teacher/register | N/A | Form none | Disabled, returns 405 |
| POST | /api/teacher/login | Teacher | Form | Teacher login |
| POST | /api/teacher/change-password | Teacher | Form | Change teacher password |
| POST | /api/teacher/delete-account | Teacher | Form | Deactivate teacher account |
| GET | /api/config/session | No | Query none | Get academic session |
| POST | /api/config/session | Teacher | Form | Update academic session |
| POST | /api/teacher/create-exam | Teacher | Form | Create exam |
| POST | /api/teacher/add-question | Teacher | Multipart form | Add or update exam question |
| GET | /api/teacher/get_attendance/{exam_id} | Teacher | Query teacher_name,password | Get eligible students for exam |
| GET | /api/teacher/get_submissions/{exam_id} | Teacher | Query teacher_name,password | Get submitted roll numbers |
| GET | /api/teacher/my-exams | Teacher | Query teacher_name,password | List teacher exams and counts |
| POST | /api/teacher/publish-results/{exam_id} | Teacher | Form | Publish results |
| POST | /api/teacher/toggle-exam-status/{exam_id} | Teacher | Form | Activate/deactivate exam |
| DELETE | /api/teacher/delete-exam/{exam_id} | Teacher | Query teacher_name,password | Delete exam and related records |
| GET | /api/teacher/objections/{exam_id} | Teacher | Query teacher_name,password | Get objections |
| POST | /api/teacher/resolve-objection | Teacher | Form | Resolve objection and optional regrade |
| GET | /api/teacher/grading_progress/{exam_id} | Teacher | Query teacher_name,password | Queue grading progress |
| GET | /api/teacher/get-results/{exam_id} | Teacher | Query teacher_name,password | Aggregated results and analytics |
| GET | /api/teacher/get-student-details/{exam_id}/{roll_number} | Teacher | Query teacher_name,password | Per-question result detail |
| GET | /api/teacher/export-results-csv/{exam_id} | Teacher | Query teacher_name,password | CSV export |
| POST | /api/teacher/process-pending/{exam_id} | Teacher | Form | Run local grading or proxy to AI grading worker |
| GET | /api/student/active-exams/{roll_number} | Student | Path | Get active exams for student profile |
| POST | /api/student/verify | Student | JSON | Verify student eligibility for exam |
| POST | /api/student/upload | Student | Multipart form | In local mode: queue and grade in-process; in proxy mode: forward to AI service |
| GET | /api/student/results/{exam_id}/{roll_number} | Student | Path | Get published student results |
| POST | /api/admin/trigger-grading | Admin | Form | Trigger local grading or proxy trigger |

## 8. Critical Payload Schemas

### 8.1 Teacher Login

Path: POST /api/teacher/login
Content-Type: multipart/form-data

Fields:

1. name: string
2. password: string

Success body:

1. message: string
2. teacher_name: string
3. assigned_subjects: object with Odd and Even arrays

### 8.2 Create Exam

Path: POST /api/teacher/create-exam
Content-Type: multipart/form-data

Fields:

1. teacher_name: string
2. password: string
3. year: one of 1st Year, 2nd Year, 3rd Year, 4th Year
4. branch: one of CSE, IT, ADS
5. subject: string
6. semester: string
7. exam_type: string

### 8.3 Add Question

Path: POST /api/teacher/add-question
Content-Type: multipart/form-data

Fields:

1. exam_id: int
2. teacher_name: string
3. password: string
4. question_number: int
5. question_text: string
6. model_answer: string
7. total_marks: int
8. diagram_image: file optional
9. diagram_url: string optional

### 8.4 Student Verify

Path: POST /api/student/verify
Content-Type: application/json

Body:

{
  "exam_id": 101,
  "roll_number": "23UCSE3001"
}

Notes:

1. Failure cases may return HTTP 200 with body containing error.
2. Success includes exam metadata and has_submitted flag.

### 8.5 Student Upload (Proxied, Question-Wise Only)

Path: POST /api/student/upload
Content-Type: multipart/form-data

Fields:

1. exam_id: int
2. roll_number: string
3. student_name: string (required unless profile lookup succeeds)
4. year: string (required unless profile lookup succeeds)
5. branch: string (required unless profile lookup succeeds)
6. email: string optional
7. q_<number>: file(s) for each question slot (image/pdf), e.g. q_1, q_2

Notes:

1. Single scanned-sheet upload is not supported.
2. JSON upload format with questions[].images_base64 remains backward-compatible for legacy callers.

### 8.6 Trigger Grading (Proxied)

Path: POST /api/admin/trigger-grading
Content-Type: multipart/form-data

Fields:

1. exam_id: int

## 9. AI Proxy Behavior

Runtime mode selection:

1. `AI_LOCAL_MODE=true` -> always local in-process grading
2. `AI_LOCAL_MODE=false` -> always proxy mode
3. `AI_LOCAL_MODE=auto` -> local mode when upstream is unset or self URL, otherwise proxy mode

Proxied endpoints:

1. POST /api/student/upload -> AI /api/student/upload
2. POST /api/admin/trigger-grading -> AI /api/admin/trigger-grading
3. POST /api/teacher/process-pending/{exam_id} -> AI same path

Proxy error behavior:

1. Missing AI_FASTAPI_BASE_URL -> HTTP 503
2. Upstream network/request failure -> HTTP 502
3. JSON responses are passed as JSON
4. Non-JSON responses are returned with upstream content-type

## 10. Data Model Summary

AI workflow collections used (inside department_timetable):

1. config
2. counters
3. teachers
4. exams
5. questions
6. submission_queue
7. student_results
8. objections

Core timetable collections used:

1. User
2. Teacher
3. Student
4. ClassSection
5. Branch

## 11. Integration Sequences

### 11.1 Teacher Flow

1. Login
2. Create exam
3. Add questions
4. Fetch attendance list
5. Monitor submissions and grading progress
6. Publish results

### 11.2 Student Flow

1. Get active exams
2. Verify eligibility for exam
3. Upload answer sheets (proxied)
4. Fetch results after publish

### 11.3 Admin/AI Flow

1. Trigger grading (proxied)
2. Optional process pending by exam (proxied)

## 12. LLM Context Block

Use this section as a compact system context for agents:

1. Domain: academic exam grading workflow
2. Auth source: department_timetable User and Teacher
3. Student identity source: department_timetable Student with ClassSection and Branch
4. Workflow source: department_timetable AI workflow collections
5. AI heavy tasks: forwarded to upstream AI service (CPU or GPU)
6. Branch values: CSE, IT, ADS
7. Year values: 1st Year, 2nd Year, 3rd Year, 4th Year
8. Primary unique student key: roll_number (normalized uppercase)
9. Teacher auth inputs: identifier and password
10. Non-standard behavior: /api/student/verify returns error in body for some invalid states

## 13. Backend Integration Checklist

1. Configure base URL for this service.
2. Ensure backend sends form-data for teacher/auth endpoints.
3. Ensure backend sends JSON for student verify and multipart form-data for student upload.
4. Forward teacher_name and password exactly where required.
5. Handle both HTTP errors and body-level error fields for student verify.
6. Set AI_FASTAPI_BASE_URL to reachable upstream AI service host.
7. Use /healthz and /api/proxy/status for readiness and proxy diagnostics.
