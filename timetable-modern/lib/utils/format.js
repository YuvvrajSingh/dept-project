export const BRANCH_OPTIONS = [
  { id: 1, name: "CSE" },
  { id: 2, name: "IT" },
  { id: 3, name: "AI" },
];

export const YEAR_OPTIONS = [2, 3, 4];

export function getYearLabel(year) {
  if (year === 2) return "2nd Year";
  if (year === 3) return "3rd Year";
  return "4th Year";
}

export function getClassLabel(classSection) {
  if (!classSection) return "";
  return `${classSection.branch?.name || "-"} - ${getYearLabel(classSection.year)}`;
}
