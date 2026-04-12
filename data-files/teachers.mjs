// seed-teachers.mjs — run with: node seed-teachers.mjs
const BASE = "http://localhost:3000";

const teachers = [
  { abbreviation: "ABG", name: "Mr. Abhisek Gour" },
  { abbreviation: "AC", name: "Ms. Arpita Choudhary" },
  { abbreviation: "AG", name: "Dr. Anil Gupta" },
  { abbreviation: "AP", name: "Mr. Aakash Purohit" },
  { abbreviation: "ASG", name: "Dr. Alok Singh Gehlot" },
  { abbreviation: "DC", name: "Ms. Deepika Chopra" },
  { abbreviation: "JP", name: "Ms. Juhi Prihar" },
  { abbreviation: "MR", name: "Ms. Monika Rajpurohit" },
  { abbreviation: "MS", name: "Ms. Meenakshi Shankala" },
  { abbreviation: "NCB", name: "Dr. N. C. Barwar" },
  { abbreviation: "PJ", name: "Ms. Priyanka Joshi" },
  { abbreviation: "PS", name: "Ms. Priya Sharma" },
  { abbreviation: "RK", name: "Mr. Ram Kishore" },
  { abbreviation: "SC", name: "Dr. Simran Choudhary" },
  { abbreviation: "SM", name: "Mr. Shubham Mathur" },
  { abbreviation: "SR", name: "Dr. Shrwan Ram" },
  { abbreviation: "VA", name: "Ms. Vanshika Arya" },
  // XX (Unassigned/Open Slot) skipped — not a real teacher
];

let ok = 0,
  fail = 0;

for (const t of teachers) {
  const res = await fetch(`${BASE}/api/teachers`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(t),
  });
  const body = await res.json().catch(() => ({}));
  if (res.ok) {
    console.log(`  ✓ [${t.abbreviation}] ${t.name}`);
    ok++;
  } else {
    console.error(
      `  ✗ [${t.abbreviation}] ${t.name} — ${body.message ?? res.status}`,
    );
    fail++;
  }
}

console.log(`\nDone: ${ok} inserted, ${fail} failed.`);
