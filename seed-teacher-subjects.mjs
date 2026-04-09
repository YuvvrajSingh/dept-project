// seed-teacher-subjects.mjs — assigns subjects to teachers from data.md
// Run with: node seed-teacher-subjects.mjs

const BASE = "http://localhost:3000";

// Teacher abbreviation → subject codes to assign
// (matched from data.md by teacher name → abbreviation from DB)
const ASSIGNMENTS = {
  "AG":  ["4ADS41A","4IT41A","4CSE41A"],
  "ABG": ["6ADS41A","6ADS41B","6CSE51A","6CSE51B"],
  "MR":  ["6ADS42A","6ADS42B"],
  "AC":  ["6ADS51A","6ADS51B","4ADS42A","4ADS42B"],
  "ASG": ["6CSE41A","6IT41A","6CSE41B"],
  "PJ":  ["6CSE51A","6CSE51B","6IT52B","6CSE42A"],
  "DC":  ["4ADS43A","4ADS43B","4CSE44A","4CSE44B"],
  "SM":  ["4ADS44A","4ADS44B","4CSE45A","4CSE45B"],
  "SR":  ["4ADS35A","4ADS35B","4CSE42A"],
  "PS":  ["4ADS42B","4ADS44B","6IT52B"],
  "JP":  ["4ADS43B","4ADS44B","4IT44A","4IT44B","6IT42A"],
  "RK":  ["4IT42A","4IT42B","4CSE43B"],
  "NCB": ["4IT43A","4CSE43A","4IT43B"],
  "AP":  ["4IT45A","4IT45B","4CSE42B"],
  "MS":  ["6IT52A","6IT52B"],
  "SC":  ["6CSE53A","6CSE53B"],
  "VA":  ["6CSE41B","6CSE53B"],
};

// Fetch teachers + subjects
const [tRes, sRes] = await Promise.all([
  fetch(`${BASE}/api/teachers`),
  fetch(`${BASE}/api/subjects`),
]);
const teachers = await tRes.json();
const subjects = await sRes.json();

// Lookups
const teacherByAbbr = Object.fromEntries(teachers.map(t => [t.abbreviation, t]));
const subjectByCode = Object.fromEntries(subjects.map(s => [s.code, s]));

let totalOk = 0, totalFail = 0, totalSkip = 0;

for (const [abbr, codes] of Object.entries(ASSIGNMENTS)) {
  const teacher = teacherByAbbr[abbr];
  if (!teacher) {
    console.error(`  ✗ Teacher [${abbr}] not found in DB`);
    totalFail++;
    continue;
  }
  console.log(`\n[${abbr}] ${teacher.name}`);

  for (const code of codes) {
    const subject = subjectByCode[code];
    if (!subject) {
      console.log(`    ⚠  [${code}] subject not found in DB, skipping`);
      totalSkip++;
      continue;
    }
    const res = await fetch(`${BASE}/api/teachers/${teacher.id}/subjects`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ subjectId: subject.id }),
    });
    const body = await res.json().catch(() => ({}));
    if (res.ok) {
      console.log(`    ✓ [${code}] ${subject.name}`);
      totalOk++;
    } else if (res.status === 409 || body.message?.toLowerCase().includes("already")) {
      console.log(`    = [${code}] already assigned`);
      totalSkip++;
    } else {
      console.error(`    ✗ [${code}] ${body.message ?? res.status}`);
      totalFail++;
    }
  }
}

console.log(`\n═══════════════════════════════`);
console.log(`Total: ${totalOk} assigned, ${totalFail} failed, ${totalSkip} skipped`);
