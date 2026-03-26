# Frontend Handoff For Timetable Backend (React)

## 1) Project Context
This backend provides REST APIs for department timetable management across:
- Branches: CSE, IT, AI
- Years: 2, 3, 4
- Class sections: Branch + Year
- Timetable with THEORY and LAB entries

Frontend goal:
- Manage master data (teachers, subjects, classes, rooms, labs)
- Manage subject mappings (teacher-subject and class-subject)
- Create/update/delete timetable entries
- Render class timetable matrix and occupancy views

## 2) Backend Base URL
- Local default: http://localhost:3000
- Health check: GET /health

## 3) Auth And Security
- No authentication is currently implemented.
- All endpoints are public in current version.

## 4) Global Error Shape
All API errors return:

{
  "error": "ERROR_CODE",
  "message": "Human readable message"
}

Important status codes:
- 400: Validation error
- 404: Resource not found
- 409: Conflict (teacher/room/lab/class slot, duplicate assignment)
- 422: Business rule violation (prerequisite mappings missing)
- 500: Internal server error

Frontend handling recommendation:
- Show message directly from response.message
- Treat 409 and 422 as expected business outcomes, not crash errors

## 5) Domain Rules Frontend Must Respect
- Days: 1 to 6 (Mon to Sat)
- THEORY slots: 1 to 6 (single slot)
- LAB always spans slots 5 and 6
- LAB request must include exactly 3 groups: A1, A2, A3
- Before timetable create:
  - Subject must be assigned to class
  - Teacher must be assigned to subject

## 6) Endpoint Inventory

### Teachers
- GET /api/teachers
- GET /api/teachers/:id
- POST /api/teachers
- PUT /api/teachers/:id
- DELETE /api/teachers/:id
- POST /api/teachers/:id/subjects
- DELETE /api/teachers/:id/subjects/:subjectId
- GET /api/teachers/:id/subjects
- GET /api/teachers/:id/schedule

### Subjects
- GET /api/subjects
- GET /api/subjects/:id
- POST /api/subjects
- PUT /api/subjects/:id
- DELETE /api/subjects/:id

### Classes
- GET /api/classes
- GET /api/classes/:id
- POST /api/classes
- PUT /api/classes/:id
- DELETE /api/classes/:id
- POST /api/classes/:id/subjects
- DELETE /api/classes/:id/subjects/:subjectId
- GET /api/classes/:id/subjects

### Rooms
- GET /api/rooms
- POST /api/rooms
- PUT /api/rooms/:id
- DELETE /api/rooms/:id

### Labs
- GET /api/labs
- POST /api/labs
- PUT /api/labs/:id
- DELETE /api/labs/:id

### Timetable
- GET /api/timetable/:classSectionId
- POST /api/timetable/entry
- PUT /api/timetable/entry/:id
- DELETE /api/timetable/entry/:id
- GET /api/timetable/teacher/:teacherId
- GET /api/timetable/room/:roomId

## 7) Core Request Examples

### Create THEORY entry
POST /api/timetable/entry

{
  "classSectionId": 1,
  "day": 2,
  "slotStart": 2,
  "entryType": "THEORY",
  "subjectId": 7,
  "teacherId": 3,
  "roomId": 6
}

### Create LAB entry
POST /api/timetable/entry

{
  "classSectionId": 2,
  "day": 5,
  "entryType": "LAB",
  "subjectId": 18,
  "labGroups": [
    { "groupName": "A1", "labId": 1, "teacherId": 1 },
    { "groupName": "A2", "labId": 2, "teacherId": 2 },
    { "groupName": "A3", "labId": 3, "teacherId": 5 }
  ]
}

## 8) Timetable Matrix Response Notes
GET /api/timetable/:classSectionId returns a computed matrix object.
- This matrix is generated on demand from database rows.
- It is not separately stored in database.
- LAB in slot 5 includes grouped details.
- Slot 6 for lab appears as LAB_CONTINUATION.

## 9) Suggested Frontend Screens
1. Dashboard
- Summary cards (teachers, subjects, classes, entries)

2. Master Data
- Teachers CRUD
- Subjects CRUD
- Rooms CRUD
- Labs CRUD
- Classes CRUD

3. Assignment Management
- Assign/remove subjects to teachers
- Assign/remove subjects to classes

4. Timetable Builder
- Class selector (branch + year)
- Day and slot controls
- THEORY/LAB form switch
- Conflict and prerequisite feedback (409/422)

5. Timetable View
- Render 6x6 class matrix
- Teacher schedule view
- Room occupancy view

## 10) React Integration Recommendations
- Use React Query (or TanStack Query) for server state
- Keep one API client wrapper with typed methods
- Centralize error mapping:
  - 409 => show conflict banner
  - 422 => show prerequisite action hint
- Use optimistic updates only for simple CRUD; avoid for timetable create/update due to conflict checks

## 11) Minimal Frontend Types (Suggested)
- SubjectType = THEORY | LAB
- EntryType = THEORY | LAB
- LabGroupName = A1 | A2 | A3
- TimetableCell = null | THEORY cell | LAB cell | LAB_CONTINUATION cell

## 12) Recommended User Flows
1. Admin creates subjects and teachers
2. Admin maps teacher-subject
3. Admin maps class-subject
4. Admin creates timetable entries
5. Admin resolves any conflicts shown by backend
6. Users view matrix/schedules

## 13) Existing Test Assets
- postman/timetable-happy-path.postman_collection.json
- postman/timetable-conflict-tests.postman_collection.json
- DATA_OVERVIEW.md for current seeded/populated data snapshot

## 14) Data Assumptions To Confirm
- No auth in current release
- No pagination on list endpoints
- No soft-delete behavior
- Dates/times are slot-driven, not timestamp-driven

## 15) Notes For Frontend Engineer
- Always fetch current teacher-subject and class-subject mappings before timetable form submission.
- For LAB form, lock slot selection in UI to 5 and 6.
- For class matrix UI, display a merged visual block for LAB across slots 5 and 6.
