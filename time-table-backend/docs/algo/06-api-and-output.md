# 06. API and Output

## Route

Defined in `src/routes/timetable.routes.ts`:

```http
POST /api/timetable/:classSectionId/generate
```

Controller path:

- `timetableController.generateTimetable`
- Dynamically imports `autoSchedulerService`
- Calls `generateTimetable(classSectionId)`

## Example Request

```http
POST /api/timetable/12/generate
Content-Type: application/json

{}
```

Body is not required; class section id comes from URL param.

## Success Response

```json
{
  "success": true,
  "auditReport": [
    "Success! 100% of required classes for this section were completely scheduled. Generated 8 theory slots and 2 lab blocks."
  ]
}
```

## Partial Scheduling Response

```json
{
  "success": true,
  "auditReport": [
    "Warning: Could not schedule 1 individual lab group requirements due to lack of teachers/rooms.",
    "- Skipped Lab: Group A3 for DSA Lab",
    "Warning: Could not schedule the following theory hours due to Teacher/Room conflicts:",
    "- DBMS: Missed 1 periods."
  ]
}
```

Note: `success: true` means the generation process completed technically. It does not guarantee all academic requirements were placed. The `auditReport` is the quality/result indicator.
