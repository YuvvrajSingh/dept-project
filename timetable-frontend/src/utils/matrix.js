const DAY_LABELS = {
  1: "Mon",
  2: "Tue",
  3: "Wed",
  4: "Thu",
  5: "Fri",
  6: "Sat",
};

export function createEmptyMatrix() {
  const matrix = {};

  for (let day = 1; day <= 6; day += 1) {
    matrix[String(day)] = {
      label: DAY_LABELS[day],
      slots: {
        "1": null,
        "2": null,
        "3": null,
        "4": null,
        "5": null,
        "6": null,
      },
    };
  }

  return matrix;
}

export function buildTeacherMatrix(schedule) {
  const matrix = createEmptyMatrix();

  (schedule.theoryEntries || []).forEach((entry) => {
    const day = String(entry.day);
    const slot = String(entry.slotStart);
    matrix[day].slots[slot] = {
      type: "THEORY",
      subjectCode: entry.subject.code,
      subjectName: entry.subject.name,
      teacherAbbr: entry.classSection?.branch?.name,
      roomName: entry.room?.name,
    };
  });

  const labByEntry = new Map();
  (schedule.labEntries || []).forEach((lab) => {
    const entryId = lab.timetableEntryId;
    if (!labByEntry.has(entryId)) {
      labByEntry.set(entryId, {
        day: lab.timetableEntry.day,
        subjectCode: lab.timetableEntry.subject.code,
        subjectName: lab.timetableEntry.subject.name,
        groups: {},
      });
    }

    const group = labByEntry.get(entryId);
    group.groups[lab.groupName] = {
      lab: lab.lab.name,
      teacher: schedule.teacher?.abbreviation || "",
    };
  });

  labByEntry.forEach((entry) => {
    const day = String(entry.day);
    matrix[day].slots["5"] = {
      type: "LAB",
      subjectCode: entry.subjectCode,
      subjectName: entry.subjectName,
      spansSlots: [5, 6],
      groups: entry.groups,
    };
    matrix[day].slots["6"] = { type: "LAB_CONTINUATION", mergedWith: 5 };
  });

  return matrix;
}

export function buildRoomMatrix(data) {
  const matrix = createEmptyMatrix();

  (data.entries || []).forEach((entry) => {
    const day = String(entry.day);
    const slot = String(entry.slotStart);
    matrix[day].slots[slot] = {
      type: "THEORY",
      subjectCode: entry.subject.code,
      subjectName: entry.subject.name,
      teacherAbbr: entry.teacher?.abbreviation,
      roomName: `${entry.classSection.branch.name}-${entry.classSection.year}`,
    };
  });

  return matrix;
}
