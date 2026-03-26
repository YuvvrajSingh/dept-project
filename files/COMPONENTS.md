# Component Specifications

---

## Sidebar
**File**: src/components/Sidebar.jsx
**Purpose**: Fixed left navigation

Props: none (uses React Router NavLink internally)

Nav items:
  - Dashboard        → /
  - Master Data      → /master
  - Assignments      → /assignments
  - Timetable Builder → /builder
  - Timetable Views  → /views

Visual:
  - 220px wide, full height
  - App name/logo at top
  - Active link highlighted with accent color left border

---

## StatCard
**File**: src/components/StatCard.jsx
**Purpose**: Dashboard summary number card

Props:
  - label: string       e.g. "Teachers"
  - count: number
  - icon: string        emoji or icon char
  - onClick: fn         navigate somewhere

---

## DataTable
**File**: src/components/DataTable.jsx
**Purpose**: Generic list table for master data

Props:
  - columns: Array<{ key: string, label: string, render?: fn }>
  - rows: Array<object>
  - onEdit: fn(row)
  - onDelete: fn(row)
  - loading: boolean

Behaviour:
  - Shows Spinner when loading=true
  - Each row has Edit and Delete buttons in last column
  - Delete shows inline confirmation ("Sure? [No] [Yes]") before calling onDelete

---

## EntityDrawer
**File**: src/components/EntityDrawer.jsx
**Purpose**: Slide-in form panel for create/edit of any master data entity

Props:
  - open: boolean
  - onClose: fn
  - title: string
  - onSubmit: fn(formData) → Promise
  - initialValues: object     (empty object for create)
  - fields: Array<{
      key: string,
      label: string,
      type: "text" | "email" | "number" | "select",
      options?: Array<{ value, label }>,
      required?: boolean,
      maxLength?: number
    }>

Behaviour:
  - Slides in from right, overlay dims background
  - Controlled form — manages own state
  - Submit button disabled while submitting (show inline spinner)
  - On submit error: show error message below form fields
  - On submit success: parent calls onClose

---

## TimetableGrid
**File**: src/components/TimetableGrid.jsx
**Purpose**: The 6×6 matrix display

Props:
  - matrix: object          the API response from GET /api/timetable/:id
  - onCellClick: fn(day, slot, cellData)   null cellData = empty cell
  - readOnly: boolean       if true, clicking does nothing
  - loading: boolean

Days (columns): 1–6 mapped to Mon–Sat
Slots (rows): 1–6

Cell rendering rules:
  - null → <EmptyCell> (dim, shows "+ Add" if not readOnly)
  - { type: "THEORY" } → <TheoryCell> (violet background chip)
  - { type: "LAB" } → <LabCell> (coral, visually larger, spans slot 5+6 display)
  - { type: "LAB_CONTINUATION" } → <ContinuationCell> (gray, "↑ Lab continued", not clickable)

TheoryCell shows:
  - Subject code (bold)
  - Teacher shortName
  - Room name

LabCell shows:
  - Subject code (bold)
  - "Lab | A1 A2 A3" group summary
  - Each group's lab name on hover or in a compact list

ContinuationCell:
  - Greyed out
  - "↑" arrow symbol
  - Not clickable even in non-readOnly mode

---

## EntryForm
**File**: src/components/EntryForm.jsx
**Purpose**: Create/edit/delete a timetable entry

Props:
  - classSectionId: number
  - initialDay: number | null
  - initialSlot: number | null
  - existingEntry: object | null    (null = create mode)
  - onSuccess: fn
  - onClose: fn
  - classSubjects: array           pre-fetched subjects for this class
  - allRooms: array
  - allLabs: array
  - allTeachers: array

Internal state:
  - entryType: "THEORY" | "LAB"
  - day, slot, subjectId, teacherId, roomId (THEORY)
  - day, subjectId, labGroups[3] (LAB)

Rules enforced internally:
  - When entryType = LAB, slot is fixed and not shown
  - Subject dropdown filtered by entryType matching subject.type
  - Teacher dropdown filtered to teachers who have this subject assigned
    → requires fetching GET /api/teachers/:id/subjects for each teacher, OR
    → accept allTeacherSubjectMap as a prop (Map<teacherId, subjectId[]>)
  - All 3 LAB group rows must be filled before submit enabled

---

## ConflictBanner
**File**: src/components/ConflictBanner.jsx
**Purpose**: Red inline banner for 409/422 errors

Props:
  - message: string
  - type: "conflict" | "prerequisite"
  - onGoToAssignments: fn    (only shown when type = "prerequisite")

---

## Toast
**File**: src/components/Toast.jsx
**Purpose**: Temporary success/error notification (top-right corner)

Props:
  - message: string
  - type: "success" | "error"
  - onDismiss: fn

Auto-dismisses after 3 seconds.
Manage toast state in App.jsx via context or prop-drilling from a useToast hook.

---

## Spinner
**File**: src/components/Spinner.jsx
**Purpose**: Loading indicator

Props:
  - size?: "sm" | "md" | "lg"   default "md"
  - overlay?: boolean            if true, centers over parent with semi-transparent bg

---

## API modules (src/api/)

### client.js
Base fetch wrapper:
  export async function request(method, path, body)
  Throws { status, error, message } on non-2xx.

### teachers.js
  export const getTeachers = () => request("GET", "/api/teachers")
  export const getTeacher = (id) => request("GET", `/api/teachers/${id}`)
  export const createTeacher = (body) => request("POST", "/api/teachers", body)
  export const updateTeacher = (id, body) => request("PUT", `/api/teachers/${id}`, body)
  export const deleteTeacher = (id) => request("DELETE", `/api/teachers/${id}`)
  export const getTeacherSubjects = (id) => request("GET", `/api/teachers/${id}/subjects`)
  export const assignTeacherSubject = (id, subjectId) => request("POST", `/api/teachers/${id}/subjects`, { subjectId })
  export const removeTeacherSubject = (id, subjectId) => request("DELETE", `/api/teachers/${id}/subjects/${subjectId}`)
  export const getTeacherSchedule = (id) => request("GET", `/api/teachers/${id}/schedule`)

### subjects.js
  export const getSubjects = () => ...
  export const createSubject = (body) => ...
  export const updateSubject = (id, body) => ...
  export const deleteSubject = (id) => ...

### classes.js
  export const getClasses = () => ...
  export const createClass = (body) => ...
  export const updateClass = (id, body) => ...
  export const deleteClass = (id) => ...
  export const getClassSubjects = (id) => ...
  export const assignClassSubject = (id, subjectId) => ...
  export const removeClassSubject = (id, subjectId) => ...

### rooms.js + labs.js
  Same pattern: get, create, update, delete

### timetable.js
  export const getClassTimetable = (classSectionId) => ...
  export const createEntry = (body) => ...
  export const updateEntry = (id, body) => ...
  export const deleteEntry = (id) => ...
  export const getTeacherTimetable = (teacherId) => ...
  export const getRoomTimetable = (roomId) => ...
