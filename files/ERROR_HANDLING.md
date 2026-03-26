# Error Handling

---

## API Error Shape
Every non-2xx response from the backend returns:
{
  error: "ERROR_CODE",
  message: "Human readable message"
}

Always display `response.message` to the user — never display `response.error` or hardcode your own text.

---

## Error Type → UI Treatment

### 400 Bad Request (validation)
- Show inline below the form field that caused it, if identifiable
- Otherwise show below the submit button as a red text line
- Do NOT use a Toast for this

### 404 Not Found
- Show a Toast with type="error" and the message
- If it happens on a page-load fetch (not a form submit), show an inline error state
  with message + a "Retry" button

### 409 Conflict
- Render a <ConflictBanner type="conflict"> with the message
- Place it at the TOP of the form or panel where the action was triggered
- Do NOT dismiss automatically — user must fix the conflict and re-submit
- Common causes: teacher/room/lab/class slot already taken

### 422 Prerequisite Missing
- Render a <ConflictBanner type="prerequisite"> with the message
- Add a "Go to Assignments →" button inside the banner
- Clicking it navigates to /assignments
- Common causes: subject not assigned to class, teacher not assigned to subject

### 500 Internal Server Error
- Show a Toast with type="error": use message if present, else "Something went wrong. Try again."
- Log nothing to console in production

---

## Network / Fetch Failure (no response at all)
- Catch fetch-level errors (TypeError: Failed to fetch)
- Show Toast with type="error": "Cannot reach server. Check if backend is running at localhost:3000"

---

## Loading States
- Every fetch must be guarded by a loading boolean
- While loading=true: show <Spinner> in place of the content area
- Never show stale data while a new fetch is in flight — blank it out or overlay with Spinner

---

## Form Submit States
- While submitting: disable all form fields and the submit button
- Show a small spinner inside the submit button (replace button text with spinner)
- Re-enable on success or error

---

## No Data States
- If a list fetch returns an empty array, show a centered message:
  "[Entity] [Icon]  No [entities] found.  [Add New] button"
- Use font: 400 13px 'DM Mono', color: var(--text2)

---

## Error in Assignment Panels
- If assign/remove fails with 409: show ConflictBanner inside the panel, above the chips
- Dismiss the banner when the user changes the selected teacher/class or successfully assigns

---

## Success Feedback
- All successful create/update/delete operations show a Toast type="success"
- Toast text examples:
    "Teacher created"
    "Subject updated"
    "Entry deleted"
    "Subject assigned to teacher"
- Auto-dismiss after 3 seconds
- Simultaneously re-fetch the affected list/grid to show updated state
