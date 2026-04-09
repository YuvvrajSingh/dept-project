# 02. Data Model and Constraints

## Relevant Prisma Models

- `ClassSection`: target entity being scheduled (`branchId`, `year`).
- `Subject`: has `type` (`THEORY` or `LAB`) and `creditHours`.
- `TeacherSubject`: many-to-many capability map of who can teach what.
- `TimetableEntry`: one scheduled entry per class/day/slot (`THEORY` or `LAB`).
- `LabGroupEntry`: nested rows for lab groups (A1/A2/A3) under a LAB entry.

Important uniqueness rule:

```prisma
@@unique([classSectionId, day, slotStart])
```

Meaning: for one class section, one slot can have only one timetable entry.

## Time and Day Domain

From `src/utils/timetableConstants.ts`:

- Days: 1..6 (Monday..Saturday)
- Slots: 1..6
- Lab groups: `A1`, `A2`, `A3`

## Conflict Constraints Enforced by Algorithm

1. Class conflict:
   - Same class cannot be assigned two entries in same day/slot.
2. Teacher conflict:
   - Same teacher cannot be double-booked at same day/slot.
3. Room conflict (theory):
   - Same room cannot be reused in same day/slot.
4. Lab conflict:
   - Same lab cannot host two lab groups at same day/slot.
5. Capability constraints:
   - Teacher chosen for a subject must exist in `TeacherSubject` relation.

## Occupancy Representation

The algorithm materializes conflicts as sparse boolean grids:

- `teacherOcc[teacherId][day][slot]`
- `roomOcc[roomId][day][slot]`
- `labOcc[labId][day][slot]`
- `classOcc[day][slot]` for target class only

This turns conflict checks into O(1)-style hash lookups during placement.
