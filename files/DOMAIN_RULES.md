# Domain Rules

These are non-negotiable business rules. The UI must enforce them BEFORE sending requests
where possible, and handle backend rejections gracefully where not.

---

## Days
- Days are numbers 1–6
- Display labels: 1=Mon, 2=Tue, 3=Wed, 4=Thu, 5=Fri, 6=Sat
- Always send the number, never the string

## Slots
- Slots are numbers 1–6
- THEORY can be placed in any slot 1–6
- LAB always occupies slots 5 AND 6 — the user never chooses the slot for LAB
- Lock the slot selector in the UI when LAB type is selected (hide it entirely or show "Slots 5 & 6 (fixed)")

## Subject types
- THEORY subjects go in THEORY entries
- LAB subjects go in LAB entries
- When filtering subjects in the entry form, only show subjects matching the selected entry type

## LAB groups
- Every LAB entry must have exactly 3 groups: A1, A2, A3
- Each group needs its own: labId, teacherId
- The groupName is always A1/A2/A3 — not user-editable
- Do not allow form submission until all 3 groups are filled

## Prerequisites before creating a timetable entry
1. The subject must be assigned to the class (class-subject mapping must exist)
2. The teacher must be assigned to the subject (teacher-subject mapping must exist)
   - For LAB: all 3 group teachers must be assigned to the subject

If either mapping is missing, the backend returns 422.
The UI should show: "Missing assignment. Go to Assignments to fix this."
with a link/button navigating to the Assignments page.

## Conflict rules (409 from backend)
A 409 means one of:
- Teacher is already booked at that day+slot
- Room is already booked at that day+slot
- Lab is already booked at that day+slot
- Class already has an entry at that day+slot

Show the backend's message string verbatim. Do not rephrase it.

## Branches
- Valid values: "CSE", "IT", "AI"

## Years
- Valid values: 2, 3, 4
- Display as "2nd Year", "3rd Year", "4th Year"

## Class display
- Format: "{branch} - {year}nd/rd/th Year" e.g. "CSE - 2nd Year"
- If section exists, append it: "CSE - 2nd Year (A)"

## Matrix rendering
- Render a 6-column (days) × 6-row (slots) grid
- Slot 5 LAB cell: render with full LAB content, visually taller or merged with slot 6
- Slot 6 LAB_CONTINUATION cell: render as a gray "↑ continued" placeholder, no content
- Empty cell: render as a dim clickable placeholder
- Clicking a filled cell opens edit/delete options
- Clicking an empty cell opens the entry creation form pre-filled with that day+slot
