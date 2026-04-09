# 01. Overview

## Objective

Generate a feasible timetable for one `ClassSection` while respecting shared resources:

- Teachers
- Theory rooms
- Labs
- Existing entries of other class sections

Implementation entry point:

- `autoSchedulerService.generateTimetable(classSectionId)`

## Problem Type

This is a constrained timetabling problem. Exact optimization is hard, so the project uses a fast greedy heuristic with a strict pass + relaxed pass.

## Core Ideas

1. Build **global occupancy matrices** from already scheduled entries.
2. Build **pending requirement queues** for target class:
   - Theory requirements based on subject `creditHours`.
   - Lab requirements per lab subject and group (`A1`, `A2`, `A3`).
3. Sweep timetable grid (`day: 1..6`, `slot: 1..6`) and place:
   - Labs first (in strict pass, with 2-slot block and up to 2 parallel groups).
   - Then theories (1 slot each).
4. Persist generated entries atomically and report unresolved requirements.

## Why Two Passes?

- **Pass 1 (strict)** avoids same theory subject repeated in one day.
- **Pass 2 (relaxed)** drops that rule to maximize completion rate.

This gives a better balance between timetable quality and scheduling completion.
