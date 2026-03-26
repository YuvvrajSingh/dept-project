# Screen Specifications

---

## 1. Dashboard  `/`

### Data to fetch on mount
- GET /api/teachers        → count
- GET /api/subjects        → count
- GET /api/classes         → count
- GET /api/rooms           → count
- GET /api/labs            → count

### Layout
- 5 stat cards in a row: Teachers / Subjects / Classes / Rooms / Labs
- Each card: icon + label + count number
- Below cards: 5 quick-action buttons → navigate to the relevant master data tab

### Behaviour
- Fetch all 5 in parallel (Promise.all)
- Show Spinner until all resolve
- No interactions beyond the navigation buttons

---

## 2. Master Data  `/master`

### Layout
- Horizontal tabs: Teachers | Subjects | Rooms | Labs | Classes
- Active tab renders a DataTable for that entity
- "Add New" button top-right of each tab opens EntityDrawer in "create" mode

### DataTable columns per entity

**Teachers**: Name | Short Name | Email | Actions (Edit, Delete)
**Subjects**: Name | Code | Type (THEORY/LAB badge) | Actions
**Rooms**: Name | Capacity | Actions
**Labs**: Name | Capacity | Actions
**Classes**: Branch | Year | Section | Actions

### EntityDrawer (slide-in from right, ~400px wide)
- Title: "Add Teacher" / "Edit Teacher" etc.
- Form fields per entity:

  Teachers:
    - Name (text, required)
    - Short Name (text, required, max 6 chars)
    - Email (email, optional)

  Subjects:
    - Name (text, required)
    - Code (text, required)
    - Type (select: THEORY | LAB, required)

  Rooms:
    - Name (text, required)
    - Capacity (number, optional)

  Labs:
    - Name (text, required)
    - Capacity (number, optional)

  Classes:
    - Branch (select: CSE | IT | AI, required)
    - Year (select: 2 | 3 | 4, required)
    - Section (text, optional)

- Submit calls POST (create) or PUT (edit)
- On success: close drawer, re-fetch table data, show success Toast
- On error: show error message inline below the form (not a Toast)
- Delete: confirmation inline ("Are you sure? [Cancel] [Delete]") before calling DELETE

---

## 3. Assignments  `/assignments`

### Layout
- Two panels side by side (50/50)
- Left panel: Teacher → Subject assignments
- Right panel: Class → Subject assignments

### Left Panel: Teacher Subjects
- Dropdown: select a teacher (loads GET /api/teachers)
- On teacher select: fetch GET /api/teachers/:id/subjects → show assigned subjects as removable chips
- Below chips: "Assign Subject" select dropdown showing all subjects NOT already assigned
- "Assign" button → POST /api/teachers/:id/subjects { subjectId }
- Remove chip → DELETE /api/teachers/:id/subjects/:subjectId
- On 409: show ConflictBanner with message from API
- Re-fetch chips after every assign/remove

### Right Panel: Class Subjects
- Dropdown: select a class (loads GET /api/classes, display as "CSE - 2nd Year")
- On class select: fetch GET /api/classes/:id/subjects → show assigned subjects as removable chips
- "Assign Subject" select + "Assign" button → POST /api/classes/:id/subjects { subjectId }
- Remove chip → DELETE /api/classes/:id/subjects/:subjectId
- On 409: show ConflictBanner with message from API

---

## 4. Timetable Builder  `/builder`

### Layout
- Top bar: Branch select → Year select → resolves to a class → "Load" button
- Main area: TimetableGrid (read-only display of current state)
- Right drawer (or bottom panel): EntryForm — appears when a cell is clicked

### Top bar behaviour
- Branch and Year selects filter the classes list from GET /api/classes
- "Load" fetches GET /api/timetable/:classSectionId and renders the grid
- Show Spinner over grid while fetching

### TimetableGrid
- 6 columns (days Mon–Sat) × 6 rows (slots 1–6)
- Row headers: Slot 1 … Slot 6
- Column headers: Mon Tue Wed Thu Fri Sat
- Cell states:
  - Empty: dim placeholder "+ Add"
  - THEORY: violet chip, shows subject code + teacher short name + room name
  - LAB: coral chip spanning rows 5+6, shows subject code + groups summary
  - LAB_CONTINUATION: gray cell with "↑" text, no click action
- Clicking empty cell → open EntryForm in create mode, pre-fill day + slot
- Clicking filled cell → open EntryForm in edit/delete mode

### EntryForm (shown in a right-side panel or slide-in)

**Mode toggle**: THEORY | LAB (clicking LAB locks slot to 5)

**THEORY fields**:
- Day (select 1–6, pre-filled if cell was clicked)
- Slot (select 1–6, pre-filled if cell was clicked)
- Subject (select — only THEORY type subjects assigned to this class)
- Teacher (select — only teachers assigned to the selected subject)
- Room (select — all rooms from GET /api/rooms)

**LAB fields**:
- Day (select 1–6)
- Slot: display "Slots 5 & 6 (fixed)" — not editable
- Subject (select — only LAB type subjects assigned to this class)
- Group A1: Lab select + Teacher select
- Group A2: Lab select + Teacher select
- Group A3: Lab select + Teacher select
  (Teachers filtered to those assigned to selected subject)

**Submission**:
- POST /api/timetable/entry on create
- PUT /api/timetable/entry/:id on edit
- On 409: show ConflictBanner inline in the form
- On 422: show "Missing assignment — go to Assignments page" with nav link
- On success: close form, re-fetch timetable matrix, show Toast

**Delete** (edit mode only):
- "Delete Entry" button → DELETE /api/timetable/entry/:id
- No confirmation dialog needed (entry is easy to re-create)
- On success: close form, re-fetch matrix, show Toast

---

## 5. Timetable Views  `/views`

### Layout
- Three sub-tabs: Class Matrix | Teacher Schedule | Room Occupancy

### Class Matrix tab
- Class selector (same as builder: Branch + Year dropdowns)
- "Load" button → GET /api/timetable/:classSectionId
- Renders TimetableGrid in read-only mode (no click-to-edit)

### Teacher Schedule tab
- Teacher dropdown (GET /api/teachers)
- "Load" → GET /api/timetable/teacher/:teacherId
- Same TimetableGrid read-only
- Cells show: class name + subject code + room name

### Room Occupancy tab
- Room dropdown (GET /api/rooms)
- "Load" → GET /api/timetable/room/:roomId
- Same TimetableGrid read-only
- Cells show: class name + teacher short name + subject code
