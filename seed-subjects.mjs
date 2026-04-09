// seed-subjects.mjs  — run with: node seed-subjects.mjs
const BASE = "http://localhost:3000";

// All subjects from data.md.
// Duplicated codes: kept first occurrence, logged the rest.
// abbreviation = subject code (already short enough to serve as abbr).
const subjects = [
  { code: "6CSE41A", name: "Neural Networks",                               type: "THEORY", creditHours: 3 },
  { code: "6ADS42A", name: "Natural Language Processing",                   type: "THEORY", creditHours: 3 },
  { code: "6ADS51A", name: "Big Data Analytics",                            type: "THEORY", creditHours: 4 },
  { code: "6CSE11A", name: "Robotics and Embedded System",                  type: "THEORY", creditHours: 3 },
  // 6CSE11A "Image Processing" skipped — duplicate code (keeping first)
  { code: "6CSE11B", name: "Neural Networks Laboratory",                    type: "LAB",    creditHours: 2 },
  // 6CSE11B "Robotics and Embedded System Laboratory" skipped — duplicate code
  // 6CSE11B "Image Processing Laboratory" skipped — duplicate code
  { code: "6ADS13B", name: "Big Data Analytics Laboratory",                 type: "LAB",    creditHours: 2 },
  { code: "4ADS41A", name: "Design and Analysis of Algorithms",             type: "THEORY", creditHours: 4 },
  { code: "4ADS42A", name: "Web Technologies",                              type: "THEORY", creditHours: 3 },
  { code: "4ADS43A", name: "Computer Networks",                             type: "THEORY", creditHours: 4 },
  { code: "4ADS44A", name: "Database Management Systems",                   type: "THEORY", creditHours: 4 },
  { code: "4ADS35A", name: "Fundamentals of Statistical Inference",         type: "THEORY", creditHours: 3 },
  { code: "4ADS42B", name: "Web Technologies Laboratory",                   type: "LAB",    creditHours: 2 },
  { code: "4ADS43B", name: "Computer Networks Laboratory",                  type: "LAB",    creditHours: 2 },
  { code: "4ADS44B", name: "Database Management Systems Laboratory",        type: "LAB",    creditHours: 2 },
  { code: "4ADS35B", name: "Statistical Inference using Python Laboratory", type: "LAB",    creditHours: 3 },
  { code: "4IT41A",  name: "Design and Analysis of Algorithms",             type: "THEORY", creditHours: 4 },
  { code: "4IT42A",  name: "Web Technologies",                              type: "THEORY", creditHours: 3 },
  { code: "4IT43A",  name: "Computer Networks",                             type: "THEORY", creditHours: 4 },
  { code: "4IT44A",  name: "Database Management Systems",                   type: "THEORY", creditHours: 4 },
  { code: "4IT45A",  name: "Computer Organization and Architecture",        type: "THEORY", creditHours: 3 },
  { code: "4IT42B",  name: "Web Technologies Laboratory",                   type: "LAB",    creditHours: 2 },
  { code: "4IT43B",  name: "Computer Networks Laboratory",                  type: "LAB",    creditHours: 2 },
  { code: "4IT44B",  name: "Database Management Systems Laboratory",        type: "LAB",    creditHours: 2 },
  { code: "4IT45B",  name: "Computer Organization and Architecture Laboratory", type: "LAB", creditHours: 2 },
  { code: "6IT41A",  name: "Robotics and Embedded System",                  type: "THEORY", creditHours: 3 },
  { code: "6IT42A",  name: "Wireless and Mobile Computing",                 type: "THEORY", creditHours: 3 },
  { code: "6IT52A",  name: "Modern Web Development",                        type: "THEORY", creditHours: 4 },
  // 6ADS42A "Natural Language Processing" (credits 4) skipped — duplicate code (kept credits:3 above)
  { code: "6CSE53A", name: "Advanced Machine Learning",                     type: "THEORY", creditHours: 4 },
  { code: "6CSE41B", name: "Robotics and Embedded System Laboratory",       type: "LAB",    creditHours: 2 },
  { code: "6IT52B",  name: "Modern Web Development Laboratory",             type: "LAB",    creditHours: 2 },
  { code: "6ADS42B", name: "Natural Language Processing Laboratory",        type: "LAB",    creditHours: 2 },
  { code: "6CSE53B", name: "Advanced Machine Learning Laboratory",          type: "LAB",    creditHours: 2 },
  { code: "4CSE41A", name: "Design and Analysis of Algorithms",             type: "THEORY", creditHours: 4 },
  { code: "4CSE42A", name: "Web Technologies",                              type: "THEORY", creditHours: 3 },
  { code: "4CSE43A", name: "Computer Networks",                             type: "THEORY", creditHours: 4 },
  { code: "4CSE44A", name: "Database Management Systems",                   type: "THEORY", creditHours: 3 },
  { code: "4CSE45A", name: "Computer Organization and Architecture",        type: "THEORY", creditHours: 4 },
  { code: "4CSE42B", name: "Web Technologies Laboratory",                   type: "LAB",    creditHours: 2 },
  { code: "4CSE43B", name: "Computer Networks Laboratory",                  type: "LAB",    creditHours: 2 },
  { code: "4CSE44B", name: "Database Management Systems Laboratory",        type: "LAB",    creditHours: 2 },
  { code: "4CSE45B", name: "Computer Organization and Architecture Laboratory", type: "LAB", creditHours: 2 },
  // 6CSE41A "Robotics and Embedded System" skipped — duplicate code
  { code: "6CSE42A", name: "Principle of Compiler Design",                  type: "THEORY", creditHours: 3 },
  { code: "6CSE51A", name: "Image Processing",                              type: "THEORY", creditHours: 4 },
  { code: "6CSE51B", name: "Image Processing Laboratory",                   type: "LAB",    creditHours: 2 },
];

let ok = 0, fail = 0;

for (const s of subjects) {
  try {
    const res = await fetch(`${BASE}/api/subjects`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ ...s, abbreviation: s.code }),
    });
    const body = await res.json().catch(() => ({}));
    if (res.ok) {
      console.log(`  ✓ [${s.code}] ${s.name}`);
      ok++;
    } else {
      console.error(`  ✗ [${s.code}] ${s.name} — ${body.message ?? res.status}`);
      fail++;
    }
  } catch (e) {
    console.error(`  ✗ [${s.code}] ${s.name} — ${e.message}`);
    fail++;
  }
}

console.log(`\nDone: ${ok} inserted, ${fail} failed.`);
