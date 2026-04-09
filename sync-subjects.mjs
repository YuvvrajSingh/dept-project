// sync-subjects.mjs — applies the corrections from data.md (Updated)
// Run with: node sync-subjects.mjs

const BASE = "http://localhost:3000";

// Fetch current subjects
const res = await fetch(`${BASE}/api/subjects`);
const existing = await res.json();
const byCode = Object.fromEntries(existing.map(s => [s.code, s]));

// ── 1. Code renames (same subject, code corrected) ──────────────────
const renames = [
  { oldCode: "6CSE41A", newCode: "6ADS41A", name: "Neural Networks",           abbreviation: "NN",   type: "THEORY", creditHours: 3 },
  { oldCode: "6CSE11B", newCode: "6ADS41B", name: "Neural Networks Laboratory", abbreviation: "NNL",  type: "LAB",    creditHours: 2 },
  { oldCode: "6ADS13B", newCode: "6ADS51B", name: "Big Data Analytics Laboratory", abbreviation: "BDAL", type: "LAB", creditHours: 2 },
];

for (const r of renames) {
  const subject = byCode[r.oldCode];
  if (!subject) { console.log(`  – [${r.oldCode}] not found in DB, skipping rename`); continue; }
  const patch = await fetch(`${BASE}/api/subjects/${subject.id}`, {
    method: "PUT",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ code: r.newCode, name: r.name, abbreviation: r.abbreviation, type: r.type, creditHours: r.creditHours }),
  });
  if (patch.ok) console.log(`  ✓ Renamed [${r.oldCode}] → [${r.newCode}] ${r.name}`);
  else console.error(`  ✗ Failed rename [${r.oldCode}]: ${patch.status}`);
}

// ── 2. Delete stale entries no longer in data.md ────────────────────
// 6CSE11A "Robotics and Embedded System" — removed (was a duplicate artifact)
const toDelete = ["6CSE11A"];

for (const code of toDelete) {
  const subject = byCode[code];
  if (!subject) { console.log(`  – [${code}] not in DB, nothing to delete`); continue; }
  const del = await fetch(`${BASE}/api/subjects/${subject.id}`, { method: "DELETE" });
  if (del.ok || del.status === 204) console.log(`  ✓ Deleted [${code}] ${subject.name}`);
  else console.error(`  ✗ Failed delete [${code}]: ${del.status}`);
}

// ── 3. Verify nothing else needs inserting ───────────────────────────
// Refresh list after renames
const res2 = await fetch(`${BASE}/api/subjects`);
const updated = await res2.json();
const updatedCodes = new Set(updated.map(s => s.code));

const expectedCodes = [
  "6ADS41A","6ADS42A","6ADS51A","6ADS41B","6ADS51B",
  "4ADS41A","4ADS42A","4ADS43A","4ADS44A","4ADS35A",
  "4ADS42B","4ADS43B","4ADS44B","4ADS35B",
  "4IT41A","4IT42A","4IT43A","4IT44A","4IT45A",
  "4IT42B","4IT43B","4IT44B","4IT45B",
  "6IT41A","6IT42A","6IT52A","6IT52B",
  "4CSE41A","4CSE42A","4CSE43A","4CSE44A","4CSE45A",
  "4CSE42B","4CSE43B","4CSE44B","4CSE45B",
  "6CSE41A","6CSE42A","6CSE51A","6CSE53A",
  "6CSE41B","6CSE51B","6CSE53B",
];

const missing = expectedCodes.filter(c => !updatedCodes.has(c));
if (missing.length === 0) {
  console.log("\n✅ All expected subject codes are present in DB.");
} else {
  console.log("\n⚠️  Missing codes:", missing);
}

console.log(`\nTotal subjects in DB: ${updated.length}`);
