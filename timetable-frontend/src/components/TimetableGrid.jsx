const DAYS = ["1", "2", "3", "4", "5", "6"];
const SLOTS = ["1", "2", "3", "4", "5", "6"];

import { Fragment } from "react";

export default function TimetableGrid({
  matrix,
  onCellClick,
  readOnly,
  loading,
}) {
  if (loading) {
    return <div className="panel" style={{ minHeight: 220 }} />;
  }

  const dayLabels = DAYS.map((day) => matrix?.[day]?.label?.slice(0, 3) || day);

  return (
    <div className="timetable-grid">
      <div className="cell-header" />
      {dayLabels.map((label) => (
        <div className="cell-header" key={label}>
          {label}
        </div>
      ))}

      {SLOTS.map((slot) => (
        <Fragment key={`row-${slot}`}>
          <div className="cell-header">{`Slot ${slot}`}</div>
          {DAYS.map((day) => {
            const cell = matrix?.[day]?.slots?.[slot] ?? null;
            const key = `${day}-${slot}`;

            if (!cell) {
              return (
                <button
                  key={key}
                  type="button"
                  className="cell-empty"
                  disabled={readOnly}
                  onClick={() => !readOnly && onCellClick(day, slot, null)}
                >
                  {readOnly ? "" : "+ Add"}
                </button>
              );
            }

            if (cell.type === "LAB") {
              const groupEntries = Object.entries(cell.groups || {}).sort(
                ([a], [b]) => a.localeCompare(b),
              );
              const groupValues = groupEntries.map(([, value]) => value);
              const groupLabels = groupEntries.map(([groupName]) => groupName);
              const subjectSummary = [
                ...new Set(groupValues.map((group) => group.subjectCode)),
              ].join(" / ");
              return (
                <button
                  key={key}
                  type="button"
                  className="cell-lab"
                  disabled={readOnly}
                  onClick={() => !readOnly && onCellClick(day, slot, cell)}
                >
                  <div className="cell-title">{subjectSummary || "LAB"}</div>
                  <div className="cell-sub">
                    Groups | {groupLabels.join(" ")}
                  </div>
                  <div className="cell-sub">
                    {groupEntries
                      .map(([groupName, group]) => `${groupName}:${group.lab}`)
                      .join(" | ")}
                  </div>
                </button>
              );
            }

            return (
              <button
                key={key}
                type="button"
                className="cell-theory"
                disabled={readOnly}
                onClick={() => !readOnly && onCellClick(day, slot, cell)}
              >
                <div className="cell-title">{cell.subjectCode}</div>
                <div className="cell-sub">{cell.teacherAbbr}</div>
                <div className="cell-sub">{cell.roomName}</div>
              </button>
            );
          })}
        </Fragment>
      ))}
    </div>
  );
}
