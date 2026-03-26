# Design System

---

## Aesthetic Direction
Dark industrial-utility. Dense information, tight grids, technical feel.
Looks like a control room tool, not a marketing page.
No gradients on buttons. No rounded blobs. No card shadows everywhere.

---

## Fonts
Import from Google Fonts:
  Syne (weights 400, 600, 700, 800)  → headings, nav, labels
  DM Mono (weights 300, 400, 500)    → data, table cells, codes, badges

```html
<link href="https://fonts.googleapis.com/css2?family=Syne:wght@400;600;700;800&family=DM+Mono:ital,wght@0,300;0,400;0,500;1,300&display=swap" rel="stylesheet">
```

Usage:
  font-family: 'Syne', sans-serif;     → h1–h4, nav links, section titles, button labels
  font-family: 'DM Mono', monospace;   → body, table data, input values, badges, codes

---

## Color Tokens (tokens.css)

```css
:root {
  /* Backgrounds */
  --bg:        #0a0a0f;   /* page background */
  --surface:   #111118;   /* sidebar, cards */
  --surface2:  #1a1a24;   /* table rows, inputs */
  --surface3:  #22222f;   /* hover states, drawer bg */
  --border:    #2a2a3a;   /* all borders */

  /* Accents */
  --accent:    #7c6dff;   /* THEORY, primary actions, active nav */
  --accent2:   #ff6b6b;   /* LAB entries, destructive actions */
  --accent3:   #00d4aa;   /* success states, assigned chips */

  /* Text */
  --text:      #e8e8f0;   /* primary text */
  --text2:     #888899;   /* secondary / labels */
  --text3:     #555566;   /* placeholder / disabled */

  /* Semantic */
  --success:   #00c97e;
  --warn:      #ffa940;
  --error:     #ff4d6d;

  /* Cell backgrounds */
  --theory-bg:     #7c6dff1a;
  --theory-border: #7c6dff55;
  --lab-bg:        #ff6b6b1a;
  --lab-border:    #ff6b6b55;
  --empty-bg:      #ffffff05;

  /* Spacing */
  --r:    10px;   /* default border-radius */
  --r-sm: 6px;    /* small radius (badges, chips) */
  --r-lg: 14px;   /* drawer, large cards */
}
```

---

## Spacing Scale
Use multiples of 4px:
  4, 8, 12, 16, 20, 24, 32, 40, 48, 64

---

## Typography Scale

```css
h1  { font: 800 28px/1.2 'Syne'; }
h2  { font: 700 20px/1.3 'Syne'; }
h3  { font: 600 16px/1.4 'Syne'; }
h4  { font: 600 13px/1.4 'Syne'; letter-spacing: 0.06em; text-transform: uppercase; }

body-default  { font: 400 14px/1.6 'DM Mono'; }
body-sm       { font: 300 12px/1.5 'DM Mono'; }
label         { font: 500 11px/1 'DM Mono'; letter-spacing: 0.08em; text-transform: uppercase; color: var(--text2); }
code          { font: 400 13px 'DM Mono'; background: var(--surface2); padding: 2px 6px; border-radius: var(--r-sm); }
```

---

## Layout

```
┌─────────────────────────────────────────────┐
│ Sidebar (220px fixed) │ Main Content (flex 1)│
│                       │ padding: 32px        │
└─────────────────────────────────────────────┘
```

Sidebar:
  - background: var(--surface)
  - border-right: 1px solid var(--border)
  - position: fixed, full height

Main content:
  - margin-left: 220px
  - padding: 32px
  - min-height: 100vh

---

## Component Visual Specs

### Sidebar nav item
```css
.nav-item {
  display: flex; align-items: center; gap: 10px;
  padding: 10px 20px;
  font: 600 13px 'Syne';
  color: var(--text2);
  cursor: pointer;
  border-left: 3px solid transparent;
  transition: all 0.15s;
}
.nav-item:hover { color: var(--text); background: var(--surface2); }
.nav-item.active { color: var(--accent); border-left-color: var(--accent); background: var(--surface2); }
```

### Buttons
```css
.btn {
  font: 600 13px 'Syne';
  padding: 8px 16px;
  border-radius: var(--r-sm);
  border: none;
  cursor: pointer;
  transition: opacity 0.15s;
}
.btn:hover { opacity: 0.85; }
.btn:disabled { opacity: 0.4; cursor: not-allowed; }

.btn-primary  { background: var(--accent);  color: #fff; }
.btn-danger   { background: var(--accent2); color: #fff; }
.btn-ghost    { background: transparent; color: var(--text2); border: 1px solid var(--border); }
.btn-ghost:hover { color: var(--text); border-color: var(--text3); }
```

### Inputs / Selects
```css
input, select {
  width: 100%;
  padding: 9px 12px;
  background: var(--surface2);
  border: 1px solid var(--border);
  border-radius: var(--r-sm);
  color: var(--text);
  font: 400 13px 'DM Mono';
  outline: none;
  transition: border-color 0.15s;
}
input:focus, select:focus { border-color: var(--accent); }
input::placeholder { color: var(--text3); }
```

### DataTable
```css
table { width: 100%; border-collapse: collapse; }
th {
  font: 500 11px/1 'DM Mono';
  letter-spacing: 0.08em;
  text-transform: uppercase;
  color: var(--text2);
  padding: 10px 12px;
  text-align: left;
  border-bottom: 1px solid var(--border);
}
td {
  padding: 12px;
  border-bottom: 1px solid var(--border);
  font: 400 13px 'DM Mono';
  color: var(--text);
}
tr:hover td { background: var(--surface2); }
```

### Badges
```css
.badge {
  display: inline-block;
  padding: 2px 8px;
  border-radius: var(--r-sm);
  font: 500 11px 'DM Mono';
  letter-spacing: 0.04em;
}
.badge-theory { background: var(--theory-bg); color: var(--accent); border: 1px solid var(--theory-border); }
.badge-lab    { background: var(--lab-bg);    color: var(--accent2); border: 1px solid var(--lab-border); }
.badge-success { background: #00c97e1a; color: var(--success); border: 1px solid #00c97e44; }
```

### Timetable Grid
```css
.timetable-grid {
  display: grid;
  grid-template-columns: 60px repeat(6, 1fr);
  grid-template-rows: 36px repeat(6, 72px);
  gap: 1px;
  background: var(--border);
  border: 1px solid var(--border);
  border-radius: var(--r);
  overflow: hidden;
}
.cell-header {
  background: var(--surface2);
  display: flex; align-items: center; justify-content: center;
  font: 600 11px 'Syne';
  letter-spacing: 0.06em;
  color: var(--text2);
}
.cell-empty {
  background: var(--empty-bg);
  cursor: pointer;
  display: flex; align-items: center; justify-content: center;
  color: var(--text3);
  font-size: 18px;
  transition: background 0.15s;
}
.cell-empty:hover { background: var(--surface2); color: var(--text2); }
.cell-theory {
  background: var(--theory-bg);
  border: 1px solid var(--theory-border);
  padding: 8px;
  cursor: pointer;
}
.cell-lab {
  background: var(--lab-bg);
  border: 1px solid var(--lab-border);
  padding: 8px;
  cursor: pointer;
  grid-row: span 2;   /* spans slots 5 and 6 */
}
.cell-continuation {
  background: var(--surface);
  display: flex; align-items: center; justify-content: center;
  color: var(--text3);
  font-size: 12px;
}
```

### EntityDrawer
```css
.drawer-overlay {
  position: fixed; inset: 0;
  background: #00000066;
  z-index: 200;
}
.drawer {
  position: fixed; top: 0; right: 0; bottom: 0;
  width: 400px;
  background: var(--surface);
  border-left: 1px solid var(--border);
  z-index: 201;
  padding: 24px;
  overflow-y: auto;
  animation: slideIn 0.2s ease;
}
@keyframes slideIn { from { transform: translateX(100%); } to { transform: translateX(0); } }
```

### ConflictBanner
```css
.conflict-banner {
  padding: 12px 16px;
  border-radius: var(--r-sm);
  border: 1px solid;
  margin-bottom: 16px;
  font: 400 13px 'DM Mono';
}
.conflict-banner.conflict     { background: #ff4d6d1a; border-color: #ff4d6d55; color: var(--error); }
.conflict-banner.prerequisite { background: #ffa9401a; border-color: #ffa94055; color: var(--warn); }
```

### Toast
```css
.toast {
  position: fixed; top: 24px; right: 24px;
  padding: 12px 20px;
  border-radius: var(--r-sm);
  font: 400 13px 'DM Mono';
  z-index: 999;
  animation: toastIn 0.2s ease;
}
@keyframes toastIn { from { opacity: 0; transform: translateY(-8px); } to { opacity: 1; transform: translateY(0); } }
.toast-success { background: var(--success); color: #000; }
.toast-error   { background: var(--error);   color: #fff; }
```

### StatCard
```css
.stat-card {
  background: var(--surface);
  border: 1px solid var(--border);
  border-radius: var(--r);
  padding: 24px;
  cursor: pointer;
  transition: border-color 0.15s;
}
.stat-card:hover { border-color: var(--accent); }
.stat-card .icon { font-size: 24px; margin-bottom: 12px; }
.stat-card .count { font: 800 36px 'Syne'; color: var(--text); }
.stat-card .label { font: 500 11px 'DM Mono'; color: var(--text2); letter-spacing: 0.08em; text-transform: uppercase; margin-top: 4px; }
```

### Assignment Chips
```css
.chip {
  display: inline-flex; align-items: center; gap: 6px;
  padding: 4px 10px;
  background: var(--surface2);
  border: 1px solid var(--border);
  border-radius: 999px;
  font: 400 12px 'DM Mono';
  color: var(--text);
}
.chip-remove {
  background: none; border: none; cursor: pointer;
  color: var(--text3); font-size: 14px;
  padding: 0; line-height: 1;
}
.chip-remove:hover { color: var(--error); }
```
