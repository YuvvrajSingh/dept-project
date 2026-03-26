import { useEffect, useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import { createEntry, deleteEntry, updateEntry } from "../api/timetable";
import { getTeacherSubjects } from "../api/teachers";
import ConflictBanner from "./ConflictBanner";
import Spinner from "./Spinner";

const DAY_OPTIONS = [1, 2, 3, 4, 5, 6];
const SLOT_OPTIONS = [1, 2, 3, 4, 5, 6];
const LAB_GROUPS = ["A1", "A2", "A3"];

function mapIssueFields(status, entryType, message) {
  if (!message) return [];

  if (status === 409) {
    if (message.includes("Class section already has an entry")) {
      return ["day", "slot"];
    }

    if (message.startsWith("Teacher ")) {
      return entryType === "THEORY" ? ["teacher"] : ["labTeacher"];
    }

    if (message.startsWith("Room ")) {
      return ["room"];
    }

    if (message.startsWith("Lab ")) {
      return ["lab"];
    }
  }

  if (status === 422) {
    if (message.includes("Subject is not assigned")) {
      return entryType === "THEORY" ? ["subject"] : ["labSubject"];
    }

    if (message.includes("Teacher is not assigned")) {
      return entryType === "THEORY" ? ["teacher"] : ["labTeacher"];
    }
  }

  return [];
}

export default function EntryForm({
  classSectionId,
  initialDay,
  initialSlot,
  existingEntry,
  onSuccess,
  onClose,
  classSubjects,
  allRooms,
  allLabs,
  allTeachers,
}) {
  const navigate = useNavigate();
  const [entryType, setEntryType] = useState(existingEntry?.type === "LAB" ? "LAB" : "THEORY");
  const [day, setDay] = useState(initialDay || 1);
  const [slot, setSlot] = useState(initialSlot || 1);
  const [subjectId, setSubjectId] = useState("");
  const [teacherId, setTeacherId] = useState("");
  const [roomId, setRoomId] = useState("");
  const [labGroups, setLabGroups] = useState([
    { groupName: "A1", subjectId: "", labId: "", teacherId: "" },
    { groupName: "A2", subjectId: "", labId: "", teacherId: "" },
    { groupName: "A3", subjectId: "", labId: "", teacherId: "" },
  ]);
  const [teacherMap, setTeacherMap] = useState({});
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState("");
  const [conflict, setConflict] = useState("");
  const [prereq, setPrereq] = useState("");
  const [issueFields, setIssueFields] = useState([]);

  const editableEntryId = existingEntry?.entryId || null;

  useEffect(() => {
    setEntryType(existingEntry?.type === "LAB" ? "LAB" : "THEORY");
    setDay(Number(initialDay) || 1);
    setSlot(Number(initialSlot) || 1);

    if (existingEntry?.type === "THEORY") {
      setSubjectId(existingEntry.subjectId ? String(existingEntry.subjectId) : "");
      setTeacherId(existingEntry.teacherId ? String(existingEntry.teacherId) : "");
      setRoomId(existingEntry.roomId ? String(existingEntry.roomId) : "");
      setLabGroups([
        { groupName: "A1", subjectId: "", labId: "", teacherId: "" },
        { groupName: "A2", subjectId: "", labId: "", teacherId: "" },
        { groupName: "A3", subjectId: "", labId: "", teacherId: "" },
      ]);
    } else if (existingEntry?.type === "LAB") {
      setSubjectId("");
      setTeacherId("");
      setRoomId("");
      setLabGroups(
        LAB_GROUPS.map((groupName) => ({
          groupName,
          subjectId: existingEntry.groups?.[groupName]?.subjectId ? String(existingEntry.groups[groupName].subjectId) : "",
          labId: existingEntry.groups?.[groupName]?.labId ? String(existingEntry.groups[groupName].labId) : "",
          teacherId: existingEntry.groups?.[groupName]?.teacherId
            ? String(existingEntry.groups[groupName].teacherId)
            : "",
        })),
      );
    } else {
      setSubjectId("");
      setTeacherId("");
      setRoomId("");
      setLabGroups([
        { groupName: "A1", subjectId: "", labId: "", teacherId: "" },
        { groupName: "A2", subjectId: "", labId: "", teacherId: "" },
        { groupName: "A3", subjectId: "", labId: "", teacherId: "" },
      ]);
    }

    setError("");
    setConflict("");
    setPrereq("");
    setIssueFields([]);
  }, [existingEntry, initialDay, initialSlot]);

  const clearIssueIndicators = () => {
    setConflict("");
    setPrereq("");
    setIssueFields([]);
  };

  useEffect(() => {
    let active = true;

    async function loadTeacherSubjects() {
      try {
        const pairs = await Promise.all(
          allTeachers.map(async (teacher) => {
            const subjects = await getTeacherSubjects(teacher.id);
            return [teacher.id, subjects.map((item) => item.subjectId)];
          }),
        );

        if (!active) return;

        const map = {};
        pairs.forEach(([id, subjectIds]) => {
          map[id] = subjectIds;
        });
        setTeacherMap(map);
      } catch {
        if (active) {
          setTeacherMap({});
        }
      }
    }

    loadTeacherSubjects();

    return () => {
      active = false;
    };
  }, [allTeachers]);

  const subjectsForType = useMemo(
    () => classSubjects.filter((item) => item.subject.type === entryType).map((item) => item.subject),
    [classSubjects, entryType],
  );

  const filteredTeachers = useMemo(() => {
    if (!subjectId) return [];
    return allTeachers.filter((teacher) => (teacherMap[teacher.id] || []).includes(Number(subjectId)));
  }, [subjectId, allTeachers, teacherMap]);

  const labSubjects = useMemo(
    () => classSubjects.filter((item) => item.subject.type === "LAB").map((item) => item.subject),
    [classSubjects],
  );

  const getTeachersForSubject = (groupSubjectId) => {
    if (!groupSubjectId) return [];
    return allTeachers.filter((teacher) => (teacherMap[teacher.id] || []).includes(Number(groupSubjectId)));
  };

  const completeLabGroups = useMemo(
    () =>
      labGroups.filter(
        (group) => Number(group.subjectId) > 0 && Number(group.labId) > 0 && Number(group.teacherId) > 0,
      ),
    [labGroups],
  );

  const hasPartialLabGroup = useMemo(
    () =>
      labGroups.some((group) => {
        const hasSubject = Number(group.subjectId) > 0;
        const hasLab = Number(group.labId) > 0;
        const hasTeacher = Number(group.teacherId) > 0;
        return (hasSubject ? 1 : 0) + (hasLab ? 1 : 0) + (hasTeacher ? 1 : 0) > 0 && !(hasSubject && hasLab && hasTeacher);
      }),
    [labGroups],
  );

  const canSubmitLab =
    entryType === "LAB" &&
    day &&
    slot &&
    completeLabGroups.length >= 1 &&
    !hasPartialLabGroup;

  const canSubmitTheory = entryType === "THEORY" && day && slot && subjectId && teacherId && roomId;

  const handleGroupChange = (groupName, key, value) => {
    setLabGroups((prev) => prev.map((group) => (group.groupName === groupName ? { ...group, [key]: value } : group)));
  };

  const handleSubmit = async (event) => {
    event.preventDefault();
    setSubmitting(true);
    setError("");
    clearIssueIndicators();

    try {
      const payload =
        entryType === "THEORY"
          ? {
              classSectionId,
              day: Number(day),
              slotStart: Number(slot),
              entryType: "THEORY",
              subjectId: Number(subjectId),
              teacherId: Number(teacherId),
              roomId: Number(roomId),
            }
          : {
              classSectionId,
              day: Number(day),
              slotStart: Number(slot),
              entryType: "LAB",
              labGroups: completeLabGroups.map((group) => ({
                groupName: group.groupName,
                subjectId: Number(group.subjectId),
                labId: Number(group.labId),
                teacherId: Number(group.teacherId),
              })),
            };

      if (editableEntryId) {
        await updateEntry(editableEntryId, payload);
      } else {
        await createEntry(payload);
      }

      onSuccess(editableEntryId ? "Entry updated" : "Entry created");
      onClose();
    } catch (err) {
      if (err.status === 409) {
        setConflict(err.message);
        setIssueFields(mapIssueFields(409, entryType, err.message));
      } else if (err.status === 422) {
        setPrereq(err.message);
        setIssueFields(mapIssueFields(422, entryType, err.message));
      } else {
        setError(err.message);
        setIssueFields([]);
      }
    } finally {
      setSubmitting(false);
    }
  };

  const handleDelete = async () => {
    if (!editableEntryId) return;

    setSubmitting(true);
    clearIssueIndicators();
    setError("");

    try {
      await deleteEntry(editableEntryId);
      onSuccess("Entry deleted");
      onClose();
    } catch (err) {
      if (err.status === 409) {
        setConflict(err.message);
        setIssueFields(mapIssueFields(409, entryType, err.message));
      } else {
        setError(err.message);
        setIssueFields([]);
      }
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="panel" style={{ marginTop: 16 }}>
      <div className="page-header">
        <h3>{editableEntryId ? "Edit Entry" : "Create Entry"}</h3>
        <button className="btn btn-ghost" type="button" onClick={onClose} disabled={submitting}>
          Close
        </button>
      </div>

      <ConflictBanner message={conflict} type="conflict" />
      <ConflictBanner
        message={prereq}
        type="prerequisite"
        onGoToAssignments={() => {
          navigate("/assignments");
        }}
      />

      <form onSubmit={handleSubmit}>
        <div className="form-group">
          <label>Entry Type</label>
          <div className="form-row">
            <button
              className={`btn ${entryType === "THEORY" ? "btn-primary" : "btn-ghost"}`}
              type="button"
              disabled={submitting}
              onClick={() => setEntryType("THEORY")}
            >
              THEORY
            </button>
            <button
              className={`btn ${entryType === "LAB" ? "btn-primary" : "btn-ghost"}`}
              type="button"
              disabled={submitting}
              onClick={() => setEntryType("LAB")}
            >
              LAB
            </button>
          </div>
        </div>

        <div className="form-group">
          <label>Day</label>
          <select
            className={issueFields.includes("day") ? "input-error" : ""}
            value={day}
            onChange={(e) => {
              clearIssueIndicators();
              setDay(Number(e.target.value));
            }}
            disabled={submitting}
          >
            {DAY_OPTIONS.map((item) => (
              <option key={item} value={item}>
                {item}
              </option>
            ))}
          </select>
        </div>

        <div className="form-group">
          <label>Slot</label>
          <select
            className={issueFields.includes("slot") ? "input-error" : ""}
            value={slot}
            onChange={(e) => {
              clearIssueIndicators();
              setSlot(Number(e.target.value));
            }}
            disabled={submitting}
          >
            {SLOT_OPTIONS.map((item) => (
              <option key={item} value={item}>
                {item}
              </option>
            ))}
          </select>
        </div>

        {entryType === "THEORY" ? (
          <div className="form-group">
            <label>Subject</label>
            <select
              className={issueFields.includes("subject") ? "input-error" : ""}
              value={subjectId}
              onChange={(e) => {
                clearIssueIndicators();
                setSubjectId(e.target.value);
              }}
              disabled={submitting}
            >
              <option value="">Select subject</option>
              {subjectsForType.map((subject) => (
                <option key={subject.id} value={subject.id}>
                  {subject.code} - {subject.name}
                </option>
              ))}
            </select>
          </div>
        ) : null}

        {entryType === "THEORY" ? (
          <>
            <div className="form-group">
              <label>Teacher</label>
              <select
                className={issueFields.includes("teacher") ? "input-error" : ""}
                value={teacherId}
                onChange={(e) => {
                  clearIssueIndicators();
                  setTeacherId(e.target.value);
                }}
                disabled={submitting || !subjectId}
              >
                <option value="">Select teacher</option>
                {filteredTeachers.map((teacher) => (
                  <option key={teacher.id} value={teacher.id}>
                    {teacher.abbreviation} - {teacher.name}
                  </option>
                ))}
              </select>
            </div>

            <div className="form-group">
              <label>Room</label>
              <select
                className={issueFields.includes("room") ? "input-error" : ""}
                value={roomId}
                onChange={(e) => {
                  clearIssueIndicators();
                  setRoomId(e.target.value);
                }}
                disabled={submitting}
              >
                <option value="">Select room</option>
                {allRooms.map((room) => (
                  <option key={room.id} value={room.id}>
                    {room.name}
                  </option>
                ))}
              </select>
            </div>
          </>
        ) : (
          LAB_GROUPS.map((groupName) => {
            const group = labGroups.find((item) => item.groupName === groupName);
            return (
              <div
                className={`panel ${issueFields.includes("lab") || issueFields.includes("labTeacher") || issueFields.includes("labSubject") ? "field-error" : ""}`}
                key={groupName}
                style={{ marginBottom: 10 }}
              >
                <h4>{groupName}</h4>
                <div className="form-group">
                  <label>Subject</label>
                  <select
                    className={issueFields.includes("labSubject") ? "input-error" : ""}
                    value={group?.subjectId || ""}
                    onChange={(e) => {
                      clearIssueIndicators();
                      handleGroupChange(groupName, "subjectId", e.target.value);
                      handleGroupChange(groupName, "teacherId", "");
                    }}
                    disabled={submitting}
                  >
                    <option value="">Select subject</option>
                    {labSubjects.map((subject) => (
                      <option key={subject.id} value={subject.id}>
                        {subject.code} - {subject.name}
                      </option>
                    ))}
                  </select>
                </div>

                <div className="form-group">
                  <label>Lab</label>
                  <select
                    className={issueFields.includes("lab") ? "input-error" : ""}
                    value={group?.labId || ""}
                    onChange={(e) => {
                      clearIssueIndicators();
                      handleGroupChange(groupName, "labId", e.target.value);
                    }}
                    disabled={submitting}
                  >
                    <option value="">Select lab</option>
                    {allLabs.map((lab) => (
                      <option key={lab.id} value={lab.id}>
                        {lab.name}
                      </option>
                    ))}
                  </select>
                </div>
                <div className="form-group">
                  <label>Teacher</label>
                  <select
                    className={issueFields.includes("labTeacher") ? "input-error" : ""}
                    value={group?.teacherId || ""}
                    onChange={(e) => {
                      clearIssueIndicators();
                      handleGroupChange(groupName, "teacherId", e.target.value);
                    }}
                    disabled={submitting || !group?.subjectId}
                  >
                    <option value="">Select teacher</option>
                    {getTeachersForSubject(group?.subjectId).map((teacher) => (
                      <option key={teacher.id} value={teacher.id}>
                        {teacher.abbreviation} - {teacher.name}
                      </option>
                    ))}
                  </select>
                </div>
              </div>
            );
          })
        )}

        {error ? <div className="error-line">{error}</div> : null}
        {entryType === "LAB" && hasPartialLabGroup ? (
          <div className="error-line">For each selected group, choose Subject, Lab, and Teacher.</div>
        ) : null}

        <div className="form-row">
          <button className="btn btn-primary" type="submit" disabled={submitting || !(canSubmitTheory || canSubmitLab)}>
            {submitting ? <Spinner size="sm" /> : editableEntryId ? "Update Entry" : "Create Entry"}
          </button>
          {editableEntryId ? (
            <button className="btn btn-danger" type="button" onClick={handleDelete} disabled={submitting}>
              Delete Entry
            </button>
          ) : null}
        </div>
      </form>
    </div>
  );
}
