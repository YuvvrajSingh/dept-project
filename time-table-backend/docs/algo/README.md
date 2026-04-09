# Timetable Auto-Generation Algorithm Report

This folder documents how `time-table-backend` auto-generates a timetable.

## Files

1. `01-overview.md`
   - Purpose, scope, and high-level scheduling strategy.
2. `02-data-model-and-constraints.md`
   - Prisma entities, constraints, and occupancy model used by the algorithm.
3. `03-core-algorithm-walkthrough.md`
   - Step-by-step explanation of `autoSchedulerService.generateTimetable`.
4. `04-code-snippets-and-pseudocode.md`
   - Key code excerpts and pseudocode mapping.
5. `05-worked-example.md`
   - End-to-end sample showing how one class section gets scheduled.
6. `06-api-and-output.md`
   - Route, request shape, response format, and audit report interpretation.
7. `07-limitations-and-improvements.md`
   - Current trade-offs and practical next improvements.

## Source of Truth

The report is based on:

- `src/services/autoScheduler.service.ts`
- `src/controllers/timetable.controller.ts`
- `src/routes/timetable.routes.ts`
- `src/utils/timetableConstants.ts`
- `prisma/schema.prisma`

## Quick Summary

The generator is a greedy, conflict-aware scheduler that:

- Initializes occupancy from all existing timetable entries (excluding the target class).
- Builds queues of required THEORY hours and LAB group needs.
- Iterates day/slot in two passes:
  - Strict pass: enforces one theory occurrence per subject per day and tries lab blocks first.
  - Relaxed pass: allows repeated theory subject in a day if needed.
- Writes generated entries in one DB transaction.
- Returns an audit report for unscheduled items.
