# 04. Code Snippets and Pseudocode

## Key Snippet: Two-Pass Search

```ts
for (const relaxed of [false, true]) {
  for (const d of [1, 2, 3, 4, 5, 6]) {
    for (const s of [1, 2, 3, 4, 5, 6]) {
      if (classOcc[d][s]) continue;

      // LAB attempt (strict pass only)
      // THEORY attempt otherwise
    }
  }
}
```

Interpretation:

- First pass prefers distribution quality.
- Second pass prioritizes completion.

## Key Snippet: Lab Start Slots

```ts
const validLabStarts = [1, 2, 4, 5];
```

Because LAB block uses `(s, s+1)`, these starts keep block inside slot range 1..6.

## Key Snippet: Remaining Theory Hours

```ts
const unplacedTheories = classSubjects
  .filter((s) => s.type === "THEORY")
  .map((s) => ({ subject: s, remaining: s.creditHours }));
```

This directly maps academic credit requirement to scheduling quota.

## Pseudocode

```text
function generateTimetable(classSectionId):
  classData = load class + assigned subjects
  if missing or no subjects: error

  teachers, rooms, labs = load global resources
  teacherMap = build subject -> teachers map

  occupancy = init teacherOcc, roomOcc, labOcc
  existing = load timetable entries excluding classSectionId
  mark occupancy from existing

  theoryQueue = build from THEORY subjects (remaining = creditHours)
  labQueue = build (A1, A2, A3 for each LAB subject)

  classOcc = empty
  subjectsToday = empty

  for relaxed in [false, true]:
    for day in 1..6:
      for slot in 1..6:
        if classOcc[day][slot]: continue

        if strict pass and slot can start LAB block:
          selected = choose up to 2 feasible lab groups
          if selected not empty:
            emit LAB payload
            mark occupancy for slot and slot+1
            remove selected from labQueue
            continue

        for each theory in theoryQueue:
          if strict and theory already used today: continue
          room = find free room(day, slot)
          teacher = find free qualified teacher(day, slot)
          if both found:
            emit THEORY payload
            mark occupancy
            theory.remaining -= 1
            if remaining == 0: remove theory
            break

  auditReport = summarize unscheduled lab/theory requirements

  transaction:
    delete target class old entries
    insert generated theory entries
    insert generated lab entries (with nested lab groups)

  return success + auditReport
```

## Time Complexity (Practical View)

Let:

- `D = 6` days
- `S = 6` slots
- `TQ` = number of pending theory subject queues
- `LQ` = number of lab needs
- `R` = rooms
- `L` = labs

Main loop is bounded by `2 * D * S = 72` slot checks. Each check scans small arrays to pick candidates, so runtime is generally fast for departmental scale timetables.
