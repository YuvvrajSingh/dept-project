export const SLOT_TIMES = {
  1: { label: "I", start: "10:00", end: "10:55" },
  2: { label: "II", start: "10:55", end: "11:50" },
  3: { label: "III", start: "11:50", end: "12:45" },
  4: { label: "IV", start: "14:00", end: "14:55" },
  5: { label: "V", start: "14:55", end: "15:50" },
  6: { label: "VI", start: "15:50", end: "16:45" },
} as const;

export const DAY_LABELS = {
  1: "Monday",
  2: "Tuesday",
  3: "Wednesday",
  4: "Thursday",
  5: "Friday",
  6: "Saturday",
} as const;

export const LAB_SLOT_START = 5;
export const LAB_SLOT_END = 6;
export const LAB_GROUPS = ["A1", "A2", "A3"] as const;
