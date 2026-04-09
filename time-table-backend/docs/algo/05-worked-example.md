# 05. Worked Example

## Input Scenario

Class section: `CSE Year 2` (id = 12)

Assigned subjects:

- DSA (THEORY, creditHours=3)
- DBMS (THEORY, creditHours=3)
- Discrete Math (THEORY, creditHours=2)
- DSA Lab (LAB)

Qualified teachers (simplified):

- DSA -> T1, T2
- DBMS -> T3
- Discrete -> T4
- DSA Lab -> T5, T6

Rooms: R101, R102

Labs: L1, L2

Existing entries from other classes already occupy some teachers/rooms/labs at various slots.

## Queue Construction

Theory queue:

- DSA remaining 3
- DBMS remaining 3
- Discrete remaining 2

Lab queue for one lab subject with 3 groups:

- (A1, DSA Lab)
- (A2, DSA Lab)
- (A3, DSA Lab)

## Placement Flow Snapshot

1. Monday slot 1 (strict pass):
   - LAB attempt succeeds for A1 + A2 in parallel for slots 1 and 2.
   - One LAB entry created with two `labGroups`.
2. Monday slot 3:
   - THEORY attempt places DSA in R101 with T1.
3. Monday slot 4:
   - THEORY places DBMS in R102 with T3.
4. Monday slot 5:
   - THEORY places Discrete in R101 with T4.
5. Continue for all slots/days:
   - subject-per-day rule in strict pass spreads theory subjects.
   - relaxed pass fills leftover theory hours if strict pass could not.

## Possible Generated Records (Illustrative)

Theory payload item:

```json
{
  "classSectionId": 12,
  "day": 1,
  "slotStart": 3,
  "slotEnd": 3,
  "entryType": "THEORY",
  "subjectId": 21,
  "roomId": 2,
  "teacherId": 11
}
```

Lab payload item:

```json
{
  "classSectionId": 12,
  "day": 1,
  "slotStart": 1,
  "slotEnd": 2,
  "entryType": "LAB",
  "labGroups": [
    { "groupName": "A1", "subjectId": 40, "labId": 1, "teacherId": 25 },
    { "groupName": "A2", "subjectId": 40, "labId": 2, "teacherId": 26 }
  ]
}
```

## Audit Outcomes

- Full success case:
  - `Success! 100% of required classes ...`
- Partial failure case:
  - unscheduled lab groups listed
  - missed theory hours listed by subject

This report makes the algorithm transparent for debugging and tuning.
