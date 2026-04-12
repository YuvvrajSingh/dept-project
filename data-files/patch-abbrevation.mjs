// patch-abbreviations.mjs — run with: node patch-abbreviations.mjs
// Fetches all subjects, matches by code, PUTs the correct abbreviation.

const BASE = "http://localhost:3000";

// Map: subject code → short abbreviation
const ABBR = {
  "6CSE41A": "NN",
  "6ADS42A": "NLP",
  "6ADS51A": "BDA",
  "6CSE11A": "RES",
  "6CSE11B": "NNL",
  "6ADS13B": "BDAL",
  "4ADS41A": "DAA",
  "4ADS42A": "WT",
  "4ADS43A": "CN",
  "4ADS44A": "DBMS",
  "4ADS35A": "FSI",
  "4ADS42B": "WTL",
  "4ADS43B": "CNL",
  "4ADS44B": "DBMSL",
  "4ADS35B": "SIPL",
  "4IT41A": "DAA",
  "4IT42A": "WT",
  "4IT43A": "CN",
  "4IT44A": "DBMS",
  "4IT45A": "COA",
  "4IT42B": "WTL",
  "4IT43B": "CNL",
  "4IT44B": "DBMSL",
  "4IT45B": "COAL",
  "6IT41A": "RES",
  "6IT42A": "WMC",
  "6IT52A": "MWD",
  "6CSE53A": "AML",
  "6CSE41B": "RESL",
  "6IT52B": "MWDL",
  "6ADS42B": "NLPL",
  "6CSE53B": "AMLL",
  "4CSE41A": "DAA",
  "4CSE42A": "WT",
  "4CSE43A": "CN",
  "4CSE44A": "DBMS",
  "4CSE45A": "COA",
  "4CSE42B": "WTL",
  "4CSE43B": "CNL",
  "4CSE44B": "DBMSL",
  "4CSE45B": "COAL",
  "6CSE42A": "PCD",
  "6CSE51A": "IP",
  "6CSE51B": "IPL",
};

// 1. Fetch all subjects
const res = await fetch(`${BASE}/api/subjects`);
const subjects = await res.json();

let ok = 0,
  fail = 0,
  skip = 0;

for (const s of subjects) {
  const abbr = ABBR[s.code];
  if (!abbr) {
    console.log(`  – [${s.code}] no abbreviation mapped, skipping`);
    skip++;
    continue;
  }
  if (s.abbreviation === abbr) {
    console.log(`  = [${s.code}] already correct (${abbr})`);
    skip++;
    continue;
  }

  const r = await fetch(`${BASE}/api/subjects/${s.id}`, {
    method: "PUT",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ abbreviation: abbr }),
  });
  const body = await r.json().catch(() => ({}));
  if (r.ok) {
    console.log(`  ✓ [${s.code}] ${s.name} → ${abbr}`);
    ok++;
  } else {
    console.error(`  ✗ [${s.code}] ${body.message ?? r.status}`);
    fail++;
  }
}

console.log(`\nDone: ${ok} updated, ${fail} failed, ${skip} skipped.`);
