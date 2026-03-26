# Vibe Coding Prompt Guide

Use these prompts in order. Always have CLAUDE.md open as context.

---

## Step 1 — Project Setup

```
Using the spec in CLAUDE.md, set up a Node.js + TypeScript + Express + Prisma project.
- Init package.json with scripts: dev, build, start, db:migrate, db:seed
- Create tsconfig.json with strict mode
- Create .env.example with DATABASE_URL
- Create src/index.ts that boots Express on port 3000 with JSON middleware and a /health endpoint
- Install: express, @prisma/client, zod
- Install dev: prisma, typescript, tsx, @types/express, @types/node
```

## Step 2 — Prisma Schema

```
Using the database schema in CLAUDE.md, create prisma/schema.prisma exactly as specified.
Then run: npx prisma migrate dev --name init
```

## Step 3 — Seed File

```
Create prisma/seed.ts that seeds:
- 3 branches: CSE, IT, AI
- 9 class sections (all branch + year combinations: years 2, 3, 4)
- 7 rooms named: R-1 through R-7
- 5 labs named: LAB-1 through LAB-5
- 5 sample teachers with abbreviations
- 10 sample subjects (6 THEORY, 4 LAB)
Use the SLOT_TIMES and DAY_LABELS constants from CLAUDE.md
```

## Step 4 — Error Handler + Zod Middleware

```
Create src/middleware/errorHandler.ts that:
- Catches Prisma errors (P2002 unique violation → 409, P2025 not found → 404)
- Catches ZodError → 400 with field-level messages
- Catches custom AppError class with a statusCode field
- Falls back to 500 for everything else
- Always returns { error: string, message: string }

Create src/utils/AppError.ts with a custom error class that has statusCode and errorCode fields.
```

## Step 5 — Teachers Module

```
Using CLAUDE.md API spec, build the complete teachers module:
- src/routes/teacher.routes.ts
- src/controllers/teacher.controller.ts
- src/services/teacher.service.ts

Endpoints to implement:
  GET    /api/teachers
  GET    /api/teachers/:id
  POST   /api/teachers           body: { name, abbreviation }
  PUT    /api/teachers/:id       body: { name?, abbreviation? }
  DELETE /api/teachers/:id
  POST   /api/teachers/:id/subjects   body: { subjectId }
  DELETE /api/teachers/:id/subjects/:subjectId
  GET    /api/teachers/:id/subjects
  GET    /api/teachers/:id/schedule   (return all TimetableEntries where teacherId = :id)

Validate all inputs with zod. Return 404 if resource not found. Return 409 on duplicate assignment.
```

## Step 6 — Subjects Module

```
Using CLAUDE.md API spec, build the complete subjects module:
- src/routes/subject.routes.ts
- src/controllers/subject.controller.ts
- src/services/subject.service.ts

Endpoints:
  GET    /api/subjects
  GET    /api/subjects/:id
  POST   /api/subjects     body: { code, name, type: "THEORY"|"LAB", creditHours }
  PUT    /api/subjects/:id
  DELETE /api/subjects/:id

Validate with zod. Subject type must be "THEORY" or "LAB" enum.
```

## Step 7 — Classes Module

```
Build the classes module per CLAUDE.md:
- src/routes/class.routes.ts
- src/controllers/class.controller.ts
- src/services/class.service.ts

Endpoints:
  GET    /api/classes
  GET    /api/classes/:id          (include branch name)
  POST   /api/classes              body: { branchId, year }  (year must be 2|3|4)
  PUT    /api/classes/:id
  DELETE /api/classes/:id
  POST   /api/classes/:id/subjects   body: { subjectId }
  DELETE /api/classes/:id/subjects/:subjectId
  GET    /api/classes/:id/subjects   (include subject details)

Return 409 on duplicate [branchId, year] combination.
```

## Step 8 — Rooms and Labs Modules

```
Build rooms and labs modules per CLAUDE.md:

Rooms:
  GET/POST /api/rooms
  PUT/DELETE /api/rooms/:id
  body: { name, capacity? }

Labs:
  GET/POST /api/labs
  PUT/DELETE /api/labs/:id
  body: { name, capacity? }

Simple CRUD, no special logic.
```

## Step 9 — Timetable Matrix Utility

```
Create src/utils/timetableMatrix.ts

It exports one function: buildMatrix(entries: TimetableEntry[])

The function takes a flat array of TimetableEntry records (with relations included)
and returns this structure:
{
  "1": { label: "Monday", slots: { "1": {...}, "2": {...}, ... "6": {...} } },
  "2": { label: "Tuesday", ... },
  ...
  "6": { label: "Saturday", ... }
}

Slot cell shapes:
- Empty slot: null
- THEORY slot: { type: "THEORY", subjectCode, subjectName, teacherAbbr, roomName }
- LAB slot (slotStart=5): { type: "LAB", subjectCode, subjectName, spansSlots: [5,6], groups: { A1: {lab, teacher}, A2: {...}, A3: {...} } }
- LAB continuation (slot 6 when lab exists on slot 5): { type: "LAB_CONTINUATION", mergedWith: 5 }

Use DAY_LABELS constant from CLAUDE.md.
```

## Step 10 — Timetable Service (Conflict Detection)

```
Create src/services/timetable.service.ts

This is the most important service. Implement exactly per the conflict detection rules in CLAUDE.md:

Functions to implement:

1. validateAndCreateTheoryEntry(data):
   - Validate subject is assigned to class (check ClassSubject)
   - Validate teacher is assigned to subject (check TeacherSubject)
   - Check teacher conflict: any TimetableEntry with same teacherId + day + slotStart
   - Check room conflict: any TimetableEntry with same roomId + day + slotStart
   - If all clear: create TimetableEntry with slotEnd = slotStart
   - Throw AppError(409) with descriptive message on any conflict

2. validateAndCreateLabEntry(data):
   - Validate subject is assigned to class
   - labGroups must have exactly 3 entries: A1, A2, A3
   - For each group, validate teacher is assigned to subject
   - For slots 5 AND 6:
     - Check each group's teacher: any TimetableEntry where teacherId matches AND day matches AND (slotStart=5 OR slotStart=6)
     - Also check LabGroupEntry for that teacher on same day/slots
     - Check each group's lab: any LabGroupEntry where labId matches, joined to TimetableEntry on same day/slots
   - If all clear: use Prisma transaction to create TimetableEntry (slotStart=5, slotEnd=6) + 3 LabGroupEntry records
   - Throw AppError(409) with descriptive message on any conflict

3. deleteEntry(id): delete TimetableEntry (cascade deletes LabGroupEntry children)

4. updateEntry(id, data): delete + re-create (simplest safe approach)

5. getClassTimetable(classSectionId): fetch all entries with relations, pass to buildMatrix()

6. getTeacherSchedule(teacherId): fetch all TimetableEntry where teacherId = id, also fetch LabGroupEntry where teacherId = id

7. getRoomOccupancy(roomId): fetch all TimetableEntry where roomId = id
```

## Step 11 — Timetable Controller + Routes

```
Create src/controllers/timetable.controller.ts and src/routes/timetable.routes.ts

Wire up these endpoints per CLAUDE.md:
  GET    /api/timetable/:classSectionId
  POST   /api/timetable/entry
  PUT    /api/timetable/entry/:id
  DELETE /api/timetable/entry/:id
  GET    /api/timetable/teacher/:teacherId
  GET    /api/timetable/room/:roomId

For POST, detect entryType from request body and call the correct service method.
Use zod schemas for validation — separate schemas for THEORY and LAB requests.
```

## Step 12 — Wire Everything Together

```
Update src/index.ts to:
- Mount all routers under /api prefix
- Add the errorHandler middleware as the last middleware
- Add a global 404 handler for unknown routes
- Log startup message with port number
```

## Step 13 — Test the Happy Path

```
Create a Bruno/Postman collection file (JSON) with these test requests in order:
1. Create branch CSE
2. Create a teacher
3. Create a subject
4. Assign subject to teacher
5. Create a class section
6. Assign subject to class
7. Create a room
8. Create a lab
9. POST a THEORY timetable entry
10. POST the same entry again (expect 409)
11. GET the timetable matrix for the class
```
