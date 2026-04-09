# 03. Core Algorithm Walkthrough

File: `src/services/autoScheduler.service.ts`

## Step 1: Load Input Class and Subjects

- Fetch class section with its assigned subjects.
- Fail fast if class is missing or has no subjects.

## Step 2: Load Global Resources

- Fetch all teachers with `teacherSubjects`.
- Fetch all rooms and labs.
- Build a `teacherMap: subjectId -> teacherIds[]`.

## Step 3: Build Global Occupancy from Existing Timetable

- Read all `TimetableEntry` records except current class section.
- For each existing THEORY entry:
  - Mark teacher and room occupied for covered slot(s).
- For each existing LAB entry:
  - Mark each lab-group teacher and lab occupied for covered slot(s).

This ensures the new class schedule does not collide with already scheduled classes.

## Step 4: Build Requirement Queues for Target Class

- `unplacedTheories`: one item per theory subject, `remaining = creditHours`.
- `labNeeds`: one item per `(lab subject, groupName)` for A1/A2/A3.

## Step 5: Greedy Placement Loop (Two Passes)

The loop runs for `relaxed in [false, true]`, then `day 1..6`, `slot 1..6`.

### 5A. Try LAB block first (strict pass only)

Condition:

- strict pass only
- slot is one of `[1, 2, 4, 5]` (valid lab starts)
- next slot is free for class
- pending lab requirements exist

Placement behavior:

- Collect candidate lab needs with unique group names.
- For each candidate, pick:
  - a free qualified teacher for both `s` and `s+1`
  - a free lab for both `s` and `s+1`
- Stop at max 2 parallel groups in current implementation.
- If at least one group selected:
  - Create one LAB `TimetableEntry` payload with nested `labGroups`.
  - Mark occupancies for both slots.
  - Remove selected needs from queue.
  - Continue to next slot.

### 5B. Else try THEORY single-slot placement

For each unplaced theory requirement:

- In strict pass, skip if subject already scheduled that day.
- Find free room at `(day,slot)`.
- Find free qualified teacher at `(day,slot)`.
- On success:
  - Add THEORY payload
  - Mark class/teacher/room occupied
  - decrement remaining hours
  - remove from queue if remaining reaches 0

## Step 6: Build Audit Report

After loops:

- If any `labNeeds` remain, list skipped lab requirements.
- If any `unplacedTheories.remaining > 0`, list missed hours.
- If none remain, add success message with generated counts.

## Step 7: Transactional Write

Inside one Prisma transaction:

1. Delete old timetable entries for target class.
2. Bulk insert theory entries (`createMany`).
3. Insert lab entries one-by-one with nested `labGroups.create`.

Atomicity ensures class timetable is replaced consistently.
