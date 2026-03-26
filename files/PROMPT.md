# Timetable Frontend — LLM Build Prompt

You are building a React SPA for department timetable management.
Read every file in this folder before writing any code.
Follow the specs exactly. Do not invent endpoints or data shapes.

## Stack
- React (Vite)
- Plain CSS (no Tailwind, no UI lib) — use DESIGN_SYSTEM.md for all tokens
- Fetch-based API client (no axios, no React Query)
- React Router v6 for navigation

## What to build
See SCREENS.md for the full screen list and behaviour.
See COMPONENTS.md for the component tree and responsibilities.
See API.md for every endpoint, request shape, and response shape.
See DOMAIN_RULES.md for business rules the UI must enforce.
See DESIGN_SYSTEM.md for fonts, colors, spacing, and component styles.
See ERROR_HANDLING.md for how every error type must be shown.

## Folder structure to create

src/
  api/
    client.js          ← base fetch wrapper
    teachers.js
    subjects.js
    classes.js
    rooms.js
    labs.js
    timetable.js
  components/
    Sidebar.jsx
    StatCard.jsx
    DataTable.jsx
    EntityDrawer.jsx
    TimetableGrid.jsx
    EntryForm.jsx
    Toast.jsx
    ConflictBanner.jsx
    Spinner.jsx
  pages/
    Dashboard.jsx
    MasterData.jsx
    Assignments.jsx
    TimetableBuilder.jsx
    TimetableViews.jsx
  styles/
    global.css
    tokens.css
  App.jsx
  main.jsx

## General rules
- Every page fetches its own data on mount with useEffect + useState
- Never cache timetable data across navigations — always re-fetch
- No optimistic updates on timetable create/update
- Show a Spinner while any fetch is in flight
- All user-visible strings come from the API error message field, never hardcode error text
- console.log nothing in production paths
