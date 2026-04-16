# Teacher Same-Day Class Cancellation - Implementation Plan (v2)

Date: 2026-04-16
Status: Approved for implementation
Scope: In-app timetable notifications only

## 1) Confirmed Product Decisions

1. Cancellation is date-specific and must not mutate weekly timetable template rows.
2. Reason is optional but encouraged in UI (strong nudge with examples).
3. Notifications are in-app timetable indicators only (no email/SMS/WhatsApp in this release).
4. Admin can cancel on behalf of teacher.
5. Undo is allowed on the same date for same teacher or admin.
6. "Today" is calculated server-side using institution timezone, not client clock.
7. If slot start time has passed, cancellation is blocked in service layer.
8. Undo remains allowed even if slot has passed (display correction only).
9. Endpoint behavior must be idempotent under double-tap and race conditions.

## 2) Data Model

### 2.1 New table: EntryCancellation

Create a dedicated table linked to timetable entry and date.

Suggested fields:

- id (Int, PK)
- timetableEntryId (Int, FK -> TimetableEntry)
- cancelDate (String) // Format: YYYY-MM-DD
- reason (String?, optional)
- cancelledByTeacherId (Int?, FK -> Teacher)
- cancelledByAdminId (Int?, FK -> User)
- createdAt (DateTime)
- updatedAt (DateTime)

### 2.2 Uniqueness and race safety

Add unique constraint immediately in first migration:

- @@unique([timetableEntryId, cancelDate])

This must ship before endpoint rollout.

### 2.3 NotificationLog extension & Metadata

Extend NotificationLogType in schema with:

- ENTRY_CANCELLED
- ENTRY_CANCELLATION_UNDONE

Keep writing NotificationLog records to preserve dashboard audit continuity. Store rich JSON in the `metadata` field to avoid complex joins later:

```json
{
  "timetableEntryId": 123,
  "cancelDate": "2026-04-16",
  "reason": "Teacher unwell",
  "actorId": 5,
  "actorRole": "TEACHER"
}
```

## 3) Timezone and time-window rules

### 3.1 Server timezone config

Add env var in backend:

- INSTITUTION_TIMEZONE=Asia/Kolkata

Default to Asia/Kolkata if not set.

### 3.2 Canonical date/time helpers

Create backend utility for:

1. nowInInstitutionTz()
2. institutionTodayDateOnly()
3. isSlotStarted(slot.startTime, now)

Note: backend currently has no timezone lib. Add one dependency (recommended: date-fns-tz) for reliable timezone conversion.

### 3.3 Cancellation cutoff

Service rule:

- If slot start time <= current institution-local time on cancelDate, reject cancellation.
- Error message: This slot has already begun.

## 4) API Design

## 4.1 Teacher/Admin cancel today

POST /api/timetable/entry/:id/cancel-today

Request:

- reason?: string

Auth:

- TEACHER: only own entry
- ADMIN: any entry

Behavior:

1. Resolve entry.
2. Validate entry belongs to institution "today" day-of-week.
3. Validate not started yet.
4. Upsert cancellation by unique key (timetableEntryId, cancelDate).
5. Log ENTRY_CANCELLED.
6. Return cancellation metadata.

Idempotency:

- If already cancelled today, return 200 with existing cancellation payload.

## 4.2 Undo same-day cancellation

POST /api/timetable/entry/:id/undo-cancel-today

Auth:

- Same teacher who cancelled OR admin

Behavior:

1. Find cancellation row for today.
2. If absent, return 200 (idempotent no-op).
3. Undo by performing a **Hard Delete** of the cancellation row. This ensures the `@@unique` constraint doesn't block a teacher if they need to re-cancel the class later the same day.
4. Log ENTRY_CANCELLATION_UNDONE.

## 4.3 Public cancellation feed for selected class

GET /api/public/cancellations/today?classSectionId=<id>

Returns minimal student-safe payload:

- timetableEntryId
- day
- slotOrder
- subjectLabel
- reason (if present)
- cancelledAt

No sensitive actor ids in public payload.

## 5) Backend Integration Points

1. Schema/migration updates in prisma schema.
2. New service functions in timetable service.
3. New route handlers in timetable routes/controller.
4. Public route extension for cancellation feed.
5. Validation with zod for body and params.
6. NotificationLog writes for cancel and undo events.

## 6) Frontend UX and API wiring

### 6.1 Teacher portal timetable UX

Page: timetable-light/src/app/teacher-portal/timetable/page.tsx

Add:

1. Cancel Today action visible only for entries mapped to current institution day.
2. Optional reason field with helper placeholder:
   - Example: teacher unwell, lab unavailable
3. Immediate confirmation toast with Undo action for 30 seconds.
4. After toast window, no persistent undo button in grid.
5. If backend rejects due to slot started, show exact server message.
6. Upon successful cancel/undo, trigger strict cache invalidation (e.g. Next Router refresh or data invalidation) to ensure UI correctly reflects backend state rather than purely optimistic UI updates.

### 6.2 Student public timetable UX

Page: timetable-light/src/app/timetable/page.tsx

Add:

1. Fetch today cancellation feed for selected class.
2. Mark affected cell as Cancelled Today.
3. Show reason if provided.
4. Add top summary banner with count of today cancellations.
5. Poll every 60 seconds for now.

Future note:

- Replace polling with SSE/WebSocket push for near real-time updates.

## 7) Authorization Matrix

1. Teacher cancel own entry before start time: allowed.
2. Teacher cancel another teacher entry: forbidden.
3. Admin cancel any entry before start time: allowed.
4. Teacher undo own same-day cancellation: allowed.
5. Admin undo any same-day cancellation: allowed.
6. Teacher undo another teacher cancellation: forbidden.

## 8) Error Contract (recommended)

Use clear domain messages:

1. This slot has already begun.
2. You can only cancel your own classes.
3. This class is not scheduled for today.
4. Cancellation already exists for today. (optional informational)

## 9) Delivery Slices

### Slice 1 - Backend foundation

1. Prisma changes + migration (including unique constraint).
2. Timezone helper + env plumbing.
3. Cancel today endpoint + idempotency.
4. Undo endpoint + audit log.
5. Public today cancellation endpoint.

Exit criteria:

- All service-layer checks active.
- Race-safe behavior verified.

### Slice 2 - Teacher portal

1. API client methods.
2. Cancel modal + optional reason.
3. 30s undo toast.
4. Error handling and visual states.

Exit criteria:

- Teacher can cancel/undo correctly under permissions and time rules.

### Slice 3 - Student timetable

1. Cancellation feed integration.
2. Cell highlights and reason rendering.
3. Banner summary and 60s polling.

Exit criteria:

- Public page reflects cancellations without refresh.

### Slice 4 - hardening

1. Test coverage.
2. Documentation updates.
3. Optional dashboard filter by cancel/undo events.

## 10) Test Matrix

### Backend

1. Double submit cancel produces one row only.
2. Concurrent cancel calls remain idempotent.
3. Cancel blocked after slot start.
4. Undo same day succeeds for owner/admin.
5. Public endpoint returns only class-specific today cancellations.

### Frontend

1. Cancel action only on valid entries.
2. Undo toast appears for 30 seconds and works.
3. Public timetable marks cancelled slots accurately.
4. Polling updates UI within one cycle.

## 11) Non-goals for this release

1. Email/SMS/push notifications.
2. Historical cancellation analytics UI.
3. Real-time sockets transport (planned enhancement).
4. Rescheduling or Make-up classes.
