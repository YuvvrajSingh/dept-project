# Timetable Management System — Master Specification

> Note: This file contains legacy planning content. The active implementation uses Prisma with MongoDB.
> For setup/runtime truth, follow `README.md` and `.env.example` in this project.

## What This Project Is

A REST API backend for managing a university department's weekly timetable.
The department has 3 branches (CSE, IT, AI), each with 3 years (2nd, 3rd, 4th).
This produces 9 independent timetables (one per class section).

---

## Tech Stack

- **Runtime**: Node.js v22+ with TypeScript
- **Framework**: Express.js
- **ORM**: Prisma
- **Database**: MongoDB (via Prisma)
- **Language**: TypeScript (strict mode)

---

## Folder Structure

```
src/
├── index.ts                  ← Express app entry point
├── prisma/
│   └── schema.prisma         ← Database schema
├── routes/
│   ├── teacher.routes.ts
│   ├── subject.routes.ts
│   ├── class.routes.ts
│   ├── room.routes.ts
│   ├── lab.routes.ts
│   └── timetable.routes.ts
├── controllers/
│   ├── teacher.controller.ts
│   ├── subject.controller.ts
│   ├── class.controller.ts
│   ├── room.controller.ts
│   ├── lab.controller.ts
│   └── timetable.controller.ts
├── services/
│   ├── teacher.service.ts
│   ├── subject.service.ts
│   ├── class.service.ts
│   ├── room.service.ts
│   ├── lab.service.ts
│   └── timetable.service.ts
├── middleware/
│   └── errorHandler.ts
└── utils/
    └── timetableMatrix.ts    ← transforms DB rows into 6x6 matrix
```

---

## Domain Rules — Read These Carefully

### Branches and Classes
- 3 branches: CSE, IT, AI
- Each branch has 3 years: 2, 3, 4 (stored as integer)
- A `ClassSection` = one branch + one year (e.g. CSE Year 3)
- Total: 9 class sections

### Rooms and Labs
- 7 classrooms (for theory)
- 5 labs (for practical sessions)
- One class of students fits in one room

### Teachers
- 12 teachers in the department
- Each teacher has a name and a short abbreviation (e.g. "ABG", "SM", "PJ")
- A teacher can be assigned to multiple subjects
- A subject can be assigned to multiple teachers

### Time Slots
There are exactly 6 periods per day. ALWAYS use these slot numbers (1–6):

| Slot | Period | Start | End   |
|------|--------|-------|-------|
| 1    | I      | 10:00 | 10:55 |
| 2    | II     | 10:55 | 11:50 |
| 3    | III    | 11:50 | 12:45 |
| —    | LUNCH  | 12:45 | 14:00 | ← NOT a slot, never stored
| 4    | IV     | 14:00 | 14:55 |
| 5    | V      | 14:55 | 15:50 |
| 6    | VI     | 15:50 | 16:45 |

### Days
6 days per week: Monday=1, Tuesday=2, Wednesday=3, Thursday=4, Friday=5, Saturday=6

### Lab Sessions — Critical Rules
- Labs ALWAYS occupy TWO consecutive slots: slot 5 AND slot 6 (periods V and VI)
- A single class section (e.g. CSE Year 3) is divided into 3 lab groups: A1, A2, A3
- All 3 groups run their lab AT THE SAME TIME (same day, slot 5+6) but in DIFFERENT labs with DIFFERENT teachers
- A lab timetable entry has a parent record + 3 child `LabGroupEntry` records (one per group)
- For theory: `slot_start = slot_end` (single slot)
- For lab: `slot_start = 5`, `slot_end = 6` always

---

## Database Schema (Prisma)

```prisma
generator client {
  provider = "prisma-client-js"
}

datasource db {
  provider = "mongodb"
  url      = env("DATABASE_URL")
}

model Branch {
  id       Int            @id @default(autoincrement())
  name     String         @unique  // "CSE" | "IT" | "AI"
  sections ClassSection[]
}

model ClassSection {
  id         Int              @id @default(autoincrement())
  branchId   Int
  year       Int              // 2 | 3 | 4
  branch     Branch           @relation(fields: [branchId], references: [id])
  subjects   ClassSubject[]
  timetable  TimetableEntry[]

  @@unique([branchId, year])
}

model Subject {
  id               Int               @id @default(autoincrement())
  code             String            @unique  // e.g. "7ADS41A"
  name             String            // e.g. "Generative Artificial Intelligence"
  type             SubjectType       // THEORY | LAB
  creditHours      Int
  teacherSubjects  TeacherSubject[]
  classSubjects    ClassSubject[]
  timetableEntries TimetableEntry[]
}

enum SubjectType {
  THEORY
  LAB
}

model Teacher {
  id               Int               @id @default(autoincrement())
  name             String
  abbreviation     String            @unique  // e.g. "ABG", "SM"
  teacherSubjects  TeacherSubject[]
  timetableEntries TimetableEntry[]
  labGroupEntries  LabGroupEntry[]
}

// Many-to-many: Teacher <-> Subject
model TeacherSubject {
  id        Int     @id @default(autoincrement())
  teacherId Int
  subjectId Int
  teacher   Teacher @relation(fields: [teacherId], references: [id], onDelete: Cascade)
  subject   Subject @relation(fields: [subjectId], references: [id], onDelete: Cascade)

  @@unique([teacherId, subjectId])
}

// Many-to-many: ClassSection <-> Subject
model ClassSubject {
  id             Int          @id @default(autoincrement())
  classSectionId Int
  subjectId      Int
  classSection   ClassSection @relation(fields: [classSectionId], references: [id], onDelete: Cascade)
  subject        Subject      @relation(fields: [subjectId], references: [id], onDelete: Cascade)

  @@unique([classSectionId, subjectId])
}

model Room {
  id               Int              @id @default(autoincrement())
  name             String           @unique  // e.g. "CSE-9", "R4"
  capacity         Int              @default(60)
  timetableEntries TimetableEntry[]
}

model Lab {
  id              Int             @id @default(autoincrement())
  name            String          @unique  // e.g. "LAB-4", "LAB-5"
  capacity        Int             @default(20)
  labGroupEntries LabGroupEntry[]
}

model TimetableEntry {
  id             Int             @id @default(autoincrement())
  classSectionId Int
  day            Int             // 1–6
  slotStart      Int             // 1–6
  slotEnd        Int             // same as slotStart for THEORY; always 6 for LAB (slotStart=5, slotEnd=6)
  entryType      EntryType       // THEORY | LAB
  subjectId      Int
  // For THEORY only:
  teacherId      Int?
  roomId         Int?
  // Relations
  classSection   ClassSection    @relation(fields: [classSectionId], references: [id])
  subject        Subject         @relation(fields: [subjectId], references: [id])
  teacher        Teacher?        @relation(fields: [teacherId], references: [id])
  room           Room?           @relation(fields: [roomId], references: [id])
  labGroups      LabGroupEntry[]

  @@unique([classSectionId, day, slotStart])
}

enum EntryType {
  THEORY
  LAB
}

// For LAB entries only — one record per group (A1, A2, A3)
model LabGroupEntry {
  id               Int            @id @default(autoincrement())
  timetableEntryId Int
  groupName        String         // "A1" | "A2" | "A3"
  labId            Int
  teacherId        Int
  timetableEntry   TimetableEntry @relation(fields: [timetableEntryId], references: [id], onDelete: Cascade)
  lab              Lab            @relation(fields: [labId], references: [id])
  teacher          Teacher        @relation(fields: [teacherId], references: [id])
}
```

---

## Conflict Detection Logic

This is the most important business logic in the project. Lives in `timetable.service.ts`.

### For a THEORY entry at (day D, slot S, teacher T, room R):

```
Check 1 — Teacher conflict:
  SELECT * FROM TimetableEntry
  WHERE teacherId = T AND day = D AND slotStart = S
  → If found: throw ConflictError("Teacher {name} is already scheduled at this slot")

Check 2 — Room conflict:
  SELECT * FROM TimetableEntry
  WHERE roomId = R AND day = D AND slotStart = S
  → If found: throw ConflictError("Room {name} is already booked at this slot")
```

### For a LAB entry at (day D, groups [{A1, lab1, teacher1}, {A2, lab2, teacher2}, {A3, lab3, teacher3}]):
Lab always occupies slots 5 AND 6. Check both slots for each resource.

```
For each slot in [5, 6]:
  For each group assignment:
    Check teacher conflict:
      SELECT * FROM TimetableEntry WHERE teacherId = groupTeacher AND day = D AND slotStart = slot
      ALSO check LabGroupEntry WHERE teacherId = groupTeacher
        JOIN TimetableEntry WHERE day = D AND (slotStart = 5 OR slotStart = 6)
      → If found: throw ConflictError

    Check lab conflict:
      SELECT * FROM LabGroupEntry WHERE labId = groupLab
        JOIN TimetableEntry WHERE day = D AND (slotStart = 5 OR slotStart = 6)
      → If found: throw ConflictError
```

### Validation before conflict check (always run first):
1. Is the subject assigned to this class section? (check ClassSubject table)
2. Is the teacher assigned to this subject? (check TeacherSubject table)
3. For THEORY: is slotStart between 1–6? Is slotEnd === slotStart?
4. For LAB: is slotStart === 5 and slotEnd === 6?

---

## All API Endpoints

### Teachers

| Method | Path | Description |
|--------|------|-------------|
| GET | /api/teachers | List all teachers |
| GET | /api/teachers/:id | Get teacher by ID |
| POST | /api/teachers | Create teacher |
| PUT | /api/teachers/:id | Update teacher |
| DELETE | /api/teachers/:id | Delete teacher |
| POST | /api/teachers/:id/subjects | Assign subject to teacher |
| DELETE | /api/teachers/:id/subjects/:subjectId | Remove subject from teacher |
| GET | /api/teachers/:id/subjects | Get teacher's assigned subjects |
| GET | /api/teachers/:id/schedule | Get teacher's full weekly timetable |

### Subjects

| Method | Path | Description |
|--------|------|-------------|
| GET | /api/subjects | List all subjects |
| GET | /api/subjects/:id | Get subject by ID |
| POST | /api/subjects | Create subject |
| PUT | /api/subjects/:id | Update subject |
| DELETE | /api/subjects/:id | Delete subject |

### Classes

| Method | Path | Description |
|--------|------|-------------|
| GET | /api/classes | List all class sections |
| GET | /api/classes/:id | Get class section by ID |
| POST | /api/classes | Create class section |
| PUT | /api/classes/:id | Update class section |
| DELETE | /api/classes/:id | Delete class section |
| POST | /api/classes/:id/subjects | Assign subject to class |
| DELETE | /api/classes/:id/subjects/:subjectId | Remove subject from class |
| GET | /api/classes/:id/subjects | Get class's assigned subjects |

### Rooms

| Method | Path | Description |
|--------|------|-------------|
| GET | /api/rooms | List all rooms |
| POST | /api/rooms | Create room |
| PUT | /api/rooms/:id | Update room |
| DELETE | /api/rooms/:id | Delete room |

### Labs

| Method | Path | Description |
|--------|------|-------------|
| GET | /api/labs | List all labs |
| POST | /api/labs | Create lab |
| PUT | /api/labs/:id | Update lab |
| DELETE | /api/labs/:id | Delete lab |

### Timetable

| Method | Path | Description |
|--------|------|-------------|
| GET | /api/timetable/:classSectionId | Get full 6×6 matrix for a class |
| POST | /api/timetable/entry | Add a timetable slot (with conflict check) |
| PUT | /api/timetable/entry/:id | Update a timetable slot (re-runs conflict check) |
| DELETE | /api/timetable/entry/:id | Delete a timetable slot |
| GET | /api/timetable/teacher/:teacherId | Get teacher's weekly schedule |
| GET | /api/timetable/room/:roomId | Get room's weekly occupancy |

---

## Request/Response Shapes

### POST /api/teachers
```json
// Request
{ "name": "Mrs. Simran Choudhary", "abbreviation": "SC" }

// Response 201
{ "id": 1, "name": "Mrs. Simran Choudhary", "abbreviation": "SC" }
```

### POST /api/teachers/:id/subjects
```json
// Request
{ "subjectId": 3 }

// Response 201
{ "id": 5, "teacherId": 1, "subjectId": 3 }
```

### POST /api/subjects
```json
// Request
{ "code": "7ADS41A", "name": "Generative Artificial Intelligence", "type": "THEORY", "creditHours": 4 }

// Response 201
{ "id": 1, "code": "7ADS41A", "name": "Generative Artificial Intelligence", "type": "THEORY", "creditHours": 4 }
```

### POST /api/classes
```json
// Request
{ "branchId": 1, "year": 3 }

// Response 201
{ "id": 1, "branchId": 1, "year": 3, "branch": { "id": 1, "name": "CSE" } }
```

### POST /api/classes/:id/subjects
```json
// Request
{ "subjectId": 5 }

// Response 201
{ "id": 8, "classSectionId": 1, "subjectId": 5 }
```

### POST /api/timetable/entry — THEORY
```json
// Request
{
  "classSectionId": 1,
  "day": 1,
  "slotStart": 1,
  "entryType": "THEORY",
  "subjectId": 2,
  "teacherId": 3,
  "roomId": 1
}

// Response 201
{
  "id": 10,
  "classSectionId": 1,
  "day": 1,
  "slotStart": 1,
  "slotEnd": 1,
  "entryType": "THEORY",
  "subjectId": 2,
  "teacherId": 3,
  "roomId": 1,
  "subject": { "code": "7ADS41A", "name": "Generative Artificial Intelligence" },
  "teacher": { "abbreviation": "ABG", "name": "Mr. Abhisek Gour" },
  "room": { "name": "CSE-9" }
}

// Response 409 (conflict)
{ "error": "CONFLICT", "message": "Teacher ABG is already scheduled on Monday slot 1" }
```

### POST /api/timetable/entry — LAB
```json
// Request
{
  "classSectionId": 1,
  "day": 1,
  "entryType": "LAB",
  "subjectId": 4,
  "labGroups": [
    { "groupName": "A1", "labId": 1, "teacherId": 3 },
    { "groupName": "A2", "labId": 2, "teacherId": 5 },
    { "groupName": "A3", "labId": 3, "teacherId": 7 }
  ]
}
// Note: slotStart=5, slotEnd=6 are always set automatically for LAB — do not pass them

// Response 201
{
  "id": 11,
  "classSectionId": 1,
  "day": 1,
  "slotStart": 5,
  "slotEnd": 6,
  "entryType": "LAB",
  "subjectId": 4,
  "labGroups": [
    { "id": 1, "groupName": "A1", "labId": 1, "teacherId": 3, "lab": { "name": "LAB-7" }, "teacher": { "abbreviation": "ABG" } },
    { "id": 2, "groupName": "A2", "labId": 2, "teacherId": 5, "lab": { "name": "LAB-5" }, "teacher": { "abbreviation": "SM" } },
    { "id": 3, "groupName": "A3", "labId": 3, "teacherId": 7, "lab": { "name": "LAB-6" }, "teacher": { "abbreviation": "PJ" } }
  ]
}
```

### GET /api/timetable/:classSectionId — Matrix Response
```json
{
  "classSectionId": 1,
  "branch": "CSE",
  "year": 3,
  "timetable": {
    "1": {
      "label": "Monday",
      "slots": {
        "1": { "type": "THEORY", "subject": "CV", "teacher": "ABG", "room": "CSE-9" },
        "2": { "type": "THEORY", "subject": "ML in Production", "teacher": "SM", "room": "CSE-9" },
        "3": { "type": "THEORY", "subject": "C & NS", "teacher": "SC", "room": "CSE-9" },
        "4": { "type": "THEORY", "subject": "GAI", "teacher": "SR", "room": "CSE-9" },
        "5": {
          "type": "LAB",
          "subject": "CV LAB",
          "spansSlots": [5, 6],
          "groups": {
            "A1": { "lab": "LAB-7", "teacher": "ABG" },
            "A2": { "lab": "LAB-5", "teacher": "SM" },
            "A3": { "lab": "LAB-6", "teacher": "PJ" }
          }
        },
        "6": { "type": "LAB_CONTINUATION", "mergedWith": 5 }
      }
    },
    "2": { "label": "Tuesday", "slots": { ... } },
    ...
  }
}
```

---

## Error Handling

All errors follow this shape:
```json
{ "error": "ERROR_CODE", "message": "Human readable message" }
```

Standard HTTP status codes:
- `400` — Validation error (missing fields, invalid values)
- `404` — Resource not found
- `409` — Conflict (teacher/room already booked, duplicate assignment)
- `422` — Business rule violation (subject not assigned to class, teacher not assigned to subject)
- `500` — Internal server error

---

## Seed Data

When seeding, create the following:

**Branches**: CSE, IT, AI

**Slot definitions** (for reference — not stored in DB, just constants):
```typescript
export const SLOT_TIMES = {
  1: { label: 'I',   start: '10:00', end: '10:55' },
  2: { label: 'II',  start: '10:55', end: '11:50' },
  3: { label: 'III', start: '11:50', end: '12:45' },
  4: { label: 'IV',  start: '14:00', end: '14:55' },
  5: { label: 'V',   start: '14:55', end: '15:50' },
  6: { label: 'VI',  start: '15:50', end: '16:45' },
} as const;

export const DAY_LABELS = {
  1: 'Monday', 2: 'Tuesday', 3: 'Wednesday',
  4: 'Thursday', 5: 'Friday', 6: 'Saturday',
} as const;

export const LAB_SLOT_START = 5;
export const LAB_SLOT_END   = 6;
export const LAB_GROUPS     = ['A1', 'A2', 'A3'] as const;
```

---

## Important Implementation Notes

1. **Never expose raw Prisma errors** to the client. Catch and transform them in the service layer.

2. **Conflict checks must be atomic** — run all checks before inserting. Use Prisma transactions for LAB entries (insert parent + 3 child LabGroupEntry records together).

3. **For LAB entries**, `slotStart` and `slotEnd` are ALWAYS set to `5` and `6` in the service — ignore whatever the client sends for these fields.

4. **TeacherSubject and ClassSubject are prerequisites** — before adding a timetable entry, the system MUST verify:
   - Subject is in `ClassSubject` for that class
   - Teacher is in `TeacherSubject` for that subject

5. **Matrix utility** (`utils/timetableMatrix.ts`): Takes flat array of `TimetableEntry[]` and returns the structured 6×6 object. Slot 6 on LAB days returns `{ type: "LAB_CONTINUATION", mergedWith: 5 }`.

6. **DELETE cascade**: Deleting a `TimetableEntry` with `entryType=LAB` must also delete its `LabGroupEntry` children (handled by Prisma's `onDelete: Cascade`).

7. Use `zod` for request validation on all routes.
