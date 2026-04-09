// seed-class-subjects.mjs — assigns subjects to class sections
// Run with: node seed-class-subjects.mjs

const BASE = "http://localhost:3000";

// ── Subject assignments from data.md ────────────────────────────────────────
// Key format: "BRANCH_NAME:SEMESTER"   (branch name as stored in DB)
// The ADS section uses subject codes prefixed "4ADS/6ADS" — branch could be
// stored as "ADS" or "AI"; we detect it dynamically below.
const ASSIGNMENTS = {
  "ADS:4": ["4ADS41A","4ADS42A","4ADS43A","4ADS44A","4ADS35A",
             "4ADS42B","4ADS43B","4ADS44B","4ADS35B"],
  "ADS:6": ["6ADS41A","6ADS42A","6ADS51A","6CSE41A","6CSE51A",
             "6ADS41B","6ADS51B","6CSE41B","6CSE51B"],

  "IT:4":  ["4IT41A","4IT42A","4IT43A","4IT44A","4IT45A",
             "4IT42B","4IT43B","4IT44B","4IT45B"],
  "IT:6":  ["6IT41A","6IT42A","6IT52A","6ADS42A","6CSE53A",
             "6CSE41B","6IT52B","6ADS42B","6CSE53B"],

  "CSE:4": ["4CSE41A","4CSE42A","4CSE43A","4CSE44A","4CSE45A",
             "4CSE42B","4CSE43B","4CSE44B","4CSE45B"],
  "CSE:6": ["6CSE41A","6CSE42A","6CSE51A","6CSE53A","6IT52A",
             "6CSE41B","6CSE51B","6CSE53B","6IT52B"],
};

// ── Fetch classes + subjects ─────────────────────────────────────────────────
const [classRes, subjectRes] = await Promise.all([
  fetch(`${BASE}/api/classes`),
  fetch(`${BASE}/api/subjects`),
]);
const classes  = await classRes.json();
const subjects = await subjectRes.json();

// Build lookup: subject code → id
const subjectByCode = Object.fromEntries(subjects.map(s => [s.code, s.id]));

// Detect what the ADS branch is actually called in the DB
const branchNames = [...new Set(classes.map(c => c.branch?.name).filter(Boolean))];
console.log("Branches in DB:", branchNames);

// "ADS" alias — try "ADS" first, then "AI", then "AID"
const adsBranch = branchNames.find(b => ["ADS","AI","AID"].includes(b)) ?? "ADS";
console.log("Using ADS branch name:", adsBranch, "\n");

// Remap ASSIGNMENTS keys replacing "ADS" with detected name
const resolvedAssignments = {};
for (const [key, codes] of Object.entries(ASSIGNMENTS)) {
  const [branch, sem] = key.split(":");
  const realBranch = branch === "ADS" ? adsBranch : branch;
  resolvedAssignments[`${realBranch}:${sem}`] = codes;
}

// ── Assign ───────────────────────────────────────────────────────────────────
let totalOk = 0, totalFail = 0, totalSkip = 0;

for (const cls of classes) {
  const branchName = cls.branch?.name;
  const key = `${branchName}:${cls.semester}`;
  const codes = resolvedAssignments[key];
  if (!codes) {
    console.log(`  – No mapping for ${key} (class ${cls.id}), skipping`);
    continue;
  }

  console.log(`\n[${key}] Class Section ${cls.id}`);
  let ok = 0, fail = 0, skip = 0;

  for (const code of codes) {
    const subjectId = subjectByCode[code];
    if (!subjectId) {
      console.log(`    ⚠  [${code}] not found in subjects, skipping`);
      skip++; totalSkip++;
      continue;
    }
    const res = await fetch(`${BASE}/api/classes/${cls.id}/subjects`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ subjectId }),
    });
    const body = await res.json().catch(() => ({}));
    if (res.ok) {
      console.log(`    ✓ [${code}]`);
      ok++; totalOk++;
    } else if (res.status === 409 || body.message?.toLowerCase().includes("already")) {
      console.log(`    = [${code}] already assigned`);
      skip++; totalSkip++;
    } else {
      console.error(`    ✗ [${code}] ${body.message ?? res.status}`);
      fail++; totalFail++;
    }
  }
  console.log(`  → ${ok} assigned, ${fail} failed, ${skip} skipped`);
}

console.log(`\n═══════════════════════════════`);
console.log(`Total: ${totalOk} assigned, ${totalFail} failed, ${totalSkip} skipped`);
