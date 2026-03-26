# API Reference

Base URL: http://localhost:3000
No auth headers needed.
All errors return: { error: "CODE", message: "human readable" }

---

## Teachers

GET    /api/teachers
GET    /api/teachers/:id
POST   /api/teachers          body: { name, shortName, email? }
PUT    /api/teachers/:id      body: { name?, shortName?, email? }
DELETE /api/teachers/:id

GET    /api/teachers/:id/subjects     → array of subjects assigned to teacher
POST   /api/teachers/:id/subjects     body: { subjectId }
DELETE /api/teachers/:id/subjects/:subjectId

GET    /api/teachers/:id/schedule     → timetable entries for this teacher

---

## Subjects

GET    /api/subjects
GET    /api/subjects/:id
POST   /api/subjects          body: { name, code, type }   type = "THEORY" | "LAB"
PUT    /api/subjects/:id      body: { name?, code?, type? }
DELETE /api/subjects/:id

---

## Classes

GET    /api/classes
GET    /api/classes/:id
POST   /api/classes           body: { branch, year, section? }  branch = "CSE"|"IT"|"AI"  year = 2|3|4
PUT    /api/classes/:id       body: { branch?, year?, section? }
DELETE /api/classes/:id

GET    /api/classes/:id/subjects     → array of subjects assigned to this class
POST   /api/classes/:id/subjects     body: { subjectId }
DELETE /api/classes/:id/subjects/:subjectId

---

## Rooms

GET    /api/rooms
POST   /api/rooms             body: { name, capacity? }
PUT    /api/rooms/:id         body: { name?, capacity? }
DELETE /api/rooms/:id

---

## Labs

GET    /api/labs
POST   /api/labs              body: { name, capacity? }
PUT    /api/labs/:id          body: { name?, capacity? }
DELETE /api/labs/:id

---

## Timetable

### Get class timetable matrix
GET /api/timetable/:classSectionId
Returns a matrix object. Shape:
{
  "1": {          ← day number (1=Mon ... 6=Sat)
    "1": null,    ← slot number, null = empty
    "2": {
      type: "THEORY",
      entryId: number,
      subject: { id, name, code },
      teacher: { id, name, shortName },
      room: { id, name }
    },
    "5": {
      type: "LAB",
      entryId: number,
      subject: { id, name, code },
      groups: [
        { groupName: "A1", lab: { id, name }, teacher: { id, name, shortName } },
        { groupName: "A2", lab: { id, name }, teacher: { id, name, shortName } },
        { groupName: "A3", lab: { id, name }, teacher: { id, name, shortName } }
      ]
    },
    "6": { type: "LAB_CONTINUATION" }
  },
  ...
}

### Create THEORY entry
POST /api/timetable/entry
{
  classSectionId: number,
  day: number,          ← 1–6
  slotStart: number,    ← 1–6
  entryType: "THEORY",
  subjectId: number,
  teacherId: number,
  roomId: number
}

### Create LAB entry
POST /api/timetable/entry
{
  classSectionId: number,
  day: number,          ← 1–6
  entryType: "LAB",
  subjectId: number,
  labGroups: [
    { groupName: "A1", labId: number, teacherId: number },
    { groupName: "A2", labId: number, teacherId: number },
    { groupName: "A3", labId: number, teacherId: number }
  ]
}
Note: slotStart is NOT sent for LAB — backend always places it at slots 5+6

### Update entry
PUT /api/timetable/entry/:id
Same body shape as create (THEORY or LAB), minus classSectionId

### Delete entry
DELETE /api/timetable/entry/:id

### Teacher schedule
GET /api/timetable/teacher/:teacherId
Returns same matrix shape as class timetable

### Room occupancy
GET /api/timetable/room/:roomId
Returns same matrix shape
