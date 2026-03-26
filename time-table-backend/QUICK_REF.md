# Quick Reference Card

## Class Sections (9 total)
| Branch | Year 2 | Year 3 | Year 4 |
|--------|--------|--------|--------|
| CSE    | ✓      | ✓      | ✓      |
| IT     | ✓      | ✓      | ✓      |
| AI     | ✓      | ✓      | ✓      |

## Time Slots
| # | Period | Time          |
|---|--------|---------------|
| 1 | I      | 10:00 – 10:55 |
| 2 | II     | 10:55 – 11:50 |
| 3 | III    | 11:50 – 12:45 |
| — | LUNCH  | 12:45 – 14:00 |
| 4 | IV     | 14:00 – 14:55 |
| 5 | V      | 14:55 – 15:50 |
| 6 | VI     | 15:50 – 16:45 |

## Days
Mon=1, Tue=2, Wed=3, Thu=4, Fri=5, Sat=6

## Lab Rules
- Labs ALWAYS use slots 5+6 (double period)
- Every lab = 3 groups: A1, A2, A3
- All groups run same day, same time, different labs, different teachers

## Conflict Rules
| Entry Type | What to Check |
|------------|--------------|
| THEORY     | Teacher @ (day, slot), Room @ (day, slot) |
| LAB        | Each teacher @ (day, slot 5), each teacher @ (day, slot 6), each lab @ (day, slot 5), each lab @ (day, slot 6) |

## Prerequisites Before Adding Timetable Entry
1. Subject must be in ClassSubject for that class
2. Teacher must be in TeacherSubject for that subject

## Key Tables
```
Branch → ClassSection → ClassSubject ← Subject ← TeacherSubject ← Teacher
                     ↓
              TimetableEntry → LabGroupEntry (for LAB type only)
                     ↓              ↓
                   Room            Lab
```

## HTTP Status Codes Used
- 200 OK, 201 Created, 204 No Content
- 400 Validation error, 404 Not found
- 409 Conflict (booking/duplicate), 422 Business rule violation
- 500 Server error
